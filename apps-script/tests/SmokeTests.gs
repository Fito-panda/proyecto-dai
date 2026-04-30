/**
 * SmokeTests.gs — prueba rapida del pipeline sin crear los 11 forms.
 *
 * runSmokeTests() ejecuta 5 bloques:
 *   1. FormBuilder applyItem pipeline (Fase 0) — crea folder + form + sheet
 *      temporal, aplica 1 item de cada tipo, valida count, linkea Sheet, cleanup.
 *   2. readConfigFromSheet() error handling (Fase 1) — valida mensaje canónico
 *      cuando la pestaña '_respuestas_config' no existe.
 *   3. ConfigSheetBuilder idempotency (Fase 2) — valida que sobre un Sheet
 *      temporal, 1ra corrida crea 8 pestañas y 2da reusa 8 sin duplicar.
 *   4. R1 fixes unitarios (2026-04-21) — _parseSiNo, _parseInteger,
 *      PhaseFilter contextual con cooperadora_activa.
 *   5. Fase 2.5 DocGen unitario (2026-04-21) — _slugify, _normalizeResponseData,
 *      _extractResponseData (R2 fix 2026-04-21 para Form-based triggers),
 *      coherencia DOC_TEMPLATES ↔ DocTemplateBuilder ↔ FormalFormsTriggerManager.
 */

function runSmokeTests() {
  const testStartedAt = new Date();
  const tag = 'DAI-SmokeTest-' + testStartedAt.getTime();
  console.log('===== Smoke test: ' + tag + ' =====');

  const folder = DriveApp.createFolder(tag);
  const createdIds = { folder: folder.getId() };

  try {
    const ss = SpreadsheetApp.create(tag + '-Sheet');
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    createdIds.sheet = ss.getId();

    const form = FormApp.create(tag + '-Form');
    DriveApp.getFileById(form.getId()).moveTo(folder);
    createdIds.form = form.getId();

    const ctx = {
      folders: { '': folder, 'dummy': folder },
      masterLists: { docentes: ['A', 'B', 'C'] }
    };

    const testItems = [
      { type: FIELD_TYPES.SHORT_TEXT, title: 'Short' },
      { type: FIELD_TYPES.PARAGRAPH, title: 'Paragraph' },
      { type: FIELD_TYPES.MULTIPLE_CHOICE, title: 'Multi', choices: ['X', 'Y'] },
      { type: FIELD_TYPES.CHECKBOX, title: 'Check', choices: ['A', 'B'] },
      { type: FIELD_TYPES.DROPDOWN, title: 'Drop', choicesFromList: 'docentes' },
      { type: FIELD_TYPES.DATE, title: 'Date' },
      { type: FIELD_TYPES.FILE_UPLOAD, title: 'File', folderPath: 'dummy' }
    ];

    testItems.forEach(function(itemCfg) {
      FormBuilder._applyItem(form, itemCfg, ctx);
    });

    Guard.assert(form.getItems().length === testItems.length,
      'Cantidad de items aplicados no coincide');

    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    console.log('PASS: form creado con ' + form.getItems().length + ' items, sheet linkeado');
    console.log('Form URL: ' + form.getPublishedUrl());

  } finally {
    console.log('Limpiando artifacts de test...');
    Object.keys(createdIds).forEach(function(key) {
      try {
        DriveApp.getFileById(createdIds[key]).setTrashed(true);
      } catch (err) { /* folder se borra abajo */ }
    });
    try {
      folder.setTrashed(true);
    } catch (err) {
      console.log('No se pudo borrar folder de test: ' + err);
    }
  }

  testReadConfigFromSheet();
  testConfigSheetBuilderIdempotency();
  testR1FixesUnit();
  testFase25DocGenUnit();

  console.log('===== Smoke test OK (' +
    ((new Date()) - testStartedAt) + ' ms) =====');
}

function testReadConfigFromSheet() {
  console.log('----- Test Fase 1: readConfigFromSheet() error handling -----');

  _resetCFGCache();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss ? ss.getSheetByName(CFG_TAB_NAME) : null;

  if (!tab) {
    let threw = false;
    try {
      readConfigFromSheet();
    } catch (err) {
      threw = true;
      const msg = String((err && err.message) || err);
      Guard.assert(
        msg.indexOf('No encuentro la pestaña') !== -1 && msg.indexOf(CFG_TAB_NAME) !== -1,
        'FAIL: mensaje de error no coincide con el contrato. Recibido: ' + msg
      );
      console.log('PASS: error "pestaña no existe" con mensaje canónico que referencia "' + CFG_TAB_NAME + '".');
    }
    Guard.assert(threw,
      'FAIL: readConfigFromSheet() debería haber tirado error porque la pestaña no existe, pero retornó sin error.');
  } else {
    console.log('SKIP: la pestaña "' + CFG_TAB_NAME + '" existe. Test de path exitoso pendiente hasta cerrar Fase 2.');
  }

  console.log('----- Test readConfigFromSheet OK -----');
}

