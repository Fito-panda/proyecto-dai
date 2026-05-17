/**
 * FormOnboardingBuilder.gs — crea el Form de onboarding + lo linkea al Sheet
 * container-bound + renombra la pestaña de respuestas + instala trigger.
 * Fase 2 del plan v9 implementada 2026-04-20 por FORJA2.
 * v2 2026-04-21: robustez + recovery de Form huérfano (post-crash) + retry loop
 * con flush+sleep para la detección de pestaña post setDestination.
 *
 * Responsabilidades:
 *   - Crear un Google Form con el schema de ONBOARDING_FORM_CFG.
 *   - Aplicar los 14 items usando FormBuilder._applyItem (ctx vacío: no usa
 *     choicesFromList ni FILE_UPLOAD).
 *   - setDestination al Sheet container-bound → Google crea una pestaña nueva.
 *   - Detectar esa pestaña de forma robusta (timing + cache de metadata).
 *   - Renombrar a '_respuestas_config' (= CFG_TAB_NAME) + ocultarla.
 *   - Crear trigger installable onFormSubmit apuntando a 'onFormSubmitHandler'.
 *
 * Idempotencia:
 *   - Si ya existe un Form vinculado (registry key 'form:F00:onboarding'), se reusa.
 *   - Si el registry está vacío pero hay un Form huérfano en Drive con el título
 *     canónico, se RECUPERA (no se duplica). Camino importante post-crash.
 *   - Si ya hay trigger onFormSubmit para este Form + handler, NO se duplica.
 *
 * Robustez post-setDestination:
 *   - SpreadsheetApp.flush() + retry loop 5x con Utilities.sleep(1500ms).
 *   - Doble detección: diff por SheetId + fallback regex de nombre
 *     (^(Form_Responses|Form Responses|Respuestas de formulario)).
 */

