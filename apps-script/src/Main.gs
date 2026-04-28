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
 * buildAllDocTemplates — ejecutar UNA VEZ tras primer setupAll para crear los
 * 9 templates Google Docs que los Forms formales (F05-F14 excl F07) usan
 * para generar documentos imprimibles.
 * Crea la carpeta `DAI-Templates-Docs-v1/` en Drive root + 9 Docs dentro.
 * Idempotente: reusa templates existentes del registry.
 * Fase 2.5 del plan v9.
 */
function buildAllDocTemplates() {
  return DocTemplateBuilder.buildAll();
}

/**
 * @deprecated 2026-04-28 plan v3 paso 8.5. Reemplazada por OnSubmitDispatcher
 * (paso 9). NO usar — instalaria triggers duplicados que coexistirian con el
 * dispatcher consolidado y generarian docs duplicados por cada submission de
 * F05/F06/F08-F14 (Loop 3 hallazgo 5-A). Para limpiar triggers viejos: usar
 * uninstallFormalFormTriggers().
 *
 * installFormalFormTriggers — ejecutar UNA VEZ tras buildAllDocTemplates para
 * instalar los 9 triggers onFormSubmit que disparan generación automática de
 * Google Doc al recibir respuestas de los Forms formales.
 * Idempotente: reusa triggers existentes.
 * Fase 2.5 del plan v9.
 */
function installFormalFormTriggers() {
  return FormalFormsTriggerManager.install();
}

/**
 * uninstallFormalFormTriggers — paso 8.5/20 plan v3 baja/suplentes-docente
 * (2026-04-28). Desinstala los 9 triggers onFormalFormSubmit antes de instalar
 * el dispatcher consolidado del paso 9. NO toca otros triggers (el del F00
 * onboarding y futuros del dispatcher quedan intactos). Idempotente.
 */
function uninstallFormalFormTriggers() {
  return FormalFormsTriggerManager.uninstall();
}

/**
 * installSubmitDispatcher — paso 9/20 plan v3 baja/suplentes-docente
 * (2026-04-28, v2 post-validacion). Instala N triggers Sheet-bound (uno por
 * cada Sheet de respuestas en DISPATCH_TABLE) con handler único
 * onFormSubmitDispatcher. Reemplaza los 9 triggers viejos onFormalFormSubmit
 * desinstalados en paso 8.5.
 *
 * Arquitectura post-fix v2: cada form tiene su propio Spreadsheet de
 * respuestas (FormBuilder crea 1 Sheet separado por form en
 * 06-Sheets-Maestros). Por eso necesitamos UN trigger Sheet-bound POR CADA
 * Sheet de respuestas — el plan v3 §9 originalmente asumió que todos los
 * forms compartían 1 Sheet container, pero la realidad es 15 Sheets separados.
 *
 * Cleanup automático: borra cualquier trigger viejo con handler
 * onFormSubmitDispatcher antes de instalar los nuevos. Idempotente.
 *
 * Pre-condiciones:
 *   - setupAll() ya corrio (PropertiesRegistry tiene keys 'sheet:SHEET-*-2026').
 *   - OnSubmitDispatcher.gs cargado con DISPATCH_TABLE poblada.
 *   - Paso 8.5 completado (sin triggers onFormalFormSubmit).
 *
 * Retorna: { cleaned, installed, failed, targets, message }.
 */
