/**
 * SmokeTests.gs — prueba rapida del pipeline sin crear los 14 forms.
 *
 * runSmokeTests() ejecuta 3 bloques:
 *   1. FormBuilder applyItem pipeline — crea folder + form + sheet temporal,
 *      aplica 1 item de cada tipo, valida count, linkea Sheet, cleanup.
 *   2. readConfigFromSheet() error handling (Fase 1) — valida que la función
 *      tire error con mensaje canónico cuando la pestaña '_respuestas_config'
 *      no existe.
 *   3. ConfigSheetBuilder idempotency (Fase 2) — valida que sobre un Sheet
 *      temporal, la primera corrida crea 8 pestañas y la segunda reusa las 8
 *      sin duplicar.
 */

function runSmokeTests() {
  const testStartedAt = new Date();
  const tag = 'DAI-SmokeTest-' + testStartedAt.getTime();
  console.log('===== Smoke test: ' + tag + ' =====');

  const folder = DriveApp.createFolder(tag);
  const createdIds = { folder: folder.getId() };

  try {
    // 1. Crear un Sheet destino
    const ss = SpreadsheetApp.create(tag + '-Sheet');
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    createdIds.sheet = ss.getId();

    // 2. Crear un Form con un item de cada tipo usando el config pattern
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
    // cleanup
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

  // Test adicional Fase 1: readConfigFromSheet() error handling.
  // Opera sobre el Sheet container-bound — no requiere artifacts temporales.
  testReadConfigFromSheet();

  // Test adicional Fase 2: ConfigSheetBuilder idempotency.
  // Usa un Sheet temporal (aislado del container-bound) para no afectar
  // el template real ni el testReadConfigFromSheet de arriba.
  testConfigSheetBuilderIdempotency();

  console.log('===== Smoke test OK (' +
    ((new Date()) - testStartedAt) + ' ms) =====');
}

/**
 * testReadConfigFromSheet() — verifica que readConfigFromSheet() tire error
 * con mensaje específico y canónico cuando la pestaña '_respuestas_config'
 * no existe.
 *
 * Estado pre-Fase-2: la pestaña NO existe → el test espera el error "No
 * encuentro la pestaña '_respuestas_config'...".
 *
 * Estado post-Fase-2: la pestaña existe (la creó FormOnboardingBuilder) → el
 * test skipea el path de error. Cuando se cierre Fase 2 habrá que extender
 * este test para validar el path exitoso (keys correctas, tipos, etc.).
 */
function testReadConfigFromSheet() {
  console.log('----- Test Fase 1: readConfigFromSheet() error handling -----');

  _resetCFGCache();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss ? ss.getSheetByName(CFG_TAB_NAME) : null;

  if (!tab) {
    // Path esperado hoy (pre-Fase-2): pestaña no existe → error canónico.
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

/**
 * testConfigSheetBuilderIdempotency() — valida que ConfigSheetBuilder.build()
 * sobre un Sheet temporal crea 8 pestañas la primera corrida y las reusa sin
 * duplicar en la segunda corrida (guardrail anti-pérdida del plan v9).
 *
 * Usa un Sheet temporal NO container-bound para evitar efectos colaterales
 * en el Sheet real del Template.
 */
function testConfigSheetBuilderIdempotency() {
  console.log('----- Test Fase 2: ConfigSheetBuilder idempotency -----');

  const tempName = 'DAI-SmokeTest-ConfigSheetBuilder-' + Date.now();
  const ss = SpreadsheetApp.create(tempName);
  const tempFileId = ss.getId();

  try {
    const expectedCount = ConfigSheetBuilder.SCHEMA.length; // 8 pestañas

    // 1ra corrida: crear todas las pestañas.
    const firstRun = ConfigSheetBuilder.build(ss);
    Guard.assert(firstRun.created.length === expectedCount,
      'FAIL: primera corrida deberia crear ' + expectedCount + ' pestanas, creo ' + firstRun.created.length);
    Guard.assert(firstRun.reused.length === 0,
      'FAIL: primera corrida no deberia reusar ninguna, reuso ' + firstRun.reused.length);
    console.log('PASS: 1ra corrida creo ' + firstRun.created.length + ' pestanas, cero reusadas.');

    // 2da corrida: todas deberían reusar.
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
