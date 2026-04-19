/**
 * ConfigRoot.gs — constantes globales del proyecto DAI.
 *
 * IMPORTANTE (Fase 1 — pendiente):
 *   Los valores marcados como '<leer-de-sheet-config>' se leeran dinamicamente
 *   de la pestana "⚙️ Configuracion" del Sheet template al que este script
 *   esta bindeado (container-bound). La funcion readConfigFromSheet() se
 *   implementa en Fase 1 del roadmap y reemplaza los placeholders de abajo.
 *
 *   Hasta que ese refactor exista, esta version SIRVE como contrato: cualquier
 *   codigo que lea CFG.SCHOOL_NAME se rompe de forma obvia en lugar de silencioso
 *   — un fallo ruidoso es mejor que un nombre de escuela incorrecto.
 */

const CFG = Object.freeze({

  // Carpeta raiz en My Drive donde DAI crea todo.
  // Default = 'Escuela'. La directora puede cambiarlo via Sheet de config en futuras versiones.
  PARENT_FOLDER_NAME: 'Escuela',

  // Año lectivo. TODO Fase 1: leer de pestaña ⚙️ Configuracion, key `anio_lectivo`.
  YEAR: '<leer-de-sheet-config>',  // ej: 2026

  // Datos institucionales. TODO Fase 1: leer de pestaña ⚙️ Configuracion.
  SCHOOL_NAME: '<leer-de-sheet-config>',  // ej: "Escuela N° 123"
  LOCATION: '<leer-de-sheet-config>',     // ej: "Ciudad, Provincia"

  // Sheet de listas maestras — nombre fijo, no depende de escuela.
  MASTER_LISTS_SHEET_NAME: 'SHEET-Listas-Maestras',

  // Dashboard — nombre generico, la directora lo usa para pegar formulas IMPORTRANGE.
  DASHBOARD_SHEET_NAME: 'DASHBOARD-General',

  // Tabs del dashboard — vacias al crearse; la directora pega las formulas despues.
  DASHBOARD_TABS: ['Resumen del dia', 'Semana en curso', 'PIE - Estado', 'Cooperadora', 'Alertas']

});

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

/**
 * readConfigFromSheet() — TODO Fase 1.
 *
 * Lee la pestana "⚙️ Configuracion" del Spreadsheet container y devuelve
 * un objeto con los valores que hoy son placeholders '<leer-de-sheet-config>'.
 *
 * Schema de la pestana (ver docs/Sheet-Template-Design.md):
 *   | clave            | valor                |
 *   |------------------|----------------------|
 *   | nombre_escuela   | <texto libre>        |
 *   | anio_lectivo     | <numero 2026-2100>   |
 *   | localidad        | <Ciudad, Provincia>  |
 *   | email_directora  | <email>              |
 *   | ...              | ...                  |
 *
 * Retorna: { nombre_escuela, anio_lectivo, localidad, ... }
 * Throws: Error si la pestana no existe o alguna clave obligatoria esta vacia.
 */
function readConfigFromSheet() {
  throw new Error(
    'readConfigFromSheet() no implementado todavia — ' +
    'pendiente de Fase 1 del roadmap. ' +
    'Ver docs/design/03-arquitectura.md'
  );
}
