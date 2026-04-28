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
 * handleSumarDocente — paso 10/20 plan v3 baja/suplentes-docente (2026-04-28).
 *
 * Recibe submission del form F-baja-01 (Sumar una docente, panel directora).
 * Ejecuta la transaccion logica completa:
 *   1. Validar inputs (apellido+nombre, email — required; dni, tipo — opcional).
 *   2. Verificar duplicado por email en 👥 Docentes (skip si ya existe).
 *   3. Generar token UUID PRIMERO (Loop 3 hallazgo 4-B — sin token, no escribimos).
 *   4. Escribir fila atomica en 👥 Docentes con Estado=Activa.
 *   5. Compartir yearFolder Drive con email (best-effort, continue-on-error).
 *   6. refreshDocentes() — stub hasta paso 14 plan v3.
 *   7. Loguear exito a 📋 Estado del sistema con URL admin (decision Fito:
 *      log only en v1 — Nely copia la URL del log).
 *
 * Cazadas resueltas:
 *   - Cazada A (getActiveSpreadsheet del trigger): TemplateResolver.resolve()
 *     resuelve el template via cache 'template:container' cuando active es el
 *     Sheet del trigger Sheet-bound (sub-paso 10.1).
 *   - Cazada B (yearFolder ID): defensive check folder:2026 en registry, WARN
 *     + skip share si no existe. Fila NO se revierte (Nely comparte manual).
 *   - Cazada C (LockService omitido — decision Fito): TODO PEND-PROD-1 anotado.
 *   - Cazada D (DOC_TEMPLATES): N/A — handler escribe a 👥 Docentes, no llama
 *     processFormalSubmit.
 *
 * Defensive guard L1 (feedback sesion vieja paso 10): si TemplateResolver no
 * resuelve, throw visible en panel Activadores en lugar de fallar silencioso.
 */
