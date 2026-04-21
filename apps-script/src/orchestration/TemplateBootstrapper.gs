/**
 * TemplateBootstrapper.gs — orquestador del bootstrap del Template DAI.
 * Fase 2 del plan v9 implementada 2026-04-20 por FORJA2.
 *
 * Responsabilidad:
 *   bootstrapTemplate() es el entry point que el operador DAI (Fito) ejecuta
 *   UNA VEZ al crear un Template nuevo. No lo corre la directora.
 *
 * Qué hace, en orden:
 *   1. Verifica que el Script esté container-bound a un Sheet.
 *   2. ConfigSheetBuilder.build(sheet) → crea las 8 pestañas idempotentes.
 *   3. FormOnboardingBuilder.createAndLink(sheet) → crea Form + setDestination
 *      + rename pestaña de respuestas a '_respuestas_config' + install trigger
 *      onFormSubmit apuntando a onFormSubmitHandler.
 *   4. FormOnboardingBuilder.writeFormLinkToArranqueTab(sheet, url) → escribe
 *      la URL del Form en la pestaña '👋 Arranque' donde la directora la ve.
 *   5. SetupLog.flushTo(sheet) → persiste el log en pestaña Log-<timestamp>.
 *
 * Idempotencia:
 *   - Correr dos veces no duplica nada.
 *   - ConfigSheetBuilder reusa pestañas existentes con schema coincidente.
 *   - FormOnboardingBuilder reusa Form + trigger del registry si ya existen.
 *
 * Relación con setupAll:
 *   - bootstrapTemplate() NO ejecuta setupAll(). Solo arma el Template.
 *   - setupAll() se ejecuta desde el trigger onFormSubmitHandler cuando la
 *     directora envía el Form de onboarding con confirm_generate='Si'.
 *   - setupAll() también se puede ejecutar manualmente desde el IDE (útil si
 *     confirm_generate='No' o para re-sincronizar).
 */

const TemplateBootstrapper = {

  /**
   * run() — ejecuta el bootstrap completo.
   *
   * Retorna: objeto con resumen de lo creado/reusado + mensaje human-readable.
   * Throws: Error si no hay container o si algún sub-step falla.
   */
  run() {
    SetupLog.reset();
    SetupLog.info('===== bootstrapTemplate iniciando =====', {
      timestamp: new Date().toISOString()
    });

    // 1. Container-bound check.
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!sheet) {
      throw new Error(
        'bootstrapTemplate requiere que el Script esté container-bound a un Sheet. ' +
        'No hay SpreadsheetApp activo. Abrí el Sheet template y corré bootstrapTemplate ' +
        'desde el IDE (Extensiones → Apps Script).'
      );
    }
    SetupLog.info('Container Sheet detectado', {
      name: sheet.getName(),
      id: sheet.getId()
    });

    // 2. Crear las 8 pestañas (idempotent).
    const tabsResult = ConfigSheetBuilder.build(sheet);
    SetupLog.info('ConfigSheetBuilder resultado', tabsResult);

    // 3. Crear Form + linkear + rename tab + install trigger (idempotent).
    const formResult = FormOnboardingBuilder.createAndLink(sheet);
    SetupLog.info('FormOnboardingBuilder resultado', {
      formId: formResult.formId,
      formUrl: formResult.formUrl,
      configTabName: formResult.configTabName,
      triggerUid: formResult.triggerUid,
      reused: formResult.reused
    });

    // 4. Escribir link del Form en pestaña '👋 Arranque'.
    FormOnboardingBuilder.writeFormLinkToArranqueTab(sheet, formResult.formUrl);

    // 5. Flush log a pestaña Log-<ts>.
    SetupLog.info('===== bootstrapTemplate OK =====');
    SetupLog.flushTo(sheet);

    return {
      sheetName: sheet.getName(),
      sheetId: sheet.getId(),
      tabs: tabsResult,
      form: {
        id: formResult.formId,
        url: formResult.formUrl,
        configTabName: formResult.configTabName,
        triggerUid: formResult.triggerUid,
        reused: formResult.reused
      },
      message: 'Template armado OK. La directora puede abrir el Sheet y seguir las instrucciones de "👋 Arranque".'
    };
  }

};