const FormOnboardingBuilder = {

  REGISTRY_KEY: 'form:F00:onboarding',

  // Regex que matchea los nombres default que Google Forms puede dar a la
  // pestaña de respuestas según el locale del usuario. Observado en la práctica:
  //   - inglés: "Form Responses 1" (con espacio) o "Form_Responses" (con underscore, moderno).
  //   - español: "Respuestas de formulario 1".
  DEFAULT_TAB_NAME_REGEX: /^(Form[_ ]Responses|Respuestas de formulario)/i,

  /**
   * createAndLink(containerSheet) — crea el Form (o recupera huérfano), linkea
   * al Sheet, renombra pestaña, instala trigger. Idempotente + resiliente.
   */
  createAndLink(containerSheet) {
    Guard.assert(containerSheet !== null && containerSheet !== undefined,
      'FormOnboardingBuilder.createAndLink requiere Spreadsheet.');

    // 1. Idempotencia: intentar reusar (registry o Drive search).
    const existing = this._tryReuseExisting(containerSheet);
    if (existing) {
      SetupLog.info('Form onboarding reusado/recuperado', {
        formId: existing.formId,
        configTabName: existing.configTabName,
        reused: existing.reused
      });
      return existing;
    }

    // 2. Crear Form nuevo con metadata de ONBOARDING_FORM_CFG.
    const form = FormApp.create(ONBOARDING_FORM_CFG.title);
    form.setDescription(ONBOARDING_FORM_CFG.description);
    form.setCollectEmail(false);
    form.setAllowResponseEdits(true);
    form.setShowLinkToRespondAgain(false);

    SetupLog.info('Form onboarding creado', {
      formId: form.getId(),
      title: ONBOARDING_FORM_CFG.title
    });

    // 3. Aplicar los 14 items via FormBuilder existente.
    const ctx = { folders: {}, masterLists: {} };
    ONBOARDING_FORM_CFG.items.forEach(function(itemCfg) {
      FormBuilder._applyItem(form, itemCfg, ctx);
    });

    Guard.assert(
      form.getItems().length === ONBOARDING_FORM_CFG.items.length,
      'FormOnboardingBuilder: items aplicados (' + form.getItems().length +
      ') no coincide con schema (' + ONBOARDING_FORM_CFG.items.length + ').'
    );

    // 4. Snapshot + setDestination + wait for new tab (resiliente).
    const tabsBeforeIds = containerSheet.getSheets().map(function(t) { return t.getSheetId(); });
    form.setDestination(FormApp.DestinationType.SPREADSHEET, containerSheet.getId());

    const newTab = this._waitForNewResponseTab(containerSheet, tabsBeforeIds);
    if (!newTab) {
      SetupLog.error('setDestination no produjo pestaña detectable tras retry loop', {
        tabsBeforeCount: tabsBeforeIds.length
      });
      throw new Error(
        'setDestination no produjo pestaña nueva detectable en el container Sheet ' +
        'tras 5 retries con flush+sleep. Chequeá permisos de SpreadsheetApp o ' +
        'el Sheet manualmente. El Form huérfano queda en Drive con id ' + form.getId() +
        ' — el próximo bootstrapTemplate intentará recuperarlo automáticamente.'
      );
    }

    // 5. Finalizar (rename + hide + trigger + registry).
    return this._finalizeRecovery(form, newTab, containerSheet, false);
  },

  /**
   * writeFormLinkToArranqueTab(containerSheet, formUrl) — escribe el link del
   * Form en la pestaña '👋 Arranque' reemplazando el placeholder.
   */
  writeFormLinkToArranqueTab(containerSheet, formUrl) {
    Guard.assertNonEmpty(formUrl, 'formUrl');

    const arranqueTab = containerSheet.getSheetByName('👋 Arranque');
    if (!arranqueTab) {
      SetupLog.warn('Pestaña "👋 Arranque" no existe — skipeo escritura del link Form', {
        formUrl: formUrl
      });
      return;
    }

    const values = arranqueTab.getRange(1, 1, arranqueTab.getLastRow(), 1).getValues();
    let replaced = false;
    for (let i = 0; i < values.length; i++) {
      const row = String(values[i][0] || '');
      if (row.indexOf('Form de onboarding:') === 0) {
        arranqueTab.getRange(i + 1, 1).setValue('Form de onboarding: ' + formUrl);
        replaced = true;
        SetupLog.info('Link Form escrito en pestaña Arranque', {
          row: i + 1,
          formUrl: formUrl
        });
        break;
      }
    }

    if (!replaced) {
      arranqueTab.appendRow(['Form de onboarding: ' + formUrl]);
      SetupLog.info('Link Form apendeado al final de Arranque', { formUrl: formUrl });
    }
  },

  // ===========================================================================
  // Idempotency / Recovery
  // ===========================================================================

  /**
   * _tryReuseExisting — busca Form existente en 2 pasos:
   *   1. PropertiesRegistry (camino rápido post-success previo).
   *   2. DriveApp search por título (camino de recovery post-crash, cuando el
   *      Form se creó pero el registry no se guardó porque falló un paso
   *      siguiente).
   * Retorna objeto createAndLink-compatible o null si no hay nada que reusar.
   */
  _tryReuseExisting(containerSheet) {
    // Paso 1: registry.
    const entry = PropertiesRegistry.get(this.REGISTRY_KEY);
    if (entry && entry.id) {
      try {
        const form = FormApp.openById(entry.id);
        return {
          form: form,
          formUrl: form.getPublishedUrl(),
          formId: form.getId(),
          configTabName: entry.configTabName || CFG_TAB_NAME,
          triggerUid: entry.triggerUid,
          reused: true
        };
      } catch (err) {
        SetupLog.warn('Form del registry ya no existe, limpiando entrada', {
          formId: entry.id,
          error: err.message
        });
        PropertiesRegistry.set(this.REGISTRY_KEY, null);
      }
    }

    // Paso 2: Drive search por título canónico (recovery de huérfano).
    // Sesión 4 2026-05-01 fix distribución: SOLO reusar si el Form está sin
    // destino linkeado (caso recovery post-crash original) o linkeado a ESTE
    // container (idempotencia). Si está linkeado a OTRO Sheet, pertenece a
    // otro proyecto/copia del template — NO reusar, sino re-linkearíamos y
    // rompiendo el otro proyecto. Bug raíz cazado en sesión 4 cuando bootstrap
    // ejecutado en una copia del Sheet re-linkeó el F00 del sistema vivo a
    // la copia.
    const title = ONBOARDING_FORM_CFG.title;
    const files = DriveApp.getFilesByName(title);
    const containerId = containerSheet.getId();

    while (files.hasNext()) {
      const file = files.next();
      let form;
      try {
        form = FormApp.openById(file.getId());
      } catch (err) {
        SetupLog.warn('Archivo con título canónico en Drive pero no es Form válido', {
          fileId: file.getId(),
          err: String(err)
        });
        continue;
      }

      // Verificar destination del Form. 3 casos:
      //   destId === null         → recovery post-crash (Form creado pero
      //                             setDestination no corrió) → reusar.
      //   destId === containerId  → ya linkeado acá → reusar (idempotencia).
      //   destId === otroSheetId  → de otro proyecto → SKIP (no reusar).
      let destId = null;
      try {
        destId = form.getDestinationId();
      } catch (destErr) {
        destId = null;
      }

      if (destId && destId !== containerId) {
        SetupLog.info('Form con título canónico encontrado pero linkeado a otro container — skip (no reusar)', {
          formId: form.getId(),
          destId: destId,
          containerId: containerId
        });
        continue;
      }

      SetupLog.info('Form huérfano detectado en Drive por búsqueda de título — recuperando', {
        formId: form.getId(),
        title: title,
        destId: destId
      });

      return this._recoverOrphanForm(form, containerSheet);
    }

    return null;
  },

  /**
   * _recoverOrphanForm — completa los pasos post-create que fallaron en un
   * bootstrapTemplate previo. Si el Form ya está linkeado a una pestaña del
   * container, solo falta finalizar (rename+hide+trigger+registry). Si no,
   * re-linkea con setDestination + wait.
   */
  _recoverOrphanForm(form, containerSheet) {
    const linkedTab = this._findLinkedTab(containerSheet);

    if (linkedTab) {
      SetupLog.info('Form huérfano YA tiene pestaña linkeada en este container', {
        tabName: linkedTab.getName(),
        isHidden: linkedTab.isSheetHidden()
      });
      return this._finalizeRecovery(form, linkedTab, containerSheet, true);
    }

    // Form existe pero sin pestaña en este container → re-linkear.
    SetupLog.info('Form huérfano sin pestaña en este container — re-linkeando con setDestination');
    const tabsBeforeIds = containerSheet.getSheets().map(function(t) { return t.getSheetId(); });
    form.setDestination(FormApp.DestinationType.SPREADSHEET, containerSheet.getId());

    const newTab = this._waitForNewResponseTab(containerSheet, tabsBeforeIds);
    if (!newTab) {
      throw new Error(
        'Recovery: re-link con setDestination no produjo pestaña detectable. ' +
        'Form id ' + form.getId() + ' quedó linkeado pero mi código no lo ve. ' +
        'Solución manual: abrí el Sheet, identificá la pestaña "Form_Responses" o similar, ' +
        'renombrala a "' + CFG_TAB_NAME + '" y ocultala.'
      );
    }

    return this._finalizeRecovery(form, newTab, containerSheet, true);
  },

  /**
   * _findLinkedTab — busca en el containerSheet la pestaña linkeada al Form
   * de onboarding. Primero por el nombre canónico '_respuestas_config' (si ya
   * fue renombrada en un run anterior), después por los nombres default que
   * Google Forms puede asignar según locale.
   */
  _findLinkedTab(containerSheet) {
    SpreadsheetApp.flush();
    const refreshedSs = SpreadsheetApp.openById(containerSheet.getId());
    const tabs = refreshedSs.getSheets();

    // Prioridad 1: nombre canónico (ya fue renombrada).
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].getName() === CFG_TAB_NAME) return tabs[i];
    }

    // Prioridad 2: nombres default de Google Forms.
    for (let i = 0; i < tabs.length; i++) {
      if (this.DEFAULT_TAB_NAME_REGEX.test(tabs[i].getName())) return tabs[i];
    }

    return null;
  },

  /**
   * _waitForNewResponseTab — detecta la pestaña creada por setDestination.
   * Usa flush() + retry loop con sleep (Apps Script no garantiza sincronía
   * entre setDestination y la propagación del metadata del Spreadsheet).
   *
   * Doble criterio por iteración:
   *   a) Diff de SheetIds vs snapshot previo (captura cualquier nueva).
   *   b) Fallback regex de nombre (captura incluso si el cache no refresca IDs).
   *
   * Retorna el Sheet (tab) nuevo o null si no aparece en 5 intentos.
   */
  _waitForNewResponseTab(containerSheet, tabsBeforeIds) {
    SpreadsheetApp.flush();

    const maxAttempts = 5;
    const sleepMs = 1500;
    const beforeSet = {};
    tabsBeforeIds.forEach(function(id) { beforeSet[id] = true; });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      Utilities.sleep(sleepMs);

      const refreshedSs = SpreadsheetApp.openById(containerSheet.getId());
      const tabsAfter = refreshedSs.getSheets();

      // Criterio a: diff por SheetId.
      for (let i = 0; i < tabsAfter.length; i++) {
        if (!beforeSet[tabsAfter[i].getSheetId()]) {
          SetupLog.info('Pestaña nueva detectada por diff de SheetId', {
            name: tabsAfter[i].getName(),
            attempt: attempt + 1
          });
          return tabsAfter[i];
        }
      }

      // Criterio b: fallback regex de nombre default.
      for (let i = 0; i < tabsAfter.length; i++) {
        if (this.DEFAULT_TAB_NAME_REGEX.test(tabsAfter[i].getName())) {
          SetupLog.info('Pestaña nueva detectada por regex de nombre', {
            name: tabsAfter[i].getName(),
            attempt: attempt + 1
          });
          return tabsAfter[i];
        }
      }

      SetupLog.info('Retry esperando pestaña nueva', {
        attempt: attempt + 1,
        maxAttempts: maxAttempts,
        tabsCount: tabsAfter.length
      });
    }

    return null;
  },

  /**
   * _finalizeRecovery — pasos comunes tras tener (form, tab, container):
   *   1. Renombrar tab a CFG_TAB_NAME si no lo es.
   *   2. Ocultar la tab si no está oculta.
   *   3. Instalar trigger installable onFormSubmit (idempotent).
   *   4. Persistir en PropertiesRegistry.
   *   5. Retornar objeto de respuesta estándar.
   *
   * Param `wasOrphan`: true si el Form fue recuperado (para el flag `reused`).
   */
  _finalizeRecovery(form, tab, containerSheet, wasOrphan) {
    const originalName = tab.getName();

    if (originalName !== CFG_TAB_NAME) {
      tab.setName(CFG_TAB_NAME);
      SetupLog.info('Pestaña de respuestas renombrada', {
        from: originalName,
        to: CFG_TAB_NAME
      });
    } else {
      SetupLog.info('Pestaña de respuestas ya tiene nombre canónico', { name: CFG_TAB_NAME });
    }

    if (!tab.isSheetHidden()) {
      tab.hideSheet();
      SetupLog.info('Pestaña de respuestas ocultada');
    }

    const triggerUid = this._installFormSubmitTrigger(form);

    PropertiesRegistry.set(this.REGISTRY_KEY, {
      id: form.getId(),
      type: 'form',
      configTabName: CFG_TAB_NAME,
      triggerUid: triggerUid,
      createdAt: new Date().toISOString(),
      wasOrphan: !!wasOrphan
    });

    return {
      form: form,
      formUrl: form.getPublishedUrl(),
      formId: form.getId(),
      configTabName: CFG_TAB_NAME,
      triggerUid: triggerUid,
      reused: !!wasOrphan
    };
  },

  /**
   * _installFormSubmitTrigger — crea trigger installable onFormSubmit si no
   * existe ya uno para este Form + handler. Idempotente.
   */
  _installFormSubmitTrigger(form) {
    const handlerName = 'onFormSubmitHandler';

    const existingTriggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < existingTriggers.length; i++) {
      const t = existingTriggers[i];
      if (t.getHandlerFunction() === handlerName &&
          t.getTriggerSourceId() === form.getId() &&
          t.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
        SetupLog.info('Trigger onFormSubmit ya existe, reusando', {
          uid: t.getUniqueId()
        });
        return t.getUniqueId();
      }
    }

    const trigger = ScriptApp.newTrigger(handlerName)
      .forForm(form)
      .onFormSubmit()
      .create();

    SetupLog.info('Trigger onFormSubmit instalado', {
      uid: trigger.getUniqueId(),
      handler: handlerName,
      formId: form.getId()
    });

    return trigger.getUniqueId();
  }

};
