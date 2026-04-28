/**
 * OnSubmitDispatcher.gs — trigger único Sheet-bound consolidado.
 * Paso 9/20 plan v3 baja/suplentes-docente (2026-04-28).
 *
 * Reemplaza los 9 triggers viejos onFormalFormSubmit (desinstalados en paso
 * 8.5) con UN trigger Sheet-bound en el container. El handler global
 * `onFormSubmitDispatcher` recibe TODOS los eventos onFormSubmit del Sheet
 * y dispatchea por nombre de pestaña de respuestas
 * (`e.range.getSheet().getName()`) a handlers específicos via DISPATCH_TABLE.
 *
 * Fixes incorporados:
 *   - Loop 3 hallazgo 2-A: usar `e.range.getSheet().getName()` (NO
 *     `e.source.getTitle()` que retorna el nombre del Spreadsheet en un
 *     Sheet-bound trigger, NOT el del Form origen).
 *   - Loop 3 hallazgo 5-B: branch default explícito que loguea sin throw.
 *   - Loop 3 hallazgo 4-C (parcial): handlers de los 4 operativos con
 *     try/catch defensivo (delegado a handlers reales en pasos 10-13).
 *
 * Handlers actuales (paso 9):
 *   - 4 forms operativos del Panel Directora (paso 8): stubs que loguean a
 *     OperacionesLog. Reemplazar por handlers reales en pasos 10-13.
 *   - 6 forms formales del ciclo (F05/F06/F08/F09/F13/F14): delegan a
 *     FormalFormsTriggerManager.processFormalSubmit(e, formId) que extrae
 *     responseData del e.namedValues y genera el Doc correspondiente.
 *   - 5 forms pedagogicos/institucional sin DocGen (F01/F02/F03/F04/F07):
 *     stubs que loguean. Paso 16 plan v3 trae handleAuthCheck para verificar
 *     email contra Docentes antes de procesar.
 *
 * Total DISPATCH_TABLE entries: 15 = 4 operativos + 6 formales + 5 ped/inst.
 * Cubre los 15 forms creados por setupAll() (sin F10/F11/F12 cooperadora
 * omitida + el F00 onboarding que tiene su propio trigger separado).
 *
 * Instalación: NO se instala automaticamente. Usar installSubmitDispatcher()
 * en Main.gs (acción manual una vez por deploy).
 */

// ============================================================================
// Handlers stub — declarados arriba (function declarations hoisted) para que
// DISPATCH_TABLE pueda referenciarlos sin errores de orden.
// ============================================================================

/**
 * handleSumarDocenteStub — stub paso 9. TODO paso 10: implementacion real
 * (transaccion logica con TokenService.generate() PRIMERO, despues
 * upsertByEmail — Loop 3 hallazgo 4-B).
 */
function handleSumarDocenteStub(e) {
  OperacionesLog.info('handleSumarDocente recibido (stub paso 9)', {
    sheetName: e.range.getSheet().getName(),
    rowIndex: e.range.getRow(),
    namedValues: e.namedValues
  });
}

/**
 * handleMarcarLicenciaStub — stub paso 9. TODO paso 11: cambiar Estado a
 * 'Licencia' + Fecha cambio Estado = hoy. NO toca permisos del Drive.
 */
function handleMarcarLicenciaStub(e) {
  OperacionesLog.info('handleMarcarLicencia recibido (stub paso 9)', {
    sheetName: e.range.getSheet().getName(),
    rowIndex: e.range.getRow(),
    namedValues: e.namedValues
  });
}

/**
 * handleVolvioLicenciaStub — stub paso 9. TODO paso 12: cambiar Estado a
 * 'Activa' + Fecha cambio Estado = hoy. NO desactiva al suplente.
 */
function handleVolvioLicenciaStub(e) {
  OperacionesLog.info('handleVolvioLicencia recibido (stub paso 9)', {
    sheetName: e.range.getSheet().getName(),
    rowIndex: e.range.getRow(),
    namedValues: e.namedValues
  });
}

/**
 * handleDarDeBajaStub — stub paso 9. TODO paso 13: cambiar Estado a
 * 'No disponible' + Token invalidado + try removeEditor con manejo defensivo
 * (Loop 3 hallazgo 4-C).
 */
function handleDarDeBajaStub(e) {
  OperacionesLog.info('handleDarDeBaja recibido (stub paso 9)', {
    sheetName: e.range.getSheet().getName(),
    rowIndex: e.range.getRow(),
    namedValues: e.namedValues
  });
}

/**
 * handlePedagogicoStub — stub paso 9 para los 5 forms pedagogicos/institucional
 * sin DocGen (F01/F02/F03/F04/F07). TODO paso 16: handleAuthCheck que verifica
 * email contra Docentes antes de procesar.
 */
function handlePedagogicoStub(e, formId) {
  OperacionesLog.info('handlePedagogico recibido (stub paso 9)', {
    formId: formId,
    sheetName: e.range.getSheet().getName(),
    rowIndex: e.range.getRow()
  });
}

