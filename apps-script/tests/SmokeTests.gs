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
