/**
 * ConfigRoot.gs — constantes globales del proyecto DAI.
 * Fase 1 del plan v9 implementada 2026-04-20 por FORJA2.
 * R1 2026-04-21: CFG extendido con los 11 campos del onboarding (antes era
 * NOOP — solo 3 keys llegaban al código, el resto se guardaba en
 * _respuestas_config pero nadie lo leía).
 *
 * Arquitectura:
 *   - Constantes del producto (PARENT_FOLDER_NAME, MASTER_LISTS_SHEET_NAME,
 *     DASHBOARD_*) viven en CFG_DEFAULTS — no cambian entre escuelas.
 *   - Valores dinámicos por escuela (YEAR, SCHOOL_NAME, LOCATION + 11 extras
 *     del onboarding) se leen lazy de '_respuestas_config' del Sheet
 *     container-bound, populada por el Form de onboarding.
 *   - CFG expuesto es un Proxy: primera lectura dispara readConfigFromSheet()
 *     y cachea el resultado en _cfgCache para toda la ejecución del script.
 *   - API preserva CFG.YEAR, CFG.SCHOOL_NAME, CFG.LOCATION (Fase 1) + agrega
 *     CFG.DIRECTOR_EMAIL, CFG.SECTION_COUNT, CFG.COOPERADORA_ACTIVA, etc.
 *
 * Referencias canónicas:
 *   - Plan v9 Fase 1: líneas 342-356 de plan-v1-publico-fases-1-2-3-2026-04-20.md
 *   - Schema del Form de onboarding: ConfigFormOnboarding.gs (snake_case, R11 biblia)
 *   - Capsula reparación Fase 2 R1: CAPSULA-REPAIR-FASE-2-R1-FORJA2-2026-04-21.md
 */

// --- Constantes estáticas del producto ---------------------------------------

const CFG_DEFAULTS = Object.freeze({
  PARENT_FOLDER_NAME: 'Escuela',
  MASTER_LISTS_SHEET_NAME: 'SHEET-Listas-Maestras',
  DASHBOARD_SHEET_NAME: 'DASHBOARD-General',
  DASHBOARD_TABS: ['Resumen del dia', 'Semana en curso', 'PIE - Estado', 'Cooperadora', 'Alertas'],

  // Defaults conservadores para los campos dinámicos (R1 fix B2).
  // Si _respuestas_config no tiene el campo o está vacío, se usa el default.
  SECTION_COUNT_DEFAULT: 3,
  COOPERADORA_ACTIVA_DEFAULT: true,  // conservador: mejor crear F10-F12 y que sobren que que falten
  PEI_ACTIVO_DEFAULT: false
});

const CFG_TAB_NAME = '_respuestas_config';

// Solo estas 3 son obligatorias (validadas en readConfigFromSheet → throw).
// Los otros campos del onboarding tienen defaults conservadores cuando faltan.
const CFG_REQUIRED_KEYS = Object.freeze(['school_name', 'academic_year', 'location']);

let _cfgCache = null;

// --- Utilidades de parsing --------------------------------------------------

/**
 * _parseSiNo(value) — convierte "Si"/"Sí"/"si"/"sí"/"yes"/true a true.
 * Cualquier otra cosa → false. Usado para flags booleanos del onboarding.
 */
function _parseSiNo(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  const s = String(value).toLowerCase().trim();
  if (s === '') return false;
  return s.indexOf('si') === 0 || s === 'sí' || s === 'yes' || s === 'true';
}

/**
 * _parseInteger(value, defaultVal) — convierte a integer. Si no parsea o es
 * <= 0, retorna defaultVal.
 */
function _parseInteger(value, defaultVal) {
  const n = parseInt(String(value).trim(), 10);
  if (isNaN(n) || n <= 0) return defaultVal;
  return n;
}

// --- Lectura del Sheet -------------------------------------------------------

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
  const latestRow = data[data.length - 1];

  const result = {};
  headers.forEach(function(header, idx) {
    if (header) result[header] = latestRow[idx];
  });

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
 * _loadCFG() — INTERNO. Fusiona CFG_DEFAULTS con los valores dinámicos del
 * onboarding. 3 required (obliga a tenerlos) + 11 extras con fallback a default.
 * Solo se llama desde el Proxy en la primera lectura de CFG.
 */
function _loadCFG() {
  const fromSheet = readConfigFromSheet();

  return Object.freeze({
    // ---- Constantes del producto ----
    PARENT_FOLDER_NAME: CFG_DEFAULTS.PARENT_FOLDER_NAME,
    MASTER_LISTS_SHEET_NAME: CFG_DEFAULTS.MASTER_LISTS_SHEET_NAME,
    DASHBOARD_SHEET_NAME: CFG_DEFAULTS.DASHBOARD_SHEET_NAME,
    DASHBOARD_TABS: CFG_DEFAULTS.DASHBOARD_TABS,

    // ---- 3 required del Form de onboarding (contrato Fase 1) ----
    YEAR: String(fromSheet.academic_year),
    SCHOOL_NAME: String(fromSheet.school_name),
    LOCATION: String(fromSheet.location),

    // ---- 11 extras del Form de onboarding (R1 fix B2 — 2026-04-21) ----
    // Datos de la directora
    DIRECTOR_NAME: String(fromSheet.director_name || ''),
    DIRECTOR_EMAIL: String(fromSheet.director_email || ''),
    DIRECTOR_CUIL: String(fromSheet.director_cuil || ''),

    // Turno / estructura
    TURNO: String(fromSheet.turno || ''),
    SECTION_COUNT: _parseInteger(fromSheet.section_count, CFG_DEFAULTS.SECTION_COUNT_DEFAULT),

    // Curriculum + recursos humanos
    ESPACIOS_CURRICULARES: String(fromSheet.espacios_curriculares || ''),  // CSV del checkbox Form
    TEACHER_EMAILS: String(fromSheet.teacher_emails || ''),  // string multi-linea del PARAGRAPH

    // Flags booleanos (parsed de "Si"/"No")
    COOPERADORA_ACTIVA: fromSheet.cooperadora_activa !== undefined && fromSheet.cooperadora_activa !== ''
      ? _parseSiNo(fromSheet.cooperadora_activa)
      : CFG_DEFAULTS.COOPERADORA_ACTIVA_DEFAULT,
    PEI_ACTIVO: fromSheet.pei_activo !== undefined && fromSheet.pei_activo !== ''
      ? _parseSiNo(fromSheet.pei_activo)
      : CFG_DEFAULTS.PEI_ACTIVO_DEFAULT,

    // Libres
    OBSERVATIONS: String(fromSheet.observations || ''),
    CONFIRM_GENERATE: String(fromSheet.confirm_generate || '')
  });
}

const CFG = new Proxy({}, {
  get: function(_target, prop) {
    if (!_cfgCache) {
      _cfgCache = _loadCFG();
    }
    return _cfgCache[prop];
  }
});

// --- Helpers dependientes de CFG --------------------------------------------

function yearFolderName() {
  return String(CFG.YEAR);
}

function sheetName(base) {
  return base + '-' + CFG.YEAR;
}

// --- Test utility (solo para SmokeTests.gs) ---------------------------------

function _resetCFGCache() {
  _cfgCache = null;
}