// ============================================================================
// Helpers DRY para construccion del DISPATCH_TABLE — evitan repetir closures
// inline para los 6 formales y los 5 pedagogicos.
// ============================================================================

function _delegateToFormalSubmit(formId) {
  return function(e) {
    FormalFormsTriggerManager.processFormalSubmit(e, formId);
  };
}

function _delegateToPedagogicoStub(formId) {
  return function(e) {
    handlePedagogicoStub(e, formId);
  };
}

// ============================================================================
// Tabla de dispatch — sheet name → handler.
// Los nombres de pestaña matchean exactamente lo que setupAll() crea
// (cfg.sheetName + '-' + CFG.YEAR via FormBuilder._applyYearSuffix).
// ============================================================================

const DISPATCH_TABLE = {
  // 4 forms operativos del Panel Directora (paso 8 plan v3) — stubs.
  'SHEET-Sumar-Docente-2026':        handleSumarDocenteStub,
  'SHEET-Marcar-Licencia-2026':      handleMarcarLicenciaStub,
  'SHEET-Volvio-Licencia-2026':      handleVolvioLicenciaStub,
  'SHEET-Dar-De-Baja-2026':          handleDarDeBajaStub,

  // 6 forms formales del ciclo — delegation a processFormalSubmit (refactor
  // extract item 2 paso 9). Genera Google Doc segun DOC_TEMPLATES[formId].
  'SHEET-Actas-2026':                _delegateToFormalSubmit('F05'),
  'SHEET-PIE-2026':                  _delegateToFormalSubmit('F06'),
  'SHEET-Autorizaciones-2026':       _delegateToFormalSubmit('F08'),
  'SHEET-Comunicados-2026':          _delegateToFormalSubmit('F09'),
  'SHEET-Precarga-SGE-2026':         _delegateToFormalSubmit('F13'),
  'SHEET-Legajos-2026':              _delegateToFormalSubmit('F14'),

  // 5 forms pedagogicos/institucional sin DocGen — stubs hasta paso 16
  // (handleAuthCheck).
  'SHEET-Planificaciones-2026':      _delegateToPedagogicoStub('F01'),
  'SHEET-Registro-Clases-2026':      _delegateToPedagogicoStub('F02'),
  'SHEET-Seguimiento-Alumnos-2026':  _delegateToPedagogicoStub('F03'),
  'SHEET-Evaluaciones-2026':         _delegateToPedagogicoStub('F04'),
  'SHEET-Novedades-Diarias-2026':    _delegateToPedagogicoStub('F07')
};

// ============================================================================
// Entry point del trigger Sheet-bound. Esta funcion es global (NO dentro de
// un objeto) porque ScriptApp.newTrigger().forSpreadsheet().onFormSubmit()
// busca el handler por nombre en el scope global.
// ============================================================================

/**
 * onFormSubmitDispatcher(e) — handler del trigger Sheet-bound consolidado.
 *
 * Recibe el event object cada vez que CUALQUIER form vinculado al Sheet
 * recibe una submission. Identifica el form origen via el nombre de la
 * pestaña de respuestas y dispatchea al handler correspondiente.
 *
 * Error handling:
 *   - Try/catch global: cualquier excepcion en el handler se loguea pero
 *     NO re-throw (trigger queda healthy, evita retry que duplicaria efectos).
 *   - Branch default explicito: forms desconocidos (ej. nuevos forms creados
 *     manualmente por usuario) loguean WARN pero NO throw.
 */
function onFormSubmitDispatcher(e) {
  try {
    if (!e || !e.range) {
      OperacionesLog.warn('Dispatcher: event sin e.range (ejecutado fuera de trigger?)', {
        hasEvent: !!e,
        hasRange: !!(e && e.range)
      });
      return;
    }

    // FIX 2026-04-28 (post-validacion): cada form tiene su propio Spreadsheet
    // de respuestas (FormBuilder crea 1 Sheet separado por form en
    // 06-Sheets-Maestros). Por eso el trigger es Sheet-bound apuntando a
    // CADA Spreadsheet de respuestas, y `e.source` es ese Spreadsheet.
    // `e.source.getName()` retorna 'SHEET-Sumar-Docente-2026' (matchea las
    // keys de DISPATCH_TABLE). Antes usabamos `e.range.getSheet().getName()`
    // que retornaba 'Form Responses 1' (la pestana interna default de
    // Google Forms al hacer setDestination).
    const sheetName = e.source.getName();
    const handler = DISPATCH_TABLE[sheetName];

    if (!handler) {
      OperacionesLog.warn('Dispatcher: form desconocido recibido', {
        sheetName: sheetName,
        timestamp: new Date().toISOString()
      });
      return;
    }

    handler(e);

  } catch (err) {
    OperacionesLog.error('Dispatcher: error catastrofico', {
      err: String(err),
      stack: err && err.stack
    });
    console.error('Dispatcher error: ' + String(err));
    // NO re-throw — trigger queda healthy.
  }
}