function testConfigSheetBuilderIdempotency() {
  console.log('----- Test Fase 2: ConfigSheetBuilder idempotency -----');

  const tempName = 'DAI-SmokeTest-ConfigSheetBuilder-' + Date.now();
  const ss = SpreadsheetApp.create(tempName);
  const tempFileId = ss.getId();

  try {
    const expectedCount = ConfigSheetBuilder.SCHEMA.length;

    const firstRun = ConfigSheetBuilder.build(ss);
    Guard.assert(firstRun.created.length === expectedCount,
      'FAIL: primera corrida deberia crear ' + expectedCount + ' pestanas, creo ' + firstRun.created.length);
    Guard.assert(firstRun.reused.length === 0,
      'FAIL: primera corrida no deberia reusar ninguna, reuso ' + firstRun.reused.length);
    console.log('PASS: 1ra corrida creo ' + firstRun.created.length + ' pestanas, cero reusadas.');

    const secondRun = ConfigSheetBuilder.build(ss);
    Guard.assert(secondRun.reused.length === expectedCount,
      'FAIL: segunda corrida deberia reusar ' + expectedCount + ' pestanas, reuso ' + secondRun.reused.length);
    Guard.assert(secondRun.created.length === 0,
      'FAIL: segunda corrida no deberia crear nada, creo ' + secondRun.created.length);
    console.log('PASS: 2da corrida reuso ' + secondRun.reused.length + ' pestanas, cero duplicadas.');

  } finally {
    try {
      DriveApp.getFileById(tempFileId).setTrashed(true);
    } catch (err) {
      console.log('No se pudo trashear Sheet temporal de ConfigSheetBuilder test: ' + err);
    }
  }

  console.log('----- Test ConfigSheetBuilder idempotency OK -----');
}

function testR1FixesUnit() {
  console.log('----- Test R1 (2026-04-21): fixes unitarios B1/B2/B3 -----');

  Guard.assert(_parseSiNo('Si') === true, 'FAIL _parseSiNo: "Si" → true');
  Guard.assert(_parseSiNo('si') === true, 'FAIL _parseSiNo: "si" → true');
  Guard.assert(_parseSiNo('Sí') === true, 'FAIL _parseSiNo: "Sí" → true');
  Guard.assert(_parseSiNo('sí') === true, 'FAIL _parseSiNo: "sí" → true');
  Guard.assert(_parseSiNo('Si, generá todo ahora') === true, 'FAIL _parseSiNo: frase con prefijo "Si" → true');
  Guard.assert(_parseSiNo('No') === false, 'FAIL _parseSiNo: "No" → false');
  Guard.assert(_parseSiNo('') === false, 'FAIL _parseSiNo: vacío → false');
  Guard.assert(_parseSiNo(null) === false, 'FAIL _parseSiNo: null → false');
  Guard.assert(_parseSiNo(undefined) === false, 'FAIL _parseSiNo: undefined → false');
  Guard.assert(_parseSiNo(true) === true, 'FAIL _parseSiNo: boolean true → true');
  Guard.assert(_parseSiNo(false) === false, 'FAIL _parseSiNo: boolean false → false');
  console.log('PASS B2: _parseSiNo cubre Si/si/Sí/sí/frase/No/vacío/null/undefined/true/false');

  Guard.assert(_parseInteger('3', 99) === 3, 'FAIL _parseInteger: "3" → 3');
  Guard.assert(_parseInteger(3, 99) === 3, 'FAIL _parseInteger: 3 → 3');
  Guard.assert(_parseInteger('', 99) === 99, 'FAIL _parseInteger: vacío → default');
  Guard.assert(_parseInteger('0', 99) === 99, 'FAIL _parseInteger: "0" inválido → default');
  Guard.assert(_parseInteger('-5', 99) === 99, 'FAIL _parseInteger: negativo → default');
  Guard.assert(_parseInteger('abc', 99) === 99, 'FAIL _parseInteger: no-numérico → default');
  Guard.assert(_parseInteger('3.7', 99) === 3, 'FAIL _parseInteger: "3.7" → 3 (parseInt redondea hacia abajo)');
  console.log('PASS B1: _parseInteger parsea válidos y fallbackea en inválidos');

  const mockForms = [
    { id: 'F01', phase: 'pedagogica' },
    { id: 'F05', phase: 'institucional' },
    { id: 'F10', phase: 'cooperadora' },
    { id: 'F11', phase: 'cooperadora' },
    { id: 'F12', phase: 'cooperadora' }
  ];

  // 2026-04-26: cooperadora invisible por default. Sin flags = omite F10/F11/F12.
  const noFlags = PhaseFilter.filter(mockForms, 'all');
  Guard.assert(noFlags.length === 2, 'FAIL PhaseFilter sin flags: esperaba 2 (cooperadora omitida por default), obtuvo ' + noFlags.length);

  const withCoop = PhaseFilter.filter(mockForms, 'all', { cooperadora_activa: true });
  Guard.assert(withCoop.length === 5, 'FAIL PhaseFilter coop=true: esperaba 5, obtuvo ' + withCoop.length);

  const withoutCoop = PhaseFilter.filter(mockForms, 'all', { cooperadora_activa: false });
  Guard.assert(withoutCoop.length === 2, 'FAIL PhaseFilter coop=false: esperaba 2, obtuvo ' + withoutCoop.length);
  const ids = withoutCoop.map(function(f) { return f.id; });
  Guard.assert(ids.indexOf('F10') === -1, 'FAIL PhaseFilter coop=false: F10 no debería estar');
  Guard.assert(ids.indexOf('F11') === -1, 'FAIL PhaseFilter coop=false: F11 no debería estar');
  Guard.assert(ids.indexOf('F12') === -1, 'FAIL PhaseFilter coop=false: F12 no debería estar');
  Guard.assert(ids.indexOf('F01') !== -1 && ids.indexOf('F05') !== -1, 'FAIL PhaseFilter coop=false: F01 y F05 sí deberían estar');
  console.log('PASS B3: PhaseFilter omite cooperadora por default (2/5 sin flags y con coop=false; 5/5 con coop=true explícito)');

  const cfg = getFoldersCfg();
  Guard.assert(Array.isArray(cfg) && cfg.length > 0, 'FAIL getFoldersCfg: no retorna array con contenido');
  const adminNode = cfg.filter(function(n) { return n.path === '05-Administracion'; })[0];
  Guard.assert(adminNode && adminNode.children, 'FAIL getFoldersCfg: 05-Administracion no tiene children');
  const legajosNode = adminNode.children.filter(function(n) { return n.path === 'Legajos'; })[0];
  Guard.assert(legajosNode && legajosNode.children && legajosNode.children.length > 0,
    'FAIL getFoldersCfg: Legajos no tiene secciones');
  console.log('PASS B1: getFoldersCfg retorna árbol con Legajos/Seccion-N (default ' +
    legajosNode.children.length + ' secciones).');

  console.log('----- Test R1 fixes unitarios OK -----');
}

