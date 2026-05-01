/**
 * FormalFormsTriggerManager.gs — dispatcher que genera el Google Doc
 * correspondiente para los 9 Forms formales (F05-F14).
 *
 * Fase 2.5 del plan v9 implementada 2026-04-21 por FORJA2.
 * Sesión 5 chunk E (2026-05-01): eliminados métodos install() + uninstall()
 * — funciones zombi post paso 8.5 plan v3 (los Form-bound triggers fueron
 * reemplazados por Sheet-bound dispatcher en OnSubmitDispatcher.gs paso 9).
 *
 * Responsabilidad post-chunk-E:
 *   - `processFormalSubmit(e, formId)`: procesa la submission, resuelve la
 *     carpeta destino de DOC_TEMPLATES[formId].outputFolderPath, extrae
 *     responseData via _extractResponseData(e) (maneja Form-based y
 *     Spreadsheet-based event shapes), y llama DocGenerator.generate(...).
 *     Invocado desde OnSubmitDispatcher.gs por cada Sheet-bound trigger
 *     correspondiente a un Form formal (paso 9 plan v3).
 *   - `handleSubmit(e)`: wrapper @deprecated retro-compatible para Form-bound
 *     triggers viejos. NO se usa post paso 8.5 (no hay triggers Form-bound).
 *   - `_extractResponseData(e)`: utilidad pública usada por SmokeTests.
 *   - Constantes HANDLER_NAME, REVERSE_LOOKUP_KEY usadas por SmokeTests.
 */

