/**
 * FormalFormsTriggerManager.gs — instala triggers onFormSubmit para los 9
 * Forms formales + dispatcher que genera el Google Doc correspondiente.
 * Fase 2.5 del plan v9 implementada 2026-04-21 por FORJA2 (modo autónomo).
 *
 * Responsabilidad:
 *   - `install()`: registra triggers installable onFormSubmit por cada uno de
 *     los 9 Forms formales (F05-F14 excluyendo F01-F04 y F07, que son los
 *     pedagógicos y de novedades sin generación de Doc). Cada trigger apunta
 *     al handler global `onFormalFormSubmit` en Main.gs.
 *     Guarda un reverse lookup `{ formInstanceId → formId }` en
 *     PropertiesRegistry para que el handler pueda identificar cuál form disparó.
 *   - `handleSubmit(e)`: dispatcher. Recibe el event del trigger, identifica
 *     qué form formal disparó (via e.source.getId() + reverse lookup),
 *     resuelve la carpeta destino de DOC_TEMPLATES[formId].outputFolderPath,
 *     extrae responseData via _extractResponseData(e) (maneja Form-based y
 *     Spreadsheet-based event shapes), y llama DocGenerator.generate(...).
 *
 * Pre-condiciones para install():
 *   - setupAll() ya corrió (los 9 Forms F05-F14 están creados + registrados
 *     en PropertiesRegistry con keys `form:Fxx`).
 *   - buildAllDocTemplates() ya corrió (los 9 templates Google Docs están
 *     creados + registrados con keys `docTemplate:Fxx`).
 *
 * Orden operativo al instalar el sistema:
 *   1. bootstrapTemplate() (Fase 2) → crea Template + Form onboarding.
 *   2. Directora envía Form onboarding → trigger dispara setupAll() → crea los
 *      14 Forms del ciclo + carpetas.
 *   3. Fito corre buildAllDocTemplates() → crea 9 templates Google Docs.
 *   4. Fito corre installFormalFormTriggers() (wrapper en Main.gs) → instala
 *      9 triggers apuntando a onFormalFormSubmit.
 *   5. A partir de ahí, cualquier submit de F05/F06/F08-F14 genera Doc automático.
 *
 * Límites Apps Script:
 *   - Máximo 20 triggers installable por script. Con onboarding + 9 formales = 10
 *     triggers totales. Queda margen para Fase 3+ (ej. time-based para reportes).
 */