/**
 * testFase25DocGenUnit — tests unitarios de Fase 2.5 (DocGenerator +
 * DocTemplateBuilder + FormalFormsTriggerManager + ConfigDocTemplates).
 *
 * Cobertura:
 *   - _slugify normaliza correctamente (tildes, slashes, spaces, null).
 *   - _normalizeResponseData convierte namedValues + flat dict a { slug: string }.
 *   - DOC_TEMPLATES tiene entries para los 9 formal forms (F05/F06/F08-F14).
 *   - Cada entry tiene los 4 campos obligatorios (registryKey, outputFolderPath,
 *     docNamePattern, templateTitle) + registryKey coherente ("docTemplate:Fxx").
 *   - DocTemplateBuilder tiene los 9 métodos _buildTemplateFxx correspondientes.
 *   - DOC_TEMPLATE_FORM_IDS = 9 elementos.
 *
 * NO cubre (queda para integración real post-install):
 *   - Ejecución real de DocTemplateBuilder.buildAll (crea Docs en Drive).
 *   - Ejecución real de DocGenerator.generate (requiere template registrado).
 *   - Install real de triggers (requiere forms creados por setupAll).
 */
function testFase25DocGenUnit() {
  console.log('----- Test Fase 2.5 (2026-04-21): DocGen unitario -----');

  // --- DocGenerator._slugify ---
  Guard.assert(DocGenerator._slugify('Fecha') === 'fecha', 'FAIL _slugify: "Fecha" → "fecha"');
  Guard.assert(DocGenerator._slugify('Hora inicio') === 'hora_inicio', 'FAIL _slugify: "Hora inicio" → "hora_inicio"');
  Guard.assert(DocGenerator._slugify('Acuerdos/decisiones') === 'acuerdos_decisiones', 'FAIL _slugify: slash');
  Guard.assert(DocGenerator._slugify('Órden del día') === 'orden_del_dia', 'FAIL _slugify: tildes');
  Guard.assert(DocGenerator._slugify('Tipo de reunion') === 'tipo_de_reunion', 'FAIL _slugify: tipo_de_reunion');
  Guard.assert(DocGenerator._slugify('  Multi   espacios  ') === 'multi_espacios', 'FAIL _slugify: multi-space + trim');
  Guard.assert(DocGenerator._slugify('123_numeros') === '123_numeros', 'FAIL _slugify: alphanumeric preserved');
  Guard.assert(DocGenerator._slugify('') === '', 'FAIL _slugify: empty');
  Guard.assert(DocGenerator._slugify(null) === '', 'FAIL _slugify: null');
  Guard.assert(DocGenerator._slugify(undefined) === '', 'FAIL _slugify: undefined');
  console.log('PASS F2.5: _slugify normaliza tildes/slashes/spaces/null correctamente');

  // --- DocGenerator._normalizeResponseData (namedValues shape) ---
  const namedValuesMock = {
    'Fecha': ['2026-04-21'],
    'Hora inicio': ['08:00'],
    'Participantes': ['Ana', 'Beatriz', 'Carlos']
  };
  const normNamed = DocGenerator._normalizeResponseData(namedValuesMock);
  Guard.assert(normNamed.fecha === '2026-04-21', 'FAIL _normalizeResponseData: fecha de namedValues');
  Guard.assert(normNamed.hora_inicio === '08:00', 'FAIL _normalizeResponseData: hora_inicio');
  Guard.assert(normNamed.participantes === 'Ana, Beatriz, Carlos',
    'FAIL _normalizeResponseData: checkbox array join. Obtuvo: ' + normNamed.participantes);
  console.log('PASS F2.5: _normalizeResponseData slugifica keys y joinea arrays (checkbox)');

  // --- _normalizeResponseData (flat shape + null + undefined) ---
  const flatMock = {
    fecha: '2026-04-22',
    observaciones: null,
    monto: undefined,
    extra: ''
  };
  const normFlat = DocGenerator._normalizeResponseData(flatMock);
  Guard.assert(normFlat.fecha === '2026-04-22', 'FAIL _normalizeResponseData flat: fecha');
  Guard.assert(normFlat.observaciones === '', 'FAIL _normalizeResponseData: null → empty');
  Guard.assert(normFlat.monto === '', 'FAIL _normalizeResponseData: undefined → empty');
  Guard.assert(normFlat.extra === '', 'FAIL _normalizeResponseData: empty string preserved');
  console.log('PASS F2.5: _normalizeResponseData maneja flat dict + null/undefined/vacío');

  // --- FormalFormsTriggerManager._extractResponseData (R2 fix 2026-04-21) ---
  // R2 cazó que los Form-based triggers NO tienen e.namedValues — las
  // respuestas viven en e.response.getItemResponses(). Este test cubre los 3
  // shapes: Form-based, Spreadsheet-based (retro), y evento vacío.

  // Shape 1: Form-based trigger event (el real de producción).
  const mockFormEvent = {
    response: {
      getItemResponses: function() {
        return [
          {
            getItem: function() { return { getTitle: function() { return 'Fecha'; } }; },
            getResponse: function() { return '2026-04-21'; }
          },
          {
            getItem: function() { return { getTitle: function() { return 'Hora inicio'; } }; },
            getResponse: function() { return '08:00'; }
          },
          {
            getItem: function() { return { getTitle: function() { return 'Participantes'; } }; },
            getResponse: function() { return ['Ana', 'Beatriz', 'Carlos']; }
          }
        ];
      }
    }
  };
  const extractedForm = FormalFormsTriggerManager._extractResponseData(mockFormEvent);
  Guard.assert(Array.isArray(extractedForm['Fecha']) && extractedForm['Fecha'][0] === '2026-04-21',
    'FAIL _extractResponseData: Form-based simple string. Obtuvo: ' + JSON.stringify(extractedForm['Fecha']));
  Guard.assert(Array.isArray(extractedForm['Hora inicio']) && extractedForm['Hora inicio'][0] === '08:00',
    'FAIL _extractResponseData: Form-based segundo item');
  Guard.assert(Array.isArray(extractedForm['Participantes']) &&
               extractedForm['Participantes'].length === 3 &&
               extractedForm['Participantes'][2] === 'Carlos',
    'FAIL _extractResponseData: Form-based array (CHECKBOX) preserva elementos');

  // Shape 2: Spreadsheet-based trigger event (retro-compatibilidad).
  const mockSheetEvent = {
    namedValues: {
      'Fecha': ['2026-04-21'],
      'Desarrollo': ['Texto largo']
    }
  };
  const extractedSheet = FormalFormsTriggerManager._extractResponseData(mockSheetEvent);
  Guard.assert(extractedSheet['Fecha'][0] === '2026-04-21',
    'FAIL _extractResponseData: Spreadsheet-based retro via namedValues');
  Guard.assert(extractedSheet === mockSheetEvent.namedValues,
    'FAIL _extractResponseData: debe devolver namedValues as-is cuando está presente');

  // Shape 3: evento vacío / malformado → {}.
  Guard.assert(JSON.stringify(FormalFormsTriggerManager._extractResponseData({})) === '{}',
    'FAIL _extractResponseData: evento vacío debe devolver {}');
  Guard.assert(JSON.stringify(FormalFormsTriggerManager._extractResponseData(null)) === '{}',
    'FAIL _extractResponseData: evento null debe devolver {}');
  Guard.assert(JSON.stringify(FormalFormsTriggerManager._extractResponseData({ namedValues: {} })) === '{}',
    'FAIL _extractResponseData: namedValues vacío debe caer a {} (no quedarse pegado)');

  console.log('PASS F2.5: _extractResponseData maneja Form-based + Spreadsheet-based + evento vacío (R2 fix)');

  // --- DOC_TEMPLATES coherencia ---
  const expectedFormIds = ['F05', 'F06', 'F08', 'F09', 'F10', 'F11', 'F12', 'F13', 'F14'];
  expectedFormIds.forEach(function(fid) {
    const meta = DOC_TEMPLATES[fid];
    Guard.assert(meta, 'FAIL DOC_TEMPLATES: falta entry para ' + fid);
    Guard.assertNonEmpty(meta.registryKey, fid + '.registryKey');
    Guard.assertNonEmpty(meta.outputFolderPath, fid + '.outputFolderPath');
    Guard.assertNonEmpty(meta.docNamePattern, fid + '.docNamePattern');
    Guard.assertNonEmpty(meta.templateTitle, fid + '.templateTitle');
    Guard.assert(meta.registryKey === 'docTemplate:' + fid,
      'FAIL ' + fid + ': registryKey debería ser "docTemplate:' + fid + '", es "' + meta.registryKey + '"');
    Guard.assert(meta.docNamePattern.indexOf('{timestamp}') !== -1,
      'FAIL ' + fid + ': docNamePattern debe incluir placeholder {timestamp}');
  });
  Guard.assert(DOC_TEMPLATE_FORM_IDS.length === 9,
    'FAIL DOC_TEMPLATE_FORM_IDS: esperaba 9 entries, hay ' + DOC_TEMPLATE_FORM_IDS.length);
  console.log('PASS F2.5: DOC_TEMPLATES tiene 9 entries coherentes para los forms formales');

  // --- DocTemplateBuilder coherencia ---
  expectedFormIds.forEach(function(fid) {
    Guard.assert(typeof DocTemplateBuilder['_buildTemplate' + fid] === 'function',
      'FAIL DocTemplateBuilder: falta método _buildTemplate' + fid + '()');
  });
  console.log('PASS F2.5: DocTemplateBuilder tiene los 9 métodos _buildTemplateFxx');

  // --- FormalFormsTriggerManager básico ---
  Guard.assertNonEmpty(FormalFormsTriggerManager.HANDLER_NAME, 'HANDLER_NAME');
  Guard.assert(FormalFormsTriggerManager.HANDLER_NAME === 'onFormalFormSubmit',
    'FAIL FormalFormsTriggerManager: HANDLER_NAME debería ser "onFormalFormSubmit"');
  Guard.assertNonEmpty(FormalFormsTriggerManager.REVERSE_LOOKUP_KEY, 'REVERSE_LOOKUP_KEY');
  Guard.assert(typeof onFormalFormSubmit === 'function',
    'FAIL Main.gs: función global onFormalFormSubmit no está definida (trigger target)');
  console.log('PASS F2.5: FormalFormsTriggerManager bien configurado + handler global registrado');

  console.log('----- Test Fase 2.5 DocGen unitario OK -----');
}