const FormalFormsTriggerManager = {

  HANDLER_NAME: 'onFormalFormSubmit',
  REVERSE_LOOKUP_KEY: 'formalFormsReverseLookup',

  /**
   * handleSubmit(e) — wrapper publico para Form-bound triggers (LEGACY).
   *
   * Llamado desde onFormalFormSubmit (Main.gs) cuando un Form-bound trigger
   * de Fase 2.5 se dispara. Resuelve formId via reverseLookup
   * (e.source.getId() = Form ID en Form-bound trigger) y delega a
   * processFormalSubmit(e, formId).
   *
   * @deprecated post paso 8.5 plan v3. Los Form-bound triggers fueron
   * desinstalados manualmente desde IDE (los métodos install/uninstall que
   * los manejaban se eliminaron en chunk E sesión 5 2026-05-01). El paso 9
   * (OnSubmitDispatcher) llama processFormalSubmit(e, formId) directo desde
   * el trigger Sheet-bound, sin pasar por este wrapper. Este método queda
   * como retro-compatibilidad — si en el futuro se vuelve a usar, hay que
   * crear el trigger Form-bound desde IDE manualmente o reescribir install().
   */
  handleSubmit(e) {
    if (!e || !e.source) {
      SetupLog.reset();
      SetupLog.error('handleSubmit: e.source es null. Event inválido.', {
        triggerUid: (e && e.triggerUid) || '(unknown)'
      });
      this._flushSafe();
      return;
    }
    const formInstanceId = e.source.getId();
    const formId = this._findFormIdForInstance(formInstanceId);
    if (!formId) {
      SetupLog.reset();
      SetupLog.warn('handleSubmit: no se identificó formId para este form instance.', {
        formInstanceId: formInstanceId
      });
      this._flushSafe();
      return;
    }
    return this.processFormalSubmit(e, formId);
  },

  /**
   * processFormalSubmit(e, formId) — logica core del procesamiento de un form formal.
   * Paso 9/20 plan v3 baja/suplentes-docente (2026-04-28, refactor extract de handleSubmit).
   *
   * Recibe formId directo (resuelto por el caller via reverseLookup en
   * handleSubmit, o por DISPATCH_TABLE en OnSubmitDispatcher.gs). NO necesita
   * `e.source` ni reverseLookup — funciona con Form-bound y Sheet-bound triggers.
   *
   * Flujo:
   *   1. Validar tmplMeta para formId existe en DOC_TEMPLATES.
   *   2. Resolver outputFolder desde tmplMeta.outputFolderPath + registry.
   *   3. Extraer responseData via _extractResponseData(e) (maneja ambos shapes
   *      Form-based + Spreadsheet-based del event).
   *   4. Llamar DocGenerator.generate(formId, responseData, outputFolder).
   *   5. Log + flush via _flushSafe.
   *
   * Error handling: NO re-throw. Un fallo aquí no debe causar retry del
   * trigger (crearia Docs duplicados).
   */
  processFormalSubmit(e, formId) {
    SetupLog.reset();
    SetupLog.info('===== processFormalSubmit triggered =====', {
      timestamp: new Date().toISOString(),
      formId: formId,
      triggerUid: (e && e.triggerUid) || '(unknown)'
    });

    try {
      const tmplMeta = DOC_TEMPLATES[formId];
      if (!tmplMeta) {
        throw new Error('processFormalSubmit: DOC_TEMPLATES no tiene entry para formId "' + formId + '".');
      }

      _resetCFGCache();

      const folderRegistryKey = 'folder:' + yearFolderName() + '/' + tmplMeta.outputFolderPath;
      const folderEntry = PropertiesRegistry.get(folderRegistryKey);
      if (!folderEntry || !folderEntry.id) {
        throw new Error(
          'processFormalSubmit: folder destino "' + folderRegistryKey +
          '" no está en registry. Correr setupAll() primero.'
        );
      }

      let outputFolder;
      try {
        outputFolder = DriveApp.getFolderById(folderEntry.id);
      } catch (err) {
        throw new Error(
          'processFormalSubmit: folder "' + folderRegistryKey +
          '" tiene id "' + folderEntry.id + '" pero DriveApp no lo puede abrir. ' +
          'Posible borrado manual. Error: ' + err.message
        );
      }

      const responseData = this._extractResponseData(e);
      const result = DocGenerator.generate(formId, responseData, outputFolder);

      SetupLog.info('processFormalSubmit: Doc generado OK', {
        formId: formId,
        docId: result.docId,
        docUrl: result.docUrl,
        docName: result.docName,
        placeholdersReplaced: result.placeholdersReplaced.length,
        placeholdersMissing: result.placeholdersMissing.length
      });

    } catch (err) {
      const msg = (err && err.message) || String(err);
      SetupLog.error('processFormalSubmit error', {
        formId: formId,
        message: msg,
        stack: err && err.stack
      });
      console.error('processFormalSubmit error: ' + msg);
      // NO re-throw — evitar retry del trigger.
    } finally {
      this._flushSafe();
    }
  },

  /**
   * _flushSafe — best-effort flush del SetupLog al active spreadsheet.
   * Usado por handleSubmit + processFormalSubmit (DRY post refactor extract).
   */
  _flushSafe() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss && typeof SetupLog !== 'undefined' && SetupLog.flushTo) {
        SetupLog.flushTo(ss);
      }
    } catch (flushErr) {
      console.error('FormalFormsTriggerManager._flushSafe error: ' + flushErr);
    }
  },

  // ===========================================================================
  // Helpers internos
  // ===========================================================================

  /**
   * _extractResponseData(e) — normaliza el event del trigger a shape
   * { "Titulo del item": ["valor"] } compatible con DocGenerator.
   *
   * Maneja 2 shapes posibles según tipo de trigger:
   *   - Spreadsheet-based onFormSubmit: e.namedValues ya tiene esa forma.
   *   - Form-based onFormSubmit (el que usamos acá): e.namedValues es undefined;
   *     las respuestas viven en e.response.getItemResponses().
   *
   * R2 fix 2026-04-21: FORJA2 asumió shape de Spreadsheet trigger en modo
   * autónomo y la asunción falló en V4 — los 14 campos del form quedaron sin
   * bindear. Este helper hace el extract correcto para Form triggers y
   * mantiene retro-compatibilidad con namedValues si algún test la usa.
   */
  _extractResponseData(e) {
    if (e && e.namedValues && Object.keys(e.namedValues).length > 0) {
      return e.namedValues;
    }
    if (e && e.response && typeof e.response.getItemResponses === 'function') {
      const out = {};
      const itemResponses = e.response.getItemResponses();
      itemResponses.forEach(function(ir) {
        const item = ir.getItem();
        const title = item.getTitle();
        const response = ir.getResponse();
        out[title] = Array.isArray(response) ? response : [response];
      });
      return out;
    }
    return {};
  },

  _ensureTrigger(formId) {
    const formEntry = PropertiesRegistry.get('form:' + formId);
    if (!formEntry || !formEntry.id) {
      throw new Error(
        'Form ' + formId + ' no está en registry (key "form:' + formId + '"). ' +
        'Correr setupAll() primero para crear los 11 Forms del ciclo.'
      );
    }

    let form;
    try {
      form = FormApp.openById(formEntry.id);
    } catch (err) {
      throw new Error(
        'Form ' + formId + ' tiene id "' + formEntry.id +
        '" pero FormApp no lo puede abrir. Posible borrado. Error: ' + err.message
      );
    }

    const formInstanceId = form.getId();

    // Idempotencia: ver si ya existe trigger para este form + handler.
    const existingTriggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < existingTriggers.length; i++) {
      const t = existingTriggers[i];
      if (t.getHandlerFunction() === this.HANDLER_NAME &&
          t.getTriggerSourceId() === formInstanceId &&
          t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        SetupLog.info('FormalFormsTriggerManager: trigger reusado', {
          formId: formId,
          uid: t.getUniqueId()
        });
        return {
          formInstanceId: formInstanceId,
          triggerUid: t.getUniqueId(),
          created: false
        };
      }
    }

    // Crear nuevo.
    const trigger = ScriptApp.newTrigger(this.HANDLER_NAME)
      .forForm(form)
      .onFormSubmit()
      .create();

    SetupLog.info('FormalFormsTriggerManager: trigger instalado', {
      formId: formId,
      uid: trigger.getUniqueId(),
      handler: this.HANDLER_NAME
    });

    return {
      formInstanceId: formInstanceId,
      triggerUid: trigger.getUniqueId(),
      created: true
    };
  },

  /**
   * _findFormIdForInstance — busca formId a partir de form instance ID.
   * Estrategia: cache (REVERSE_LOOKUP_KEY) → fallback iterando registry.
   */
  _findFormIdForInstance(formInstanceId) {
    const reverseLookup = PropertiesRegistry.get(this.REVERSE_LOOKUP_KEY) || {};
    if (reverseLookup[formInstanceId]) {
      return reverseLookup[formInstanceId];
    }

    // Fallback: iterar y comparar id.
    for (let i = 0; i < DOC_TEMPLATE_FORM_IDS.length; i++) {
      const formId = DOC_TEMPLATE_FORM_IDS[i];
      const formEntry = PropertiesRegistry.get('form:' + formId);
      if (formEntry && formEntry.id === formInstanceId) {
        SetupLog.warn('FormalFormsTriggerManager: formId resuelto via fallback lookup (cache reverse desync)', {
          formId: formId,
          formInstanceId: formInstanceId
        });
        return formId;
      }
    }

    return null;
  }

};
