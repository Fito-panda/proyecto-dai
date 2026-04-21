/**
 * Main.gs — entry points expuestos al IDE de Apps Script.
 *
 * Desde el IDE (script.google.com):
 *   - Elegir la funcion en el selector
 *   - Click Run
 *
 * Primera corrida: se pide permisos. Ver README para el warning "app no verificada".
 */

/**
 * bootstrapTemplate — ejecutar UNA VEZ por Template (operador DAI).
 * Crea las 8 pestañas del Sheet + Form de onboarding + trigger onFormSubmit.
 * Idempotente: correr dos veces no duplica.
 * Fase 2 del plan v9.
 */
function bootstrapTemplate() {
  return TemplateBootstrapper.run();
}

/**
 * Corre todo. Crea/actualiza Drive tree + Listas Maestras + los 14 forms + sheets + dashboard vacio.
 * Es idempotente: correr dos veces no duplica.
 * Se ejecuta AUTO desde onFormSubmitHandler si confirm_generate='Si',
 * o manualmente desde el IDE si la directora eligió 'No'.
 */
function setupAll() {
  return SetupOrchestrator.run(PHASES.ALL);
}

/**
 * Solo lo minimo para reemplazar el Word compartido: Form 7 (Novedades) + Form 2 (Registro de clase).
 */
function runArranque() {
  return SetupOrchestrator.run(PHASES.ARRANQUE);
}

function runPedagogica() {
  return SetupOrchestrator.run(PHASES.PEDAGOGICA);
}

function runInstitucional() {
  return SetupOrchestrator.run(PHASES.INSTITUCIONAL);
}

function runComunicacion() {
  return SetupOrchestrator.run(PHASES.COMUNICACION);
}

function runCooperadora() {
  return SetupOrchestrator.run(PHASES.COOPERADORA);
}

function runAdmin() {
  return SetupOrchestrator.run(PHASES.ADMIN);
}

/**
 * Re-aplica los items de los 14 forms usando el snapshot actual de SHEET-Listas-Maestras.
 * Usar cuando Coordinadora edita alumnos/docentes/espacios y hay que refrescar los dropdowns.
 */
function refreshListasMaestras() {
  // La implementacion mas simple: correr setupAll de nuevo.
  // Como es idempotente y resetea items, los dropdowns se regeneran con el snapshot actual.
  return SetupOrchestrator.run(PHASES.ALL);
}

/**
 * Imprime en consola el estado del PropertiesRegistry. Util para debugging.
 */
function debugRegistry() {
  const all = PropertiesRegistry.all();
  console.log('Registry entries: ' + Object.keys(all).length);
  Object.keys(all).sort().forEach(function(key) {
    console.log('  ' + key + ' -> ' + JSON.stringify(all[key]));
  });
  return all;
}

/**
 * Borra el Properties Registry (NO borra los artifacts en Drive).
 * Usar solo si el registry se desincroniza y querés forzar que el proximo setupAll
 * reconcilie todo por busqueda de nombre.
 */
function resetRegistry() {
  PropertiesRegistry.wipe();
  console.log('Registry vaciado. El proximo setupAll reconciliara por busqueda de nombre.');
}

/**
 * Imprime las URLs publicas de los 14 forms registrados. Util para compartir con docentes.
 */
function printFormUrls() {
  const registry = PropertiesRegistry.all();
  const forms = [];
  Object.keys(registry).forEach(function(key) {
    if (key.indexOf('form:') === 0) {
      try {
        const form = FormApp.openById(registry[key].id);
        forms.push({ id: key.replace('form:', ''), title: form.getTitle(), url: form.getPublishedUrl() });
      } catch (err) {
        forms.push({ id: key.replace('form:', ''), title: '(no se pudo abrir)', url: String(err) });
      }
    }
  });
  forms.sort(function(a, b) { return a.id.localeCompare(b.id); });
  console.log('URLs publicas (' + forms.length + ' forms):');
  forms.forEach(function(f) {
    console.log('  [' + f.id + '] ' + f.title);
    console.log('    ' + f.url);
  });
  return forms;
}

// ============================================================================
// Trigger handlers (NO llamar manualmente — los dispara el sistema)
// ============================================================================

/**
 * onFormSubmitHandler — handler del trigger installable instalado por
 * FormOnboardingBuilder. Se dispara cuando la directora envía el Form de
 * onboarding.
 *
 * Lógica:
 *   1. Resetea el cache de CFG (fuerza re-lectura fresca del Sheet).
 *   2. Lee config via readConfigFromSheet (valida que las 3 keys obligatorias estén).
 *   3. Si confirm_generate='Si', ejecuta setupAll() automáticamente.
 *   4. Si 'No', solo loguea — la directora correrá setupAll manualmente.
 *
 * Error handling:
 *   NO re-throwea errores. Los triggers installable que throw quedan en
 *   "failed" y Google puede re-intentarlos; como el Form ya escribió la
 *   respuesta, re-intentar sería operación doble. Mejor loguear y que
 *   Fito/directora investiguen via pestaña Log-<ts>.
 */
function onFormSubmitHandler(e) {
  try {
    SetupLog.reset();
    SetupLog.info('===== onFormSubmit triggered =====', {
      timestamp: new Date().toISOString(),
      triggerUid: (e && e.triggerUid) || '(unknown)'
    });

    _resetCFGCache();
    const config = readConfigFromSheet();

    SetupLog.info('Config leída post-submit', {
      school_name: config.school_name,
      academic_year: config.academic_year,
      location: config.location,
      confirm_generate: config.confirm_generate
    });

    const confirmVal = String(config.confirm_generate || '').toLowerCase();
    if (confirmVal.indexOf('si') === 0) {
      SetupLog.info('confirm_generate=Si → ejecutando setupAll...');
      setupAll();
      SetupLog.info('===== onFormSubmit + setupAll OK =====');
    } else {
      SetupLog.info('confirm_generate=No → setupAll omitido. Corré setupAll manualmente cuando estés lista.');
    }
  } catch (err) {
    const msg = (err && err.message) || String(err);
    const stack = (err && err.stack) || '(no stack)';
    if (typeof SetupLog !== 'undefined' && SetupLog && SetupLog.error) {
      SetupLog.error('onFormSubmit error', { message: msg, stack: stack });
    }
    console.error('onFormSubmit error: ' + msg);
    console.error(stack);
    // NO re-throw — ver docstring.
  } finally {
    // Flush del log al Sheet para que quede visible a la directora.
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss && typeof SetupLog !== 'undefined' && SetupLog.flushTo) {
        SetupLog.flushTo(ss);
      }
    } catch (flushErr) {
      console.error('No se pudo flush del SetupLog: ' + flushErr);
    }
  }
}