// ============================================================================
// runCicloVidaTest — paso 19/20 plan v3 baja/suplentes-docente (2026-04-30).
//
// Test integracion real del ciclo de vida completo de una docente:
// Sumar -> MarcarLicencia -> Volvio -> DarDeBaja, ejecutando los handlers
// reales (handleSumarDocente / handleMarcarLicencia / handleVolvioLicencia /
// handleDarDeBaja) con fakeEvents, y validando state final de 👥 Docentes
// despues de cada step (asserts via getRange directo, NO via logs — logs
// estan mezclados con produccion real).
//
// Separado de runSmokeTests porque tarda ~60-100s (4 refreshDocentes
// embedded × ~10-24s cada uno) vs ~25s del smoke unitario. Correr standalone
// desde el IDE de Apps Script.
//
// Pre-condicion empirica: template:container debe estar cacheado en
// PropertiesRegistry (lo cachea installSubmitDispatcher post-deploy).
// Se verifica al inicio con TemplateResolver.resolve — si falla, throw visible.
//
// Cleanup defensivo idempotente al inicio Y al final (try/finally) — borra
// fila docente test por email + invalidate token + removeEditor (best-effort).
// Garantiza arranque limpio si corrida anterior fallo a mitad.
//
// Decisiones de diseno (snapshot-018 §7 + 4 refinamientos del mapeo
// de plomero pre-codigo, autodiagnostico-sesion-3-arranque-paso-19.md):
//   1. Separado de runSmokeTests (no mezclar unitario rapido con integracion).
//   2. Email fake unico por corrida: test-ciclo-{Date.now()}@example.com.
//   3. SIN bonus tests handleAuthCheck (paso 16 ya validado, scope creep evitado).
//   4. apellidoNombre fijo "TestCiclo Robot" — steps 2-4 hacen lookup por
//      dropdown value "TestCiclo, Robot" y necesitan consistencia.
//   5. _cleanupCicloTest borra por email (no por dropdown) — duplicate-check
//      del paso 10 es por email lower-case, asi garantizamos idempotencia.
//   6. Asserts via state final 👥 Docentes (tab.getRange directo) — NO via
//      logs (mezclados con produccion, hard to filter).
//   7. Pre-condicion empirica template:container cacheado (defensive low-cost).
//
// Cazadas anticipadas:
//   A. addEditor con email fake va a fallar (no es cuenta Google real) —
//      handleSumarDocente captura con try/catch + log WARN, no rompe.
//   B. removeEditor en step 4 idem — log WARN esperado, no rompe.
//   C. Si una corrida falla a mitad, _cleanupCicloTest defensive del setup
//      borra residuos para que la proxima corrida arranque limpio.
//
// Returns: { stepsPassed, stepsFailed, durationMs, log: [...] }.
// ============================================================================

