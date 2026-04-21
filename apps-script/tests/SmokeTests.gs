/**
 * SmokeTests.gs — prueba rapida del pipeline sin crear los 14 forms.
 *
 * runSmokeTests() ejecuta 4 bloques:
 *   1. FormBuilder applyItem pipeline — crea folder + form + sheet temporal,
 *      aplica 1 item de cada tipo, valida count, linkea Sheet, cleanup.
 *   2. readConfigFromSheet() error handling (Fase 1) — valida que la función
 *      tire error con mensaje canónico cuando la pestaña '_respuestas_config'
 *      no existe.
 *   3. ConfigSheetBuilder idempotency (Fase 2) — valida que sobre un Sheet
 *      temporal, 1ra corrida crea 8 pestañas y 2da reusa 8 sin duplicar.
 *   4. R1 fixes unitarios (2026-04-21) — _parseSiNo, _parseInteger,
 *      PhaseFilter contextual con cooperadora_activa.
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

  // Test Fase 1.
  testReadConfigFromSheet();

  // Test Fase 2.
  testConfigSheetBuilderIdempotency();

  // Tests R1 2026-04-21 (fixes B1/B2/B3 unitarios).
  testR1FixesUnit();

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

/**
 * testR1FixesUnit() — tests unitarios de los 3 fixes R1 del 2026-04-21:
 *   B1 — SECTION_COUNT dinámico: _parseInteger parsea bien; getFoldersCfg
 *        retorna el árbol (no se ejercita aquí porque depende de CFG lazy,
 *        pero sí se valida que _parseInteger funciona como fundación).
 *   B2 — CFG extendido: _parseSiNo parsea bien los booleans del onboarding.
 *   B3 — PhaseFilter contextual: con onboardingFlags.cooperadora_activa=false,
 *        omite forms con phase='cooperadora'.
 */
function testR1FixesUnit() {
  console.log('----- Test R1 (2026-04-21): fixes unitarios B1/B2/B3 -----');

  // --- _parseSiNo ---
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

  // --- _parseInteger ---
  Guard.assert(_parseInteger('3', 99) === 3, 'FAIL _parseInteger: "3" → 3');
  Guard.assert(_parseInteger(3, 99) === 3, 'FAIL _parseInteger: 3 → 3');
  Guard.assert(_parseInteger('', 99) === 99, 'FAIL _parseInteger: vacío → default');
  Guard.assert(_parseInteger('0', 99) === 99, 'FAIL _parseInteger: "0" inválido → default');
  Guard.assert(_parseInteger('-5', 99) === 99, 'FAIL _parseInteger: negativo → default');
  Guard.assert(_parseInteger('abc', 99) === 99, 'FAIL _parseInteger: no-numérico → default');
  Guard.assert(_parseInteger('3.7', 99) === 3, 'FAIL _parseInteger: "3.7" → 3 (parseInt redondea hacia abajo)');
  console.log('PASS B1: _parseInteger parsea válidos y fallbackea en inválidos');

  // --- PhaseFilter contextual ---
  const mockForms = [
    { id: 'F01', phase: 'pedagogica' },
    { id: 'F05', phase: 'institucional' },
    { id: 'F10', phase: 'cooperadora' },
    { id: 'F11', phase: 'cooperadora' },
    { id: 'F12', phase: 'cooperadora' }
  ];

  // Sin flags: devuelve todo para phase=all
  const noFlags = PhaseFilter.filter(mockForms, 'all');
  Guard.assert(noFlags.length === 5, 'FAIL PhaseFilter sin flags: esperaba 5, obtuvo ' + noFlags.length);

  // Con cooperadora_activa=true: devuelve todo para phase=all
  const withCoop = PhaseFilter.filter(mockForms, 'all', { cooperadora_activa: true });
  Guard.assert(withCoop.length === 5, 'FAIL PhaseFilter coop=true: esperaba 5, obtuvo ' + withCoop.length);

  // Con cooperadora_activa=false: omite las 3 cooperadora
  const withoutCoop = PhaseFilter.filter(mockForms, 'all', { cooperadora_activa: false });
  Guard.assert(withoutCoop.length === 2, 'FAIL PhaseFilter coop=false: esperaba 2, obtuvo ' + withoutCoop.length);
  const ids = withoutCoop.map(function(f) { return f.id; });
  Guard.assert(ids.indexOf('F10') === -1, 'FAIL PhaseFilter coop=false: F10 no debería estar');
  Guard.assert(ids.indexOf('F11') === -1, 'FAIL PhaseFilter coop=false: F11 no debería estar');
  Guard.assert(ids.indexOf('F12') === -1, 'FAIL PhaseFilter coop=false: F12 no debería estar');
  Guard.assert(ids.indexOf('F01') !== -1 && ids.indexOf('F05') !== -1, 'FAIL PhaseFilter coop=false: F01 y F05 sí deberían estar');
  console.log('PASS B3: PhaseFilter respeta onboardingFlags.cooperadora_activa (2/5 cuando false)');

  // --- getFoldersCfg (solo valida que retorna array) ---
  // No puedo validar SECTION_COUNT dinámico porque CFG proxy requiere container.
  // Valida que al menos la función existe y retorna estructura.
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