function installSubmitDispatcher() {
  const handlerName = 'onFormSubmitDispatcher';

  // 0. Cachear template container ID en PropertiesRegistry para que
  // TemplateResolver.resolve() lo encuentre desde triggers Sheet-bound
  // (donde getActiveSpreadsheet() retorna el Sheet del trigger, no el template).
  // Bug arquitectónico cazado durante validación funcional paso 9.
  // Refactor paso 10.1: delega a TemplateResolver (utils/TemplateResolver.gs).
  try {
    const activeForCache = SpreadsheetApp.getActiveSpreadsheet();
    if (activeForCache && typeof TemplateResolver !== 'undefined' && TemplateResolver.cache) {
      const cached = TemplateResolver.cache(activeForCache);
      console.log('installSubmitDispatcher: template container cacheado = ' + cached);
    }
  } catch (cacheErr) {
    console.warn('installSubmitDispatcher: TemplateResolver.cache fallo: ' + cacheErr);
  }

  // 1. Cleanup: borrar triggers viejos con handler onFormSubmitDispatcher.
  // Incluye el zombie del v1 (apuntaba al template, nunca recibio eventos).
  const existing = ScriptApp.getProjectTriggers();
  let cleaned = 0;
  for (let i = 0; i < existing.length; i++) {
    const t = existing[i];
    if (t.getHandlerFunction() === handlerName) {
      try {
        ScriptApp.deleteTrigger(t);
        cleaned++;
      } catch (err) {
        console.warn('installSubmitDispatcher cleanup fallo UID ' +
          t.getUniqueId() + ': ' + err);
      }
    }
  }
  console.log('installSubmitDispatcher: ' + cleaned + ' triggers viejos limpiados.');

  // 2. Identificar Sheets de respuestas que tienen entry en DISPATCH_TABLE.
  // Solo instalar triggers para esos (excluir SHEET-Listas-Maestras y otros
  // Sheets que no son destinos de forms del ciclo).
  if (typeof DISPATCH_TABLE === 'undefined') {
    throw new Error('installSubmitDispatcher: DISPATCH_TABLE no definido. Verificar OnSubmitDispatcher.gs.');
  }

  const sheetNamesEnDispatch = Object.keys(DISPATCH_TABLE);
  const allEntries = PropertiesRegistry.all();
  const targets = [];

  sheetNamesEnDispatch.forEach(function(sheetName) {
    const key = 'sheet:' + sheetName;
    const entry = allEntries[key];
    if (entry && entry.id) {
      targets.push({ sheetName: sheetName, sheetId: entry.id });
    } else {
      console.warn('installSubmitDispatcher: ' + key + ' no encontrada en registry. Skip.');
    }
  });

  console.log('installSubmitDispatcher: ' + targets.length + '/' +
    sheetNamesEnDispatch.length + ' sheets target identificados.');

  // 3. Instalar trigger por cada Sheet target.
  const installed = [];
  const failed = [];
  targets.forEach(function(target) {
    try {
      const ss = SpreadsheetApp.openById(target.sheetId);
      const trigger = ScriptApp.newTrigger(handlerName)
        .forSpreadsheet(ss)
        .onFormSubmit()
        .create();
      installed.push({
        sheetName: target.sheetName,
        triggerUid: trigger.getUniqueId()
      });
      console.log('installSubmitDispatcher: trigger instalado para ' +
        target.sheetName + ' UID ' + trigger.getUniqueId());
    } catch (err) {
      failed.push({ sheetName: target.sheetName, error: String(err) });
      console.error('installSubmitDispatcher: fallo trigger para ' +
        target.sheetName + ': ' + err);
    }
  });

  const result = {
    cleaned: cleaned,
    installed: installed.length,
    failed: failed.length,
    targets: targets.length,
    message: 'Cleanup: ' + cleaned + ' viejos. Instalados: ' + installed.length +
      '/' + targets.length + '. Fallos: ' + failed.length + '.'
  };

  console.log('installSubmitDispatcher OK: ' + result.message);
  return result;
}

/**
 * Corre todo. Crea/actualiza Drive tree + Listas Maestras + los 11 forms + sheets + dashboard vacio.
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
 * Re-aplica los items de los 11 forms usando el snapshot actual de SHEET-Listas-Maestras.
 * Usar cuando Coordinadora edita alumnos/docentes/espacios y hay que refrescar los dropdowns.
 */
function refreshListasMaestras() {
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
 * regenerateTuPanelTab — actualiza la pestaña "🚀 Tu Panel" del Sheet con los
 * 2 URLs del panel web. Correr después de hacer el primer "Nueva implementación"
 * desde el IDE, o cada vez que querés refrescar los URLs en la pestaña.
 * Fase 3b.1 del plan v9.
 */
function regenerateTuPanelTab() {
  return TuPanelTabBuilder.ensure(SpreadsheetApp.getActiveSpreadsheet());
}

/**
 * Imprime las URLs publicas de los 11 forms registrados. Util para compartir con docentes.
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
 * FormOnboardingBuilder (Fase 2). Se dispara cuando la directora envía el
 * Form de onboarding.
 *
 * Si confirm_generate='Si', ejecuta setupAll() automáticamente.
 * Si 'No', solo loguea — la directora correrá setupAll manualmente.
 *
 * NO re-throw on error: los triggers installable que throw quedan en
 * "failed" y Google puede re-intentarlos; como el Form ya escribió la
 * respuesta, re-intentar sería operación doble. Mejor loguear.
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
  } finally {
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

/**
 * onFormalFormSubmit — handler del trigger installable instalado por
 * FormalFormsTriggerManager (Fase 2.5). Se dispara cuando la directora o
 * cooperadora envía uno de los 9 Forms formales (F05, F06, F08-F14).
 *
 * Genera un Google Doc copia del template correspondiente, con los
 * placeholders del Form reemplazados por las respuestas.
 *
 * Delega toda la lógica a FormalFormsTriggerManager.handleSubmit(e).
 * NO re-throw on error (misma razón que onFormSubmitHandler).
 */
function onFormalFormSubmit(e) {
  return FormalFormsTriggerManager.handleSubmit(e);
}
