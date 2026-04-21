/**
 * SmokeTests.gs — prueba rapida del pipeline sin crear los 14 forms.
 *
 * runSmokeTests() ejecuta 2 bloques:
 *   1. FormBuilder applyItem pipeline — crea folder + form + sheet temporal,
 *      aplica 1 item de cada tipo, valida count, linkea Sheet, cleanup.
 *   2. readConfigFromSheet() error handling (Fase 1 2026-04-20) — valida que
 *      la función tire error con mensaje canónico cuando la pestaña
 *      '_respuestas_config' no existe (estado pre-Fase-2).
 *
 * Útil para verificar que los permisos estan OK y que el contrato de CFG se
 * cumple antes/después de que Fase 2 popule la pestaña.
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
  // No requiere artifacts temporales — opera sobre el Sheet container-bound.
  testReadConfigFromSheet();

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
 * Estado post-Fase-2: la pestaña existe (la creó el Form de onboarding) →
 * el test skipea el path de error. Cuando se cierre Fase 2 habrá que extender
 * este test para validar el path exitoso (keys correctas, tipos, etc.).
 */
function testReadConfigFromSheet() {
  console.log('----- Test Fase 1: readConfigFromSheet() error handling -----');

  // Fuerza re-lectura del Sheet en la siguiente llamada a CFG / readConfigFromSheet.
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
    // Path post-Fase-2: la pestaña existe. Solo loguear — test de path exitoso
    // se implementará cuando Fase 2 cierre y tengamos schema real de respuestas.
    console.log('SKIP: la pestaña "' + CFG_TAB_NAME + '" existe. Test de path exitoso pendiente hasta cerrar Fase 2.');
  }

  console.log('----- Test readConfigFromSheet OK -----');
}
