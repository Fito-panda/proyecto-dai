/**
 * TemplateResolver.gs — resuelve el Spreadsheet template (DAI-Template-v1-2026)
 * desde cualquier contexto de ejecución (template-bound, trigger Sheet-bound,
 * IDE, web app), con 2 estrategias en orden:
 *
 *   1. SpreadsheetApp.getActiveSpreadsheet() — funciona desde IDE corriendo
 *      bootstrapTemplate/setupAll/runSmokeTests, desde onOpen, desde el F00
 *      onFormSubmitHandler. El active ES el template.
 *
 *   2. PropertiesRegistry['template:container'] cache — funciona desde
 *      triggers Sheet-bound apuntando a Spreadsheets separados de respuestas
 *      (caso del onFormSubmitDispatcher paso 9 + handlers operativos pasos
 *      10-13). El active es el Sheet del trigger, no el template.
 *
 * Caso seminal de la 2da estrategia: 2026-04-28 paso 9 plan v3 baja/suplentes.
 * Cazada arquitectonica detectada durante validacion funcional viva — el plan
 * v3 §9 asumio 1 Sheet container, la realidad son 15 Spreadsheets separados
 * (1 por form en 06-Sheets-Maestros). En triggers Sheet-bound,
 * getActiveSpreadsheet() retorna el Sheet del trigger, NO el template.
 * OperacionesLog y los handlers operativos necesitan el template para escribir
 * a 👥 Docentes y 📋 Estado del sistema.
 *
 * Extraido a helper compartido (paso 10.1 plan v3, 2026-04-28) porque los
 * handlers pasos 10-13 (handleSumarDocente, handleMarcarLicencia,
 * handleVolvioLicencia, handleDarDeBaja) tambien necesitan resolver el
 * template. DRY desde el inicio. Reemplaza OperacionesLog._resolveTemplate()
 * y OperacionesLog.cacheTemplateContainer() pre-refactor.
 *
 * API:
 *   TemplateResolver.resolve(probeTabName) — Spreadsheet o null.
 *     probeTabName: nombre de una pestaña que SOLO existe en el template
 *     (no en los Sheets de respuestas). Sirve para validar que active/cached
 *     SI es el template. Default: '👥 Docentes' (pestaña core del schema).
 *     Sugeridos por caso: '👥 Docentes' para handlers, '📋 Estado del sistema'
 *     para OperacionesLog.
 *
 *   TemplateResolver.cache(ss) — cachea ss.getId() en
 *     PropertiesRegistry['template:container']. Idempotente. Llamar UNA vez
 *     desde un contexto donde getActiveSpreadsheet() retorna el template
 *     (ej. installSubmitDispatcher en Main.gs).
 */

const TemplateResolver = {

  REGISTRY_KEY: 'template:container',

  /**
   * resolve(probeTabName) — devuelve el Spreadsheet template o null.
   *
   * Estrategias en orden:
   *   1. getActiveSpreadsheet() — si el active tiene la pestaña probe, es el
   *      template.
   *   2. PropertiesRegistry cache — si el cache tiene id, abrir y validar
   *      pestaña probe.
   *
   * Returns: Spreadsheet con la pestaña probe, o null si ninguna estrategia
   * resuelve.
   */
  resolve(probeTabName) {
    const probe = probeTabName || '👥 Docentes';

    // 1er intento: active (caso template-bound execution)
    try {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active && active.getSheetByName(probe)) {
        return active;
      }
    } catch (err) { /* fallthrough */ }

    // 2do intento: cache del registry (caso trigger Sheet-bound)
    try {
      const cached = PropertiesRegistry.get(this.REGISTRY_KEY);
      if (cached && cached.id) {
        const ss = SpreadsheetApp.openById(cached.id);
        if (ss && ss.getSheetByName(probe)) {
          return ss;
        }
      }
    } catch (err) { /* fallthrough */ }

    return null;
  },

  /**
   * cache(ss) — cachea ss.getId() en PropertiesRegistry. Idempotente.
   *
   * Llamar UNA vez desde un contexto donde getActiveSpreadsheet() retorna el
   * template (ej. installSubmitDispatcher en Main.gs). Despues los triggers
   * Sheet-bound futuros pueden invocar TemplateResolver.resolve() y caer en
   * la 2da estrategia con cache populado.
   *
   * Returns: true si cacheo OK, false si fallo.
   */
  cache(ss) {
    if (!ss) return false;
    try {
      PropertiesRegistry.set(this.REGISTRY_KEY, {
        id: ss.getId(),
        name: ss.getName(),
        type: 'spreadsheet'
      });
      return true;
    } catch (err) {
      return false;
    }
  }

};