function handleSumarDocente(e) {
  // L1 — Defensive guard. Sin template, no hay transaccion posible.
  const ss = TemplateResolver.resolve('👥 Docentes');
  if (!ss) {
    console.error('handleSumarDocente: TemplateResolver.resolve fallo. ' +
      'Correr installSubmitDispatcher() para cachear template:container.');
    throw new Error('handleSumarDocente: template no resuelve — ' +
      'installSubmitDispatcher requerido');
  }
  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) {
    console.error('handleSumarDocente: pestaña 👥 Docentes no existe en template.');
    throw new Error('handleSumarDocente: pestaña 👥 Docentes no existe');
  }

  // TODO PEND-PROD-1 (escala 956 escuelas): wrap toda la logica en
  // LockService.getScriptLock().tryLock(timeout) + try/finally para release.
  // Hoy omitido (demo 1 directora, sin concurrencia real).

  // ==========================================================================
  // 1. Extraer y validar inputs (spec §2.1).
  // Usa _firstNonEmpty global (helper compartido — defensive para items
  // duplicados D-F3c-NUEVO-12, mitigacion del bug pre-fix raiz).
  // ==========================================================================
  const namedValues = (e && e.namedValues) || {};
  const apellidoNombre = _firstNonEmpty(namedValues['Apellido y nombre']);
  const dni = _firstNonEmpty(namedValues['DNI']);
  const email = _firstNonEmpty(namedValues['Email']);
  const tipo = _firstNonEmpty(namedValues['Tipo']);

  if (!apellidoNombre) {
    OperacionesLog.error('handleSumarDocente: Apellido y nombre vacio', {
      namedValues: namedValues
    });
    return;
  }
  // Mismo regex que SetupOrchestrator._isValidEmail (spec §2.1)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    OperacionesLog.error('handleSumarDocente: email invalido o vacio', {
      email: email, namedValues: namedValues
    });
    return;
  }

  // Parse "Apellido Nombre" — primera palabra apellido, resto nombre
  // (mismo patron que SetupOrchestrator._seedDocentesFromOnboarding).
  const parts = apellidoNombre.split(' ').filter(function(p) { return p.length > 0; });
  const apellido = parts.length > 0 ? parts[0] : '';
  const nombre = parts.slice(1).join(' ');

  // ==========================================================================
  // 2. Verificar duplicado por email (spec §2.2). Idempotencia critica:
  // re-submit del mismo form NO debe duplicar la fila.
  // ==========================================================================
  const targetEmailLower = email.toLowerCase();
  const lastRow = tab.getLastRow();
  if (lastRow >= 3) {
    const existingEmails = tab.getRange(3, 4, lastRow - 2, 1).getValues();
    for (let i = 0; i < existingEmails.length; i++) {
      if (String(existingEmails[i][0] || '').trim().toLowerCase() === targetEmailLower) {
        OperacionesLog.warn('handleSumarDocente: email ya existe en 👥 Docentes — skip', {
          email: email, rowExistente: 3 + i, apellidoNombre: apellidoNombre
        });
        return;
      }
    }
  }

  // ==========================================================================
  // 3. Generar token PRIMERO (Loop 3 hallazgo 4-B + spec §2.3).
  // Sin token, no escribimos fila parcial.
  // ==========================================================================
  let token;
  try {
    token = TokenService.generate();
  } catch (tokenErr) {
    OperacionesLog.error('handleSumarDocente: TokenService.generate fallo', {
      err: String(tokenErr), email: email
    });
    throw tokenErr;
  }

  // ==========================================================================
  // 4. Escribir fila completa atomica (spec §2.4). Schema 10 cols:
  // [Apellido, Nombre, DNI, Email, Tipo, Estado, Fecha alta, Fecha cambio, Notas, Token]
  // ==========================================================================
  const today = new Date();
  tab.appendRow([
    apellido,
    nombre,
    dni,
    email,
    tipo,
    'Activa',
    today,
    today,
    'Sumada via Panel Directora',
    token
  ]);

  // ==========================================================================
  // 5. Compartir Drive yearFolder (best-effort, cazada anticipada B + spec §2.5).
  // Si falla, NO revertir la fila — la docente queda registrada y Nely puede
  // compartir el folder manual desde Drive.
  // ==========================================================================
  try {
    const yearFolderEntry = PropertiesRegistry.get('folder:2026');
    if (yearFolderEntry && yearFolderEntry.id) {
      const yearFolder = DriveApp.getFolderById(yearFolderEntry.id);
      yearFolder.addEditor(email);
      OperacionesLog.info('handleSumarDocente: addEditor yearFolder OK', {
        email: email, yearFolderId: yearFolderEntry.id
      });
    } else {
      OperacionesLog.warn('handleSumarDocente: folder:2026 no en registry — share skipped', {
        email: email, accion: 'compartir manual desde Drive'
      });
    }
  } catch (shareErr) {
    OperacionesLog.warn('handleSumarDocente: addEditor fallo — fila escrita igual', {
      email: email, err: String(shareErr), accion: 'compartir manual desde Drive'
    });
  }

  // ==========================================================================
  // 6. refreshDocentes() — paso 14 plan v3 pendiente (spec §2.6).
  // Cuando 14 se implemente, regenera dropdowns de los 6 forms con
  // choicesFromList: 'docentes' para incluir la docente recien sumada.
  // ==========================================================================
  if (typeof refreshDocentes === 'function') {
    try {
      refreshDocentes();
      OperacionesLog.info('handleSumarDocente: refreshDocentes OK', {});
    } catch (refreshErr) {
      OperacionesLog.warn('handleSumarDocente: refreshDocentes fallo', {
        err: String(refreshErr)
      });
    }
  } else {
    OperacionesLog.info('handleSumarDocente: refreshDocentes pendiente paso 14 plan v3', {});
  }

  // ==========================================================================
  // 7. Log de exito + URL admin (spec §2.7-2.8 — decision Fito: log only).
  // Nely copia urlAdmin del log y se la manda a la nueva docente por WhatsApp.
  // ==========================================================================
  let urlAdmin = '';
  try {
    const base = PropertiesService.getScriptProperties().getProperty('webapp-url:teacher') || '';
    if (base) {
      urlAdmin = base + '?role=admin&token=' + encodeURIComponent(token);
    }
  } catch (urlErr) {
    // no-op — urlAdmin queda vacio
  }

  OperacionesLog.info('Docente sumada', {
    apellido: apellido,
    nombre: nombre,
    email: email,
    tipo: tipo,
    tokenLast4: token.slice(-4),
    urlAdmin: urlAdmin || '(URL no disponible — abrir webapp /exec una vez para que cachee webapp-url:teacher)'
  });
}

