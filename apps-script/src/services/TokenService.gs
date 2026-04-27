/**
 * TokenService.gs — gestión de tokens UUID por docente.
 * Paso 5/20 plan v3 baja/suplentes-docente (2026-04-27).
 *
 * Responsabilidades:
 *   - generate(): genera un UUID v4 nuevo (wrap de Utilities.getUuid).
 *   - validate(token): busca un token en la pestaña 👥 Docentes del Sheet
 *     template y retorna metadata si la docente está autorizada
 *     (Estado != 'No disponible').
 *   - invalidate(token): vacía el token de la fila correspondiente.
 *     Usado por handleDarDeBaja (pasos 10-13) para revocar acceso al panel.
 *
 * El token vive en la columna 10 (oculta) de la pestaña 👥 Docentes.
 * Schema 👥 Docentes (definido en ConfigSheetBuilder paso 1):
 *   col 1=Apellido, 2=Nombre, 3=DNI, 4=Email, 5=Tipo,
 *   6=Estado, 7=Fecha alta, 8=Fecha cambio Estado, 9=Notas, 10=Token
 *
 * Defensive: todas las funciones manejan ausencia de container, pestaña
 * o filas vacías sin throw. Errores van a SetupLog.warn cuando aplicable.
 *
 * Diseñado para ser consumido por:
 *   - SetupOrchestrator._seedDocentesFromOnboarding (paso 4): generate()
 *   - WebApp.doGet (paso 6): validate(?token=)
 *   - handleSumarDocente (paso 10): generate()
 *   - handleDarDeBaja (paso 13): invalidate()
 *
 * Verificado en CT3 (Loop 1.5): UUID 36 chars + guiones es URL-safe.
 */

const TokenService = {

  /**
   * generate() — genera un UUID v4 nuevo.
   * Wrap de Utilities.getUuid() para centralizar la generación + permitir
   * reemplazar el algoritmo si fuera necesario (ej. acortar token a 16 chars).
   *
   * Retorna: string UUID v4 (36 chars con guiones, ej. "550e8400-e29b-41d4-a716-446655440000").
   */
  generate() {
    return Utilities.getUuid();
  },

  /**
   * validate(token) — busca un token en 👥 Docentes y retorna metadata
   * si la docente está autorizada para operar (Estado != 'No disponible').
   *
   * Activa Y Licencia están autorizadas (la docente con licencia puede
   * volver y mantiene acceso). Solo No disponible se rechaza.
   *
   * Retorna: {
   *   authorized: bool,
   *   docente: { apellido, nombre, email, estado } | null,
   *   reason: string | null
   * }
   *
   * Valores posibles de reason:
   *   'invalid-token'        — token vacío, null, o no string
   *   'no-container'         — no hay active spreadsheet (contexto raro)
   *   'no-tab'               — pestaña 👥 Docentes no existe
   *   'empty-tab'            — pestaña existe pero sin data rows
   *   'token-not-found'      — token no matchea ninguna fila
   *   'estado-no-disponible' — fila encontrada pero docente con Estado=No disponible
   *   null                   — autorizada
   */
  validate(token) {
    if (!token || typeof token !== 'string' || String(token).trim().length === 0) {
      return { authorized: false, docente: null, reason: 'invalid-token' };
    }

    const containerSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!containerSheet) {
      return { authorized: false, docente: null, reason: 'no-container' };
    }
    const tab = containerSheet.getSheetByName('👥 Docentes');
    if (!tab) {
      return { authorized: false, docente: null, reason: 'no-tab' };
    }
    const lastRow = tab.getLastRow();
    // row 1 = headers, row 2 = helptext, datos desde row 3
    if (lastRow < 3) {
      return { authorized: false, docente: null, reason: 'empty-tab' };
    }

    // Lee 10 columnas, data rows
    const range = tab.getRange(3, 1, lastRow - 2, 10);
    const values = range.getValues();
    const targetToken = String(token).trim();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const rowToken = String(row[9] || '').trim();
      if (rowToken === targetToken) {
        const estado = String(row[5] || '').trim();
        const docente = {
          apellido: String(row[0] || '').trim(),
          nombre: String(row[1] || '').trim(),
          email: String(row[3] || '').trim(),
          estado: estado
        };
        if (estado === 'No disponible') {
          return { authorized: false, docente: docente, reason: 'estado-no-disponible' };
        }
        return { authorized: true, docente: docente, reason: null };
      }
    }

    return { authorized: false, docente: null, reason: 'token-not-found' };
  },

  /**
   * invalidate(token) — vacía la columna Token de la fila que tenga ese token.
   * Usado por handleDarDeBaja para revocar acceso al panel sin borrar la fila
   * (la fila queda como histórico institucional con Estado=No disponible).
   *
   * Idempotente: si el token ya fue invalidado o no existe, retorna
   * { invalidated: false, reason: 'token-not-found' } sin throw.
   *
   * Retorna: { invalidated: bool, reason: string | null }
   */
  invalidate(token) {
    if (!token || typeof token !== 'string' || String(token).trim().length === 0) {
      return { invalidated: false, reason: 'invalid-token' };
    }

    const containerSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!containerSheet) {
      return { invalidated: false, reason: 'no-container' };
    }
    const tab = containerSheet.getSheetByName('👥 Docentes');
    if (!tab) {
      return { invalidated: false, reason: 'no-tab' };
    }
    const lastRow = tab.getLastRow();
    if (lastRow < 3) {
      return { invalidated: false, reason: 'empty-tab' };
    }

    // Busca solo la columna Token (col 10) — más eficiente que leer 10 cols
    const range = tab.getRange(3, 10, lastRow - 2, 1);
    const values = range.getValues();
    const targetToken = String(token).trim();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === targetToken) {
        const rowIndex = 3 + i; // row absoluto en el Sheet
        tab.getRange(rowIndex, 10).clearContent();
        if (typeof SetupLog !== 'undefined' && SetupLog.info) {
          SetupLog.info('TokenService.invalidate OK', { row: rowIndex });
        }
        return { invalidated: true, reason: null };
      }
    }

    return { invalidated: false, reason: 'token-not-found' };
  }

};
