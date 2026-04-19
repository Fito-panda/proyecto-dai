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
 * Corre todo. Crea/actualiza Drive tree + Listas Maestras + los 14 forms + sheets + dashboard vacio.
 * Es idempotente: correr dos veces no duplica.
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