// ============================================================================
// Helpers compartidos para handlers operativos (pasos 11-13 plan v3).
// Definidos en scope global para reuso entre handleMarcarLicencia,
// handleVolvioLicencia, handleDarDeBaja, y handleSumarDocente.
// ============================================================================

/**
 * _firstNonEmpty(arr) — defensive helper para items duplicados del form
 * (mitigacion D-F3c-NUEVO-12). Si el form tiene 2 items con el mismo titulo
 * (efecto colateral de FormBuilder.applyItem no-idempotente pre-fix raiz),
 * e.namedValues['key'] retorna ['', 'valor real']. Tomar [0] retornaria
 * vacio. Iteramos hasta encontrar el primer elemento no-vacio (despues
 * de trim). Caso form normal (1 item, 1 valor): identico a [0].
 *
 * Movido a scope global el 2026-04-28 sesion 2 vuelta 6 — pasos 11-13
 * lo reusan.
 */
function _firstNonEmpty(arr) {
  if (!arr || !arr.length) return '';
  for (let i = 0; i < arr.length; i++) {
    const v = String(arr[i] || '').trim();
    if (v) return v;
  }
  return '';
}

/**
 * _findDocenteRowByDropdown(tab, dropdownValue) — busca la fila de la
 * pestaña '👥 Docentes' que matchea el value del dropdown 'docentes' del
 * form (formato `"Apellido, Nombre"` por ListasMaestrasBuilder
 * _readDocentesFromContainer L181 — concat con ', ').
 *
 * Edge cases: si solo apellido o solo nombre, ListasMaestrasBuilder
 * retorna sin coma. Replicamos la misma logica para identificar el match.
 *
 * Caveat homonimas: si hay 2 docentes con la misma combinacion exacta
 * "Apellido, Nombre", retorna la primera. Deuda menor — el dropdown
 * tampoco las distingue. Workaround proper requiere agregar email al
 * dropdown (scope nuevo).
 *
 * Returns: row absoluto en el Sheet (3+) o -1 si no encontrada.
 */
function _findDocenteRowByDropdown(tab, dropdownValue) {
  const target = String(dropdownValue || '').trim();
  if (!target) return -1;

  const lastRow = tab.getLastRow();
  if (lastRow < 3) return -1;

  // Cols 1+2 (Apellido + Nombre), data rows
  const range = tab.getRange(3, 1, lastRow - 2, 2).getValues();

  for (let i = 0; i < range.length; i++) {
    const apellido = String(range[i][0] || '').trim();
    const nombre = String(range[i][1] || '').trim();

    let candidate;
    if (apellido && nombre) candidate = apellido + ', ' + nombre;
    else if (apellido) candidate = apellido;
    else if (nombre) candidate = nombre;
    else continue;

    if (candidate === target) {
      return 3 + i;
    }
  }
  return -1;
}