const FormalFormsTriggerManager = {

  HANDLER_NAME: 'onFormalFormSubmit',
  REVERSE_LOOKUP_KEY: 'formalFormsReverseLookup',

  /**
   * install() — entry point. Registra 9 triggers installable.
   * Retorna: { installed, reused, skipped, failed, reverseLookup }.
   */
  install() {
    SetupLog.info('===== FormalFormsTriggerManager.install iniciando =====', {
      timestamp: new Date().toISOString()
    });

    const results = {
      installed: [],
      reused: [],
      skipped: [],
      failed: []
    };
    const self = this;
    const reverseLookup = {};

    DOC_TEMPLATE_FORM_IDS.forEach(function(formId) {
      try {
        const r = self._ensureTrigger(formId);
        reverseLookup[r.formInstanceId] = formId;
        if (r.created) {
          results.installed.push({ formId: formId, triggerUid: r.triggerUid });
        } else {
          results.reused.push({ formId: formId, triggerUid: r.triggerUid });
        }
      } catch (err) {
        SetupLog.error('FormalFormsTriggerManager: fallo instalando trigger', {
          formId: formId,
          err: String(err && err.message || err)
        });
        results.failed.push({ formId: formId, error: String(err && err.message || err) });
      }
    });

    PropertiesRegistry.set(this.REVERSE_LOOKUP_KEY, reverseLookup);

    SetupLog.info('FormalFormsTriggerManager.install OK', {
      installed: results.installed.length,
      reused: results.reused.length,
      failed: results.failed.length,
      totalTriggersInScript: ScriptApp.getProjectTriggers().length
    });

    return Object.assign({}, results, {
      reverseLookup: reverseLookup,
      message: 'Triggers: ' + results.installed.length + ' instalados, ' +
        results.reused.length + ' reusados, ' + results.failed.length + ' fallos.'
    });
  },

  /**
   * handleSubmit(e) — dispatcher llamado desde onFormalFormSubmit (Main.gs)
   * cuando uno de los 9 Forms formales recibe una respuesta.
   *
   * Flujo:
   *   1. Identifica formId via e.source.getId() + reverseLookup.
   *   2. Resuelve outputFolder desde DOC_TEMPLATES[formId].outputFolderPath +
   *      registry de folders.
   *   3. Extrae responseData via _extractResponseData(e) — maneja tanto
   *      Form-based trigger events (e.response.getItemResponses) como
   *      Spreadsheet-based (e.namedValues).
   *   4. Llama DocGenerator.generate(formId, responseData, outputFolder).
   *   5. Loguea + flush.
   *
   * Error handling: NO re-throw. Un fallo acá no debe causar retry del trigger
   * (que crearía Docs duplicados).
   */
  handleSubmit(e) {
    SetupLog.reset();
    SetupLog.info('===== onFormalFormSubmit triggered =====', {
      timestamp: new Date().toISOString(),
      triggerUid: (e && e.triggerUid) || '(unknown)'
    });

    try {
      if (!e || !e.source) {
        throw new Error('FormalFormsTriggerManager.handleSubmit: e.source es null. Event inválido.');
      }

      const formInstanceId = e.source.getId();
      const formId = this._findFormIdForInstance(formInstanceId);

      if (!formId) {
        SetupLog.warn('FormalFormsTriggerManager: no se identificó formId para este form instance. Trigger disparó por un form no registrado como formal?', {
          formInstanceId: formInstanceId
        });
        return;
      }

      SetupLog.info('Form formal identificado', {
        formId: formId,
        formInstanceId: formInstanceId
      });

      const tmplMeta = DOC_TEMPLATES[formId];
      if (!tmplMeta) {
        throw new Error('FormalFormsTriggerManager: DOC_TEMPLATES no tiene entry para formId "' + formId + '" (race condition?).');
      }

      // Fresh read de CFG para resolver folder destino vía yearFolderName.
      _resetCFGCache();

      const folderRegistryKey = 'folder:' + yearFolderName() + '/' + tmplMeta.outputFolderPath;
      const folderEntry = PropertiesRegistry.get(folderRegistryKey);
      if (!folderEntry || !folderEntry.id) {
        throw new Error(
          'FormalFormsTriggerManager: folder destino "' + folderRegistryKey +
          '" no está en registry. Correr setupAll() primero.'
        );
      }

      let outputFolder;
      try {
        outputFolder = DriveApp.getFolderById(folderEntry.id);
      } catch (err) {
        throw new Error(
          'FormalFormsTriggerManager: folder "' + folderRegistryKey +
          '" tiene id "' + folderEntry.id + '" pero DriveApp no lo puede abrir. ' +
          'Posible borrado manual. Error: ' + err.message
        );
      }

      const responseData = this._extractResponseData(e);
      const result = DocGenerator.generate(formId, responseData, outputFolder);

      SetupLog.info('onFormalFormSubmit: Doc generado OK', {
        formId: formId,
        docId: result.docId,
        docUrl: result.docUrl,
        docName: result.docName,
        placeholdersReplaced: result.placeholdersReplaced.length,
        placeholdersMissing: result.placeholdersMissing.length
      });

    } catch (err) {
      const msg = (err && err.message) || String(err);
      SetupLog.error('onFormalFormSubmit error', {
        message: msg,
        stack: err && err.stack
      });
      console.error('onFormalFormSubmit error: ' + msg);
      // NO re-throw — evitar retry del trigger (crearía Docs duplicados).
    } finally {
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss && typeof SetupLog !== 'undefined' && SetupLog.flushTo) {
          SetupLog.flushTo(ss);
        }
      } catch (flushErr) {
        console.error('onFormalFormSubmit: no se pudo flush SetupLog: ' + flushErr);
      }
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
        'Correr setupAll() primero para crear los 14 Forms del ciclo.'
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
