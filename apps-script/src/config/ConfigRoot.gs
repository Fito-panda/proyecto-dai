/**
 * ConfigRoot.gs — constantes globales del proyecto DAI.
 * Fase 1 del plan v9 implementada 2026-04-20 por FORJA2.
 *
 * Arquitectura:
 *   - Valores estáticos del producto (PARENT_FOLDER_NAME, MASTER_LISTS_SHEET_NAME,
 *     DASHBOARD_SHEET_NAME, DASHBOARD_TABS) viven en CFG_DEFAULTS — no cambian
 *     entre escuelas.
 *   - Valores dinámicos por escuela (YEAR, SCHOOL_NAME, LOCATION) se leen lazy
 *     de la pestaña '_respuestas_config' del Sheet container-bound, populada
 *     por el Form de onboarding que se implementa en Fase 2 del plan v9.
 *   - CFG expuesto es un Proxy: primera lectura de cualquier propiedad dispara
 *     readConfigFromSheet() y cachea el resultado en _cfgCache para toda la
 *     ejecución del script. API (CFG.YEAR, CFG.SCHOOL_NAME, etc.) queda intacta
 *     para todos los consumers — cero refactor fuera de este archivo.
 *
 * Referencias canónicas:
 *   - Plan v9 Fase 1: líneas 342-356 de plan-v1-publico-fases-1-2-3-2026-04-20.md
 *   - Schema del Form de onboarding: headers en inglés por R11 biblia (STANDARD NAMES)
 */

// --- Constantes estáticas del producto ---------------------------------------

const CFG_DEFAULTS = Object.freeze({
  // Carpeta raíz en My Drive donde DAI crea todo.
  PARENT_FOLDER_NAME: 'Escuela',

  // Sheet de listas maestras — nombre fijo, no depende de escuela.
  MASTER_LISTS_SHEET_NAME: 'SHEET-Listas-Maestras',

  // Dashboard — nombre genérico, la directora lo usa para pegar fórmulas IMPORTRANGE.
  DASHBOARD_SHEET_NAME: 'DASHBOARD-General',

  // Tabs del dashboard — vacías al crearse; la directora pega las fórmulas después.
  DASHBOARD_TABS: ['Resumen del dia', 'Semana en curso', 'PIE - Estado', 'Cooperadora', 'Alertas']
});

// Nombre canónico de la pestaña con las respuestas del Form de onboarding.
// La pestaña la crea y popula el Form (Fase 2) al recibir la primera respuesta.
const CFG_TAB_NAME = '_respuestas_config';

// Keys obligatorias en los headers de _respuestas_config.
// Nombres en inglés por R11 biblia (STANDARD NAMES).
const CFG_REQUIRED_KEYS = Object.freeze(['school_name', 'academic_year', 'location']);

// Cache en memoria de la CFG resuelta. Se puebla en la primera invocación
// de _loadCFG(). Dura toda la ejecución del script actual (Apps Script crea
// una VM nueva por cada trigger, así que la caché es por ejecución).
let _cfgCache = null;

// --- Lectura del Sheet -------------------------------------------------------

/**
 * readConfigFromSheet() — lee la pestaña '_respuestas_config' del Spreadsheet
 * container-bound y devuelve un objeto con los headers como keys y los valores
 * de la última fila (respuesta más reciente del Form).
 *
 * Schema esperado (cuando el Form de Fase 2 esté vivo):
 *   | school_name | academic_year | location   | ... |
 *   | "Escuela X" | 2026          | "Ciudad"   | ... |
 *
 * Retorna: { school_name, academic_year, location, ...otros headers presentes }
 * Throws:
 *   - Error si no hay SpreadsheetApp activo (script no está container-bound).
 *   - Error "No encuentro la pestaña '_respuestas_config'..." si falta la pestaña.
 *   - Error "...no tiene respuestas del Form todavía" si la pestaña está vacía.
 *   - Error "Falta la clave obligatoria 'X'..." si alguna key requerida no está o está vacía.
 */
function readConfigFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'ConfigRoot.readConfigFromSheet() requiere contexto container-bound. ' +
      'No hay SpreadsheetApp activo — el script no está vinculado a ningún Sheet.'
    );
  }

  const tab = ss.getSheetByName(CFG_TAB_NAME);
  if (!tab) {
    throw new Error(
      'No encuentro la pestaña "' + CFG_TAB_NAME + '" en el Sheet. ' +
      'La pestaña la crea el Form de onboarding automáticamente al recibir la primera respuesta. ' +
      'Enviá el Form de onboarding antes de ejecutar setupAll.'
    );
  }

  const data = tab.getDataRange().getValues();
  if (data.length < 2) {
    throw new Error(
      'La pestaña "' + CFG_TAB_NAME + '" existe pero no tiene respuestas del Form todavía. ' +
      'Enviá el Form de onboarding para popular la pestaña con al menos 1 respuesta.'
    );
  }

  const headers = data[0].map(function(h) { return String(h).trim(); });
  const latestRow = data[data.length - 1]; // última fila = respuesta más reciente

  const result = {};
  headers.forEach(function(header, idx) {
    if (header) result[header] = latestRow[idx];
  });

  // Validar keys obligatorias
  CFG_REQUIRED_KEYS.forEach(function(key) {
    const v = result[key];
    if (v === undefined || v === null || String(v).trim() === '') {
      throw new Error(
        'Falta la clave obligatoria "' + key + '" en la pestaña "' + CFG_TAB_NAME + '". ' +
        'Verificá que el Form de onboarding tenga una pregunta cuyo header en el Sheet sea exactamente "' + key + '" y que esté respondida en la última fila.'
      );
    }
  });

  if (typeof SetupLog !== 'undefined' && SetupLog && SetupLog.info) {
    SetupLog.info('readConfigFromSheet OK', {
      tab: CFG_TAB_NAME,
      totalRowsEnSheet: data.length - 1,
      headersEncontrados: headers.filter(Boolean).length,
      keysObligatoriasOk: CFG_REQUIRED_KEYS.length
    });
  }

  return result;
}

// --- Resolución lazy + Proxy -------------------------------------------------

/**
 * _loadCFG() — INTERNO. Fusiona CFG_DEFAULTS con los valores dinámicos leídos
 * del Sheet. Solo se llama desde el Proxy en la primera lectura de CFG.
 */
function _loadCFG() {
  const fromSheet = readConfigFromSheet();

  return Object.freeze({
    PARENT_FOLDER_NAME: CFG_DEFAULTS.PARENT_FOLDER_NAME,
    YEAR: String(fromSheet.academic_year),
    SCHOOL_NAME: String(fromSheet.school_name),
    LOCATION: String(fromSheet.location),
    MASTER_LISTS_SHEET_NAME: CFG_DEFAULTS.MASTER_LISTS_SHEET_NAME,
    DASHBOARD_SHEET_NAME: CFG_DEFAULTS.DASHBOARD_SHEET_NAME,
    DASHBOARD_TABS: CFG_DEFAULTS.DASHBOARD_TABS
  });
}

/**
 * CFG — objeto global lazy. La primera lectura de cualquier propiedad dispara
 * _loadCFG() (que lee el Sheet); las siguientes usan _cfgCache en memoria.
 *
 * API preservada: los consumers (FolderBuilder, SetupOrchestrator, etc.) siguen
 * usando CFG.YEAR, CFG.SCHOOL_NAME, etc. sin enterarse del refactor.
 */
const CFG = new Proxy({}, {
  get: function(_target, prop) {
    if (!_cfgCache) {
      _cfgCache = _loadCFG();
    }
    return _cfgCache[prop];
  }
});

// --- Helpers dependientes de CFG --------------------------------------------

/**
 * yearFolderName(): nombre de la subcarpeta del año actual.
 * Ej: '2026'
 */
function yearFolderName() {
  return String(CFG.YEAR);
}

/**
 * sheetName(base): aplica sufijo -YYYY al nombre base.
 * Ej: sheetName('SHEET-Planificaciones') -> 'SHEET-Planificaciones-2026'
 */
function sheetName(base) {
  return base + '-' + CFG.YEAR;
}

// --- Test utility (solo para SmokeTests.gs) ---------------------------------

/**
 * _resetCFGCache() — INTERNO. Fuerza re-lectura del Sheet en el próximo
 * acceso a CFG. Usado por SmokeTests para poder probar errores de config
 * sin mantener estado entre tests. NO usar en código de producción.
 */
function _resetCFGCache() {
  _cfgCache = null;
}