/**
 * _changeDocenteEstado(e, formName, dropdownTitle, nuevoEstado, opts) —
 * patron compartido pasos 11-13 plan v3.
 *
 * Defensive guard L1 + lookup docente por dropdown + update Estado/Fecha
 * cambio. Para handleDarDeBaja (paso 13), opts={invalidateToken:true,
 * removeEditor:true} agrega revocacion de acceso (Loop 3 hallazgo 4-C:
 * try/catch + log WARN si removeEditor falla, fila marcada No disponible
 * igual — accion manual flagged en log para Nely).
 *
 * Returns: void. Loguea exito o error a OperacionesLog.
 */
function _changeDocenteEstado(e, formName, dropdownTitle, nuevoEstado, opts) {
  // L1 — Defensive guard
  const ss = TemplateResolver.resolve('👥 Docentes');
  if (!ss) {
    console.error(formName + ': TemplateResolver.resolve fallo. Correr installSubmitDispatcher.');
    throw new Error(formName + ': template no resuelve — installSubmitDispatcher requerido');
  }
  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) {
    console.error(formName + ': pestaña 👥 Docentes no existe en template.');
    throw new Error(formName + ': pestaña 👥 Docentes no existe');
  }

  // Extraer dropdown value
  const namedValues = (e && e.namedValues) || {};
  const dropdownValue = _firstNonEmpty(namedValues[dropdownTitle]);
  if (!dropdownValue) {
    OperacionesLog.error(formName + ': dropdown vacio', {
      dropdownTitle: dropdownTitle, namedValues: namedValues
    });
    return;
  }

  // Lookup fila
  const rowIndex = _findDocenteRowByDropdown(tab, dropdownValue);
  if (rowIndex === -1) {
    OperacionesLog.error(formName + ': docente no encontrada en 👥 Docentes', {
      dropdownValue: dropdownValue
    });
    return;
  }

  // Capturar email + token + estado anterior antes del update (para log + ops)
  const docenteRow = tab.getRange(rowIndex, 1, 1, 10).getValues()[0];
  const apellido = String(docenteRow[0] || '').trim();
  const nombre = String(docenteRow[1] || '').trim();
  const email = String(docenteRow[3] || '').trim();
  const tokenAnterior = String(docenteRow[9] || '').trim();
  const estadoAnterior = String(docenteRow[5] || '').trim();

  // Update Estado (col 6) + Fecha cambio (col 8)
  const today = new Date();
  tab.getRange(rowIndex, 6).setValue(nuevoEstado);
  tab.getRange(rowIndex, 8).setValue(today);

  // Para baja (paso 13): invalidate token + removeEditor (best-effort)
  let tokenInvalidated = false;
  let editorRemoved = false;
  let editorRemoveFailed = false;

  if (opts && opts.invalidateToken && tokenAnterior) {
    try {
      const result = TokenService.invalidate(tokenAnterior);
      tokenInvalidated = result && result.invalidated;
    } catch (tokenErr) {
      OperacionesLog.warn(formName + ': TokenService.invalidate fallo', {
        err: String(tokenErr), row: rowIndex
      });
    }
  }

  if (opts && opts.removeEditor && email) {
    try {
      const yearFolderEntry = PropertiesRegistry.get('folder:2026');
      if (yearFolderEntry && yearFolderEntry.id) {
        const yearFolder = DriveApp.getFolderById(yearFolderEntry.id);
        yearFolder.removeEditor(email);
        editorRemoved = true;
      } else {
        OperacionesLog.warn(formName + ': folder:2026 no en registry — removeEditor skipped (revocar manual desde Drive)', {
          email: email
        });
      }
    } catch (removeErr) {
      editorRemoveFailed = true;
      OperacionesLog.warn(formName + ': removeEditor fallo — fila marcada No disponible IGUAL, ACCION MANUAL: revocar acceso del email desde Drive', {
        email: email, err: String(removeErr)
      });
    }
  }

  // Refresh dropdowns que listan 👥 Docentes (paso 14 plan v3 — cierra
  // D-F3c-NUEVO-14 dropdown stale post-edit). Best-effort: si falla, log
  // WARN pero NO revertir el update Estado (la fila ya quedo correcta,
  // los dropdowns quedan stale hasta proximo refresh).
  let refreshReport = null;
  if (typeof refreshDocentes === 'function') {
    try {
      refreshReport = refreshDocentes();
    } catch (refreshErr) {
      OperacionesLog.warn(formName + ': refreshDocentes fallo', {
        err: String(refreshErr)
      });
    }
  }

  OperacionesLog.info(formName + ' OK', {
    docente: dropdownValue,
    apellido: apellido,
    nombre: nombre,
    email: email,
    estadoAnterior: estadoAnterior,
    estadoNuevo: nuevoEstado,
    row: rowIndex,
    tokenInvalidated: tokenInvalidated,
    editorRemoved: editorRemoved,
    editorRemoveFailed: editorRemoveFailed,
    refreshDurationMs: refreshReport && refreshReport.durationMs,
    refreshItemsUpdated: refreshReport && refreshReport.itemsUpdated,
    refreshFailed: refreshReport ? refreshReport.failed.length : null
  });
}