// ============================================================================
// testGetEquipoDocenteNoTokenLeak — paso 17.1 SPOF 29 verification (CRÍTICO).
// Standalone, NO parte de runSmokeTests. Correr post-paso-17.1 commit para
// verificar que el JSON retornado por getEquipoDocenteForPanel NO contiene
// el token de ninguna docente (col 10 de 👥 Docentes).
//
// Si esta función PASA → SPOF 29 mitigado, paso 17.1 puede avanzar.
// Si FALLA → bloqueante de seguridad, NO avanzar hasta fixear el whitelist.
// ============================================================================

function testGetEquipoDocenteNoTokenLeak() {
  console.log('===== testGetEquipoDocenteNoTokenLeak — SPOF 29 verification =====');

  const result = getEquipoDocenteForPanel();
  console.log('Result completo:');
  console.log(JSON.stringify(result, null, 2));

  Guard.assert(result.ok === true,
    'FAIL: getEquipoDocenteForPanel retornó ok:false. reason=' + (result.reason || ''));

  const equipo = result.equipo;
  Guard.assert(equipo && typeof equipo === 'object',
    'FAIL: equipo no es objeto. Es: ' + (typeof equipo));
  Guard.assert(Array.isArray(equipo.activas) && Array.isArray(equipo.licencia) && Array.isArray(equipo.bajas),
    'FAIL: equipo no tiene los 3 arrays esperados. Keys: ' + Object.keys(equipo).join(','));

  // SPOF 29 BLOQUEANTE: token NO debe estar en NINGUNA parte del JSON.
  const jsonStr = JSON.stringify(equipo);
  const allDocentes = equipo.activas.concat(equipo.licencia).concat(equipo.bajas);

  // Check 1: ninguna docente tiene 'token' como key del objeto.
  for (let i = 0; i < allDocentes.length; i++) {
    const d = allDocentes[i];
    const keys = Object.keys(d);
    Guard.assert(keys.indexOf('token') === -1,
      'FAIL SPOF 29 Check 1: docente "' + d.email + '" tiene key "token" expuesta. Keys: ' + keys.join(','));
  }
  console.log('PASS Check 1: ninguna de las ' + allDocentes.length + ' docentes tiene key "token".');

  // Check 2: el JSON serializado NO contiene patrones UUID v4 (8-4-4-4-12 hex).
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const uuidMatch = jsonStr.match(uuidPattern);
  Guard.assert(!uuidMatch,
    'FAIL SPOF 29 Check 2: JSON contiene patrón UUID. Match: ' + (uuidMatch ? uuidMatch[0] : ''));
  console.log('PASS Check 2: JSON NO contiene patrones UUID.');

  // Check 3: el JSON serializado NO contiene la palabra 'token' (case-insensitive).
  Guard.assert(!/token/i.test(jsonStr),
    'FAIL SPOF 29 Check 3: JSON contiene la palabra "token".');
  console.log('PASS Check 3: JSON NO contiene la palabra "token".');

  // Check 4: docentes tienen los campos whitelisted esperados.
  if (allDocentes.length > 0) {
    const sample = allDocentes[0];
    const expectedKeys = ['apellido', 'nombre', 'email', 'tipo', 'estado', 'fechaAlta_iso', 'fechaCambio_iso'];
    expectedKeys.forEach(function(k) {
      Guard.assert(k in sample,
        'FAIL Check 4: docente sample no tiene key "' + k + '". Keys: ' + Object.keys(sample).join(','));
    });
    // Check 5: docente NO tiene keys que NO deberían estar (dni, notas, token).
    const forbiddenKeys = ['dni', 'notas', 'token'];
    forbiddenKeys.forEach(function(k) {
      Guard.assert(!(k in sample),
        'FAIL Check 5: docente sample tiene key prohibida "' + k + '"');
    });
    console.log('PASS Check 4-5: docente sample tiene los 7 campos whitelisted, sin dni/notas/token.');
  }

  // Check 6: counts esperados por estado (info, no assertion).
  const totalDocentes = equipo.activas.length + equipo.licencia.length + equipo.bajas.length;
  console.log('Total docentes leídas: ' + totalDocentes +
    ' (Activas: ' + equipo.activas.length +
    ', Licencia: ' + equipo.licencia.length +
    ', Bajas: ' + equipo.bajas.length + ')');

  console.log('===== testGetEquipoDocenteNoTokenLeak OK — SPOF 29 verificado =====');
  return result;
}

