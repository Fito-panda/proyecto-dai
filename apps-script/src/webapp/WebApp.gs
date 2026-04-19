/**
 * WebApp.gs — panel HTML publico que sirve los 14 forms al grupo docente.
 *
 * SCAFFOLD de Fase 0. Implementacion completa en Fase 3.
 *
 * Responsabilidades previstas:
 *   - doGet(): renderiza Panel.html inyectando las URLs publicas de los forms
 *     desde PropertiesRegistry (solo los forms activos en el Sheet de config).
 *   - deployWebApp(): publica este script como Web App y devuelve la URL publica
 *     que el orchestrator escribe en la pestana "Estado del sistema".
 *
 * Notas de seguridad:
 *   - Deploy como "Ejecutar como: yo (owner del Sheet)".
 *   - Acceso: "Cualquiera con el enlace" (asi los docentes no tienen que loguear).
 *   - Los forms que el panel linkea SI exigen login (FormApp por defecto).
 */

function doGet(e) {
  // TODO (Fase 3):
  // 1. Leer PropertiesRegistry para obtener formId de cada form activo
  // 2. Resolver URL publica de cada uno via FormApp.openById(id).getPublishedUrl()
  // 3. Leer pestana "Formularios" del Sheet de config para saber cuales mostrar
  // 4. Renderizar Panel.html inyectando las URLs + metadata (titulo, fase, descripcion)
  const template = HtmlService.createTemplateFromFile('Panel');
  template.forms = [];
  template.schoolName = 'TBD — lee del Sheet de config';
  return template.evaluate()
    .setTitle('DAI — Panel de Formularios')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function deployWebApp() {
  // TODO (Fase 3): wrapper sobre ScriptApp deployment API
  // Devuelve la URL publica del panel para que el orchestrator la guarde en el Sheet
  throw new Error('Fase 3 pendiente — deployWebApp no implementado todavia');
}