// ============================================================================
// Handlers operativos pasos 11-13 plan v3 baja/suplentes-docente (2026-04-28).
// Patron simetrico via _changeDocenteEstado: Defensive guard + dropdown lookup
// + update Estado/Fecha + (opt) token invalidation + (opt) Drive editor remove.
// ============================================================================

/**
 * handleMarcarLicencia — paso 11/20. Cambia Estado a 'Licencia' + Fecha
 * cambio = hoy. NO toca permisos del Drive (la docente con licencia
 * mantiene acceso porque puede volver). NO desactiva al suplente que la
 * cubra (decision humana de la directora — paso 17/18 trae UI para eso).
 */
function handleMarcarLicencia(e) {
  return _changeDocenteEstado(e, 'handleMarcarLicencia', 'Que docente esta de licencia?', 'Licencia');
}

/**
 * handleVolvioLicencia — paso 12/20. Cambia Estado a 'Activa' + Fecha
 * cambio = hoy. NO desactiva al suplente automaticamente (decision humana
 * de la directora). Si la docente nunca estuvo de licencia (no estado
 * actual) igual se marca Activa — defensive: el dropdown solo deberia
 * mostrar docentes con Estado=Licencia (paso 14 refreshDocentes pendiente).
 */
function handleVolvioLicencia(e) {
  return _changeDocenteEstado(e, 'handleVolvioLicencia', 'Que docente volvio?', 'Activa');
}

/**
 * handleDarDeBaja — paso 13/20. Cambia Estado a 'No disponible' + Fecha
 * cambio = hoy + invalidate Token (limpia col 10) + try removeEditor del
 * yearFolder (Loop 3 hallazgo 4-C: defensive — si falla, log WARN +
 * accion manual flagged, fila marcada igual).
 *
 * Operacion irreversible — la fila NO se borra (queda como historico
 * institucional). Defensive: requiere checkbox 'Confirmacion' marcado.
 */
function handleDarDeBaja(e) {
  // Confirmation check defensive (form requiere required:true, pero por las dudas)
  const namedValues = (e && e.namedValues) || {};
  const confirmacion = _firstNonEmpty(namedValues['Confirmacion']);
  if (!confirmacion) {
    OperacionesLog.error('handleDarDeBaja: confirmacion no marcada — abortando (operacion irreversible)', {
      namedValues: namedValues
    });
    return;
  }
  return _changeDocenteEstado(e, 'handleDarDeBaja', 'A quien das de baja?', 'No disponible', {
    invalidateToken: true,
    removeEditor: true
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
  'SHEET-Sumar-Docente-2026':        handleSumarDocente,
  'SHEET-Marcar-Licencia-2026':      handleMarcarLicencia,
  'SHEET-Volvio-Licencia-2026':      handleVolvioLicencia,
  'SHEET-Dar-De-Baja-2026':          handleDarDeBaja,

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