// ============================================================================
// testGetDeployVersion — paso 17.1 SPOF 36 verification.
// Standalone. Verifica que getDeployVersion retorna string no vacío que se
// pueda usar como cache key client-side.
// ============================================================================

function testGetDeployVersion() {
  console.log('===== testGetDeployVersion — SPOF 36 verification =====');
  const version = getDeployVersion();
  console.log('Deploy version retornada: "' + version + '"');
  Guard.assert(typeof version === 'string',
    'FAIL: getDeployVersion no retorna string. Es: ' + (typeof version));
  Guard.assert(version.length > 0,
    'FAIL: getDeployVersion retorna string vacío.');
  Guard.assert(version !== 'unknown' || true,
    'INFO: version es "unknown" — probable contexto sin URL deployada (correr post-deploy si hace falta cachear).');
  console.log('PASS: deploy version OK, length=' + version.length);
  console.log('===== testGetDeployVersion OK =====');
  return version;
}

// ============================================================================
// testSubmitOperativoFromPanelInvalid — paso 17.1 verificación del orquestador.
// Standalone. Invoca submitOperativoFromPanel con email INEXISTENTE para
// validar que el wrapper retorna {ok:false, reason:'docente-not-found'} sin
// tocar producción. NO muta el Sheet 👥 Docentes.
// ============================================================================

function testSubmitOperativoFromPanelInvalid() {
  console.log('===== testSubmitOperativoFromPanelInvalid — orquestador no-mutating =====');
  const fakeEmail = 'no-existe-test-' + Date.now() + '@example.com';
  console.log('Email fake: ' + fakeEmail);
  const result = submitOperativoFromPanel('marcarLicencia', fakeEmail);
  console.log('Result: ' + JSON.stringify(result));
  Guard.assert(result.ok === false,
    'FAIL: esperaba ok:false con email inexistente. Recibí: ' + JSON.stringify(result));
  Guard.assert(result.reason === 'docente-not-found',
    'FAIL: esperaba reason="docente-not-found". Recibí: ' + result.reason);
  console.log('PASS: orquestador retorna docente-not-found sin mutar producción.');

  // Verificación bonus: accion invalida.
  console.log('--- Bonus: accion inválida ---');
  const result2 = submitOperativoFromPanel('accionFalsa', fakeEmail);
  Guard.assert(result2.reason === 'invalid-accion',
    'FAIL: esperaba reason="invalid-accion". Recibí: ' + result2.reason);
  console.log('PASS: accion invalida retorna invalid-accion.');

  console.log('===== testSubmitOperativoFromPanelInvalid OK =====');
}

function runCicloVidaTest() {
  const startedAt = new Date();
  const tag = 'CICLO-VIDA-' + startedAt.getTime();
  const email = 'test-ciclo-' + startedAt.getTime() + '@example.com';
  const apellido = 'TestCiclo';
  const nombre = 'Robot';
  const apellidoNombre = apellido + ' ' + nombre;
  const dropdownValue = apellido + ', ' + nombre;
  const dni = '99999999';
  const tipo = 'Suplente';

  console.log('===== ' + tag + ' START =====');
  console.log('email: ' + email);
  console.log('apellidoNombre: "' + apellidoNombre + '" -> dropdown="' + dropdownValue + '"');

  // Pre-condicion empirica: template:container cacheado.
  const ssCheck = TemplateResolver.resolve('👥 Docentes');
  if (!ssCheck) {
    throw new Error(tag + ': pre-condicion fallo — TemplateResolver.resolve null. ' +
      'Correr installSubmitDispatcher() para cachear template:container ANTES de runCicloVidaTest.');
  }
  console.log('PRE-CONDICION OK: template:container resuelto.');

  const log = [];
  let stepsPassed = 0;
  let stepsFailed = 0;

  // Setup defensivo idempotente — borra residuos de corrida anterior si existen.
  _cleanupCicloTest(email);

  try {
    // ========== Step 1: handleSumarDocente ==========
    console.log('----- Step 1: Sumar -----');
    try {
      handleSumarDocente({
        namedValues: {
          'Apellido y nombre': [apellidoNombre],
          'DNI': [dni],
          'Email': [email],
          'Tipo': [tipo]
        }
      });
      const fila = _findCicloTestRow(email);
      Guard.assert(fila > 0, 'Step 1: fila no encontrada post-Sumar (handler fallo silencioso?)');
      const tab = TemplateResolver.resolve('👥 Docentes').getSheetByName('👥 Docentes');
      const row = tab.getRange(fila, 1, 1, 10).getValues()[0];
      Guard.assert(String(row[0]).trim() === apellido,
        'Step 1: apellido col 1 mismatch — esperaba "' + apellido + '", es "' + row[0] + '"');
      Guard.assert(String(row[1]).trim() === nombre,
        'Step 1: nombre col 2 mismatch — esperaba "' + nombre + '", es "' + row[1] + '"');
      Guard.assert(String(row[3]).trim().toLowerCase() === email.toLowerCase(),
        'Step 1: email col 4 mismatch');
      Guard.assert(String(row[5]).trim() === 'Activa',
        'Step 1: estado col 6 debe ser Activa, es "' + row[5] + '"');
      Guard.assert(String(row[9] || '').trim().length === 36,
        'Step 1: token col 10 debe tener 36 chars (UUID v4), es "' + row[9] + '"');
      console.log('PASS Step 1: fila ' + fila + ' Activa + Token UUID');
      log.push({ step: 1, name: 'Sumar', pass: true, row: fila });
      stepsPassed++;
    } catch (err) {
      console.error('FAIL Step 1: ' + err);
      log.push({ step: 1, name: 'Sumar', pass: false, err: String(err) });
      stepsFailed++;
      // Sin step 1 no hay docente para los demas steps — abort.
      throw new Error(tag + ': step 1 fallo, abort cadena: ' + err);
    }

    // ========== Step 2: handleMarcarLicencia ==========
    console.log('----- Step 2: MarcarLicencia -----');
    try {
      handleMarcarLicencia({
        namedValues: {
          'Que docente esta de licencia?': [dropdownValue]
        }
      });
      const fila = _findCicloTestRow(email);
      Guard.assert(fila > 0, 'Step 2: fila desaparecio (handleMarcarLicencia NO debe borrarla)');
      const tab = TemplateResolver.resolve('👥 Docentes').getSheetByName('👥 Docentes');
      const row = tab.getRange(fila, 1, 1, 10).getValues()[0];
      Guard.assert(String(row[5]).trim() === 'Licencia',
        'Step 2: estado col 6 debe ser Licencia, es "' + row[5] + '"');
      Guard.assert(row[7] instanceof Date,
        'Step 2: Fecha cambio col 8 debe ser Date, es ' + (typeof row[7]));
      console.log('PASS Step 2: Estado=Licencia + Fecha cambio actualizada');
      log.push({ step: 2, name: 'MarcarLicencia', pass: true, row: fila });
      stepsPassed++;
    } catch (err) {
      console.error('FAIL Step 2: ' + err);
      log.push({ step: 2, name: 'MarcarLicencia', pass: false, err: String(err) });
      stepsFailed++;
    }

    // ========== Step 3: handleVolvioLicencia ==========
    console.log('----- Step 3: Volvio -----');
    try {
      handleVolvioLicencia({
        namedValues: {
          'Que docente volvio?': [dropdownValue]
        }
      });
      const fila = _findCicloTestRow(email);
      Guard.assert(fila > 0, 'Step 3: fila desaparecio');
      const tab = TemplateResolver.resolve('👥 Docentes').getSheetByName('👥 Docentes');
      const row = tab.getRange(fila, 1, 1, 10).getValues()[0];
      Guard.assert(String(row[5]).trim() === 'Activa',
        'Step 3: estado col 6 debe volver a Activa, es "' + row[5] + '"');
      console.log('PASS Step 3: Estado=Activa');
      log.push({ step: 3, name: 'VolvioLicencia', pass: true, row: fila });
      stepsPassed++;
    } catch (err) {
      console.error('FAIL Step 3: ' + err);
      log.push({ step: 3, name: 'VolvioLicencia', pass: false, err: String(err) });
      stepsFailed++;
    }

    // ========== Step 4: handleDarDeBaja ==========
    console.log('----- Step 4: DarDeBaja -----');
    try {
      handleDarDeBaja({
        namedValues: {
          'A quien das de baja?': [dropdownValue],
          'Confirmacion': ['Si, dar de baja. Entiendo que pierde acceso al Drive y la operacion no es reversible.']
        }
      });
      const fila = _findCicloTestRow(email);
      Guard.assert(fila > 0,
        'Step 4: fila desaparecio (handleDarDeBaja NO debe borrar fila — queda como historico institucional)');
      const tab = TemplateResolver.resolve('👥 Docentes').getSheetByName('👥 Docentes');
      const row = tab.getRange(fila, 1, 1, 10).getValues()[0];
      Guard.assert(String(row[5]).trim() === 'No disponible',
        'Step 4: estado col 6 debe ser No disponible, es "' + row[5] + '"');
      Guard.assert(String(row[9] || '').trim() === '',
        'Step 4: token col 10 debe quedar vacio post-invalidate, es "' + row[9] + '"');
      console.log('PASS Step 4: Estado=No disponible + Token vacio');
      log.push({ step: 4, name: 'DarDeBaja', pass: true, row: fila });
      stepsPassed++;
    } catch (err) {
      console.error('FAIL Step 4: ' + err);
      log.push({ step: 4, name: 'DarDeBaja', pass: false, err: String(err) });
      stepsFailed++;
    }

  } finally {
    // Cleanup final idempotente — borra fila test del 👥 Docentes para no contaminar.
    console.log('----- Cleanup final -----');
    _cleanupCicloTest(email);
  }

  const durationMs = (new Date()) - startedAt;
  const report = {
    stepsPassed: stepsPassed,
    stepsFailed: stepsFailed,
    durationMs: durationMs,
    log: log
  };
  console.log('===== ' + tag + ' END =====');
  console.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * _cleanupCicloTest(email) — helper idempotente para limpiar residuos del
 * runCicloVidaTest entre corridas. Borra la fila por email (no por dropdown)
 * para que el duplicate-check de handleSumarDocente (paso 10, lower-case email)
 * no bloquee la siguiente corrida.
 *
 * Pasos defensivos (todos best-effort, ningun throw):
 *   1. Buscar fila por email en 👥 Docentes.
 *   2. Capturar token + email reales antes de borrar (para invalidate/removeEditor).
 *   3. Borrar la fila (deleteRow) — operacion mas critica.
 *   4. Invalidate token via TokenService (si tenia token).
 *   5. RemoveEditor del yearFolder (si tenia email — fallara con email fake, OK).
 *
 * Idempotente: si la docente test no existe (primera corrida), retorna sin tocar.
 */
function _cleanupCicloTest(email) {
  const targetEmail = String(email || '').trim().toLowerCase();
  if (!targetEmail) return;

  let ss;
  try {
    ss = TemplateResolver.resolve('👥 Docentes');
  } catch (err) {
    console.log('_cleanupCicloTest: TemplateResolver.resolve fallo (skip): ' + err);
    return;
  }
  if (!ss) return;
  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) return;

  const lastRow = tab.getLastRow();
  if (lastRow < 3) return;

  const range = tab.getRange(3, 1, lastRow - 2, 10).getValues();
  for (let i = 0; i < range.length; i++) {
    const rowEmail = String(range[i][3] || '').trim().toLowerCase();
    if (rowEmail !== targetEmail) continue;

    const rowIndex = 3 + i;
    const tokenAnterior = String(range[i][9] || '').trim();
    const emailReal = String(range[i][3] || '').trim();

    try {
      tab.deleteRow(rowIndex);
      console.log('_cleanupCicloTest: fila ' + rowIndex + ' borrada (email ' + emailReal + ')');
    } catch (err) {
      console.log('_cleanupCicloTest: deleteRow fila ' + rowIndex + ' fallo: ' + err);
    }

    if (tokenAnterior) {
      try {
        TokenService.invalidate(tokenAnterior);
      } catch (err) {
        console.log('_cleanupCicloTest: TokenService.invalidate fallo: ' + err);
      }
    }

    try {
      const yearFolderEntry = PropertiesRegistry.get('folder:2026');
      if (yearFolderEntry && yearFolderEntry.id) {
        DriveApp.getFolderById(yearFolderEntry.id).removeEditor(emailReal);
      }
    } catch (err) {
      // Esperado con email fake — log silencioso.
    }

    return; // 1 fila max por email (duplicate-check del paso 10).
  }
}

/**
 * _findCicloTestRow(email) — busca fila docente test por email
 * (case-insensitive) en 👥 Docentes. Retorna row absoluto (3+) o -1.
 *
 * Helper local para asserts del runCicloVidaTest. NO filtra por Estado
 * (a diferencia de _findDocenteByEmail del paso 16 que filtra Estado=Activa).
 * Necesario porque step 4 valida que la fila quede con Estado='No disponible'
 * y el lookup debe encontrarla igual.
 */
function _findCicloTestRow(email) {
  const targetEmail = String(email || '').trim().toLowerCase();
  if (!targetEmail) return -1;

  const ss = TemplateResolver.resolve('👥 Docentes');
  if (!ss) return -1;
  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) return -1;

  const lastRow = tab.getLastRow();
  if (lastRow < 3) return -1;

  const range = tab.getRange(3, 1, lastRow - 2, 4).getValues();
  for (let i = 0; i < range.length; i++) {
    const rowEmail = String(range[i][3] || '').trim().toLowerCase();
    if (rowEmail === targetEmail) return 3 + i;
  }
  return -1;
}
