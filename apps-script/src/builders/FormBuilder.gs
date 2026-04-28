/**
 * FormBuilder.gs — el builder generico.
 *
 * buildForm(cfg, ctx) toma un form config y un contexto con:
 *   - folders: Map<path, Folder>
 *   - masterLists: snapshot de Listas Maestras
 *   - sheetsFolder: Folder de 06-Sheets-Maestros
 *   - formsFolder: Folder de 07-Formularios
 *
 * Flow:
 *   1. getOrCreate Sheet destino en sheetsFolder
 *   2. getOrCreate Form en formsFolder
 *   3. Resetear items del form (source of truth = config)
 *   4. Aplicar items del cfg (traduccion type -> FormApp call)
 *   5. setDestination(SPREADSHEET, sheetId) si no esta linkeado
 *
 * Retorna { form, sheet, created }.
 */

const FormBuilder = {

  build(cfg, ctx) {
    Guard.assertNonEmpty(cfg.id, 'cfg.id');
    Guard.assertNonEmpty(cfg.title, 'cfg.title');

    const sheetName = FormBuilder._applyYearSuffix(cfg.sheetName);
    const sheetFolder = FolderBuilder.resolvePath(ctx.folders, cfg.sheetFolderPath);
    const formFolder = FolderBuilder.resolvePath(ctx.folders, cfg.folderPath);

    // 1. Sheet destino
    const sheetResult = SheetBuilder.getOrCreate(sheetFolder, sheetName);

    // 2. Form
    const formResult = this._getOrCreateForm(cfg, formFolder);
    const form = formResult.form;

    // 3-4. Items + descripcion. Idempotencia D-F3c-NUEVO-12 (2026-04-28):
    // si los items existentes ya matchean el config (orden + titulo + tipo),
    // NO tocar — preserva las columnas del Sheet de respuestas. Forms NO
    // reusa cols del Sheet cuando se borran y recrean items con el mismo
    // titulo (asigna IDs internos nuevos), entonces sin esta proteccion cada
    // setupAll re-run duplicaba las cols. SetTitle + setDescription siguen
    // aplicandose (operaciones safe que no afectan items o cols del Sheet).
    form.setTitle(cfg.title);
    if (cfg.description) form.setDescription(cfg.description);
    form.setCollectEmail(false);
    form.setAllowResponseEdits(false);
    form.setShowLinkToRespondAgain(true);

    // validacion: si es familyFacing, no permitir FILE_UPLOAD (familias pueden no tener cuenta Google)
    const itemsToApply = this._filterItemsByContext(cfg.items, cfg, ctx);

    if (!this._existingItemsMatchConfig(form, itemsToApply)) {
      this._resetItems(form);
      itemsToApply.forEach(function(itemCfg) {
        FormBuilder._applyItem(form, itemCfg, ctx);
      });
    }
    // Si match: skip — preserva Sheet cols. Fix raiz D-F3c-NUEVO-12.

    // 5. setDestination (solo si no esta ya linkeado)
    this._ensureDestination(form, sheetResult.spreadsheet.getId());

    SetupLog.info('Form listo: ' + cfg.id + ' "' + cfg.title + '"', {
      formId: form.getId(),
      sheetId: sheetResult.spreadsheet.getId(),
      items: itemsToApply.length,
      created: formResult.created
    });

    return {
      form: form,
      sheet: sheetResult.spreadsheet,
      created: formResult.created,
      sheetCreated: sheetResult.created
    };
  },

  _getOrCreateForm(cfg, formFolder) {
    const registryKey = 'form:' + cfg.id;

    const resolved = IdempotencyService.resolveByRegistryOrSearch(
      registryKey,
      function(id) { return FormApp.openById(id); },
      function() {
        const file = IdempotencyService.findFileByMime(formFolder, cfg.title, MimeType.GOOGLE_FORMS);
        return file ? FormApp.openById(file.getId()) : null;
      }
    );

    if (resolved.obj) {
      return { form: resolved.obj, created: false };
    }

    const form = FormApp.create(cfg.title);
    // Mover el archivo del form a la carpeta de forms.
    // Importante: mover ANTES de registrar, para no dejar el id registrado si falla el move
    // (evita zombies fuera de la carpeta esperada).
    const file = DriveApp.getFileById(form.getId());
    Guard.retry(function() { file.moveTo(formFolder); }, { maxAttempts: 3, baseDelayMs: 300 });
    PropertiesRegistry.set(registryKey, { id: form.getId(), type: 'form' });
    return { form: form, created: true };
  },

  _resetItems(form) {
    const items = form.getItems();
    for (let i = items.length - 1; i >= 0; i--) {
      form.deleteItem(items[i]);
    }
  },

  /**
   * _mapItemTypeToFieldType(itemType) — Apps Script ItemType → cfg FIELD_TYPES.
   * Helper para _existingItemsMatchConfig (fix raiz D-F3c-NUEVO-12).
   * Returns: FIELD_TYPES.X string o null si tipo desconocido.
   */
  _mapItemTypeToFieldType(itemType) {
    if (itemType === FormApp.ItemType.TEXT) return FIELD_TYPES.SHORT_TEXT;
    if (itemType === FormApp.ItemType.PARAGRAPH_TEXT) return FIELD_TYPES.PARAGRAPH;
    if (itemType === FormApp.ItemType.MULTIPLE_CHOICE) return FIELD_TYPES.MULTIPLE_CHOICE;
    if (itemType === FormApp.ItemType.CHECKBOX) return FIELD_TYPES.CHECKBOX;
    if (itemType === FormApp.ItemType.LIST) return FIELD_TYPES.DROPDOWN;
    if (itemType === FormApp.ItemType.DATE) return FIELD_TYPES.DATE;
    if (itemType === FormApp.ItemType.DATETIME) return FIELD_TYPES.DATETIME;
    if (itemType === FormApp.ItemType.TIME) return FIELD_TYPES.TIME;
    if (itemType === FormApp.ItemType.SCALE) return FIELD_TYPES.SCALE;
    if (itemType === FormApp.ItemType.SECTION_HEADER) return FIELD_TYPES.SECTION_HEADER;
    return null;
  },

  /**
   * _existingItemsMatchConfig(form, configItems) — fix raiz D-F3c-NUEVO-12 (2026-04-28).
   *
   * True si los items actuales del form coinciden 1-a-1 con configItems en
   * orden + titulo + tipo. Si match, build() puede skipear el reset+apply y
   * preservar las columnas del Sheet de respuestas. Si mismatch (config cambio
   * genuinamente), build() hace reset+apply normal — el Sheet duplicara cols
   * (deuda visual aceptada porque hay cambio real de schema).
   *
   * Caso seminal: 2026-04-28 paso 10 vuelta 4 plan v3. Cada setupAll re-run
   * con la misma config duplicaba cols del Sheet de respuestas porque Forms
   * NO reusa cols cuando se borran y recrean items con el mismo titulo
   * (asigna IDs internos nuevos a los items recreados → Forms abre col nueva
   * en el Sheet, deja la vieja huerfana con header). Sintoma: form F-baja-01
   * con 4 items + Sheet con 8 cols (4 huerfanas + 4 activas), e.namedValues
   * con arrays de 2 elementos donde el primero (la col huerfana) es vacio.
   * Mitigacion vuelta 4.1 fue _firstNonEmpty en handleSumarDocente. Esta es
   * la fix raiz: no recrear items si ya matchean → no duplicar cols.
   *
   * Conservador: FILE_UPLOAD o tipo desconocido → mismatch (fallback a
   * reset+apply). Acepta deuda visual en esos casos raros.
   */
  _existingItemsMatchConfig(form, configItems) {
    const existing = form.getItems();
    if (existing.length !== configItems.length) return false;

    for (let i = 0; i < configItems.length; i++) {
      const cfg = configItems[i];
      const item = existing[i];

      // FILE_UPLOAD se convierte a TEXT con titulo alterado en _applyItem.
      // Forzar mismatch para no intentar detectar el match alterado.
      if (cfg.type === FIELD_TYPES.FILE_UPLOAD) return false;

      const itemFieldType = this._mapItemTypeToFieldType(item.getType());
      if (!itemFieldType) return false;
      if (itemFieldType !== cfg.type) return false;
      if (item.getTitle() !== cfg.title) return false;
    }
    return true;
  },

  _filterItemsByContext(items, cfg, ctx) {
    if (!cfg.familyFacing) return items;
    return items.filter(function(it) {
      if (it.type === FIELD_TYPES.FILE_UPLOAD) {
        SetupLog.warn('Form familyFacing: omitiendo item FILE_UPLOAD "' + it.title + '"', { formId: cfg.id });
        return false;
      }
      return true;
    });
  },

  _applyItem(form, itemCfg, ctx) {
    const choices = itemCfg.choices
      || (itemCfg.choicesFromList && ctx.masterLists[itemCfg.choicesFromList])
      || null;

    // Si pidio choicesFromList pero no existe, log warn y fallback a un placeholder
    if (itemCfg.choicesFromList && !choices) {
      SetupLog.warn('choicesFromList no resuelto: "' + itemCfg.choicesFromList + '" para item "' + itemCfg.title + '"');
    }

    switch (itemCfg.type) {

      case FIELD_TYPES.SHORT_TEXT: {
        const item = form.addTextItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.PARAGRAPH: {
        const item = form.addParagraphTextItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.MULTIPLE_CHOICE: {
        const item = form.addMultipleChoiceItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        item.setChoiceValues(choices && choices.length ? choices : ['(sin opciones)']);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.CHECKBOX: {
        const item = form.addCheckboxItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        item.setChoiceValues(choices && choices.length ? choices : ['(sin opciones)']);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.DROPDOWN: {
        const item = form.addListItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (choices && choices.length) {
          item.setChoiceValues(choices);
        } else {
          item.setChoiceValues(['(sin opciones)']);
        }
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.DATE: {
        const item = form.addDateItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.DATETIME: {
        const item = form.addDateTimeItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.TIME: {
        const item = form.addTimeItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.SCALE: {
        const item = form.addScaleItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        const min = itemCfg.min != null ? itemCfg.min : 1;
        const max = itemCfg.max != null ? itemCfg.max : 5;
        item.setBounds(min, max);
        if (itemCfg.minLabel) item.setLabels(itemCfg.minLabel, itemCfg.maxLabel || '');
        if (itemCfg.required) item.setRequired(true);
        return;
      }

      case FIELD_TYPES.FILE_UPLOAD: {
        // Limitacion de la API de Apps Script: FormApp NO permite crear items de file-upload
        // programaticamente (no existe form.addFileUploadItem). Solo la UI web del Form puede
        // agregarlos. Fallback: convertir en SHORT_TEXT indicando canal alternativo (WhatsApp).
        //
        // Si el docente necesita adjuntar archivo, lo manda por WhatsApp al grupo de la escuela
        // y Coordinadora/quien corresponda lo archiva manualmente en la carpeta Drive correspondiente.
        //
        // Alternativa futura: si Fito quiere uploads reales, agregar manualmente el item
        // file-upload desde la UI web del form (editar form en forms.google.com) — el resto
        // del codigo lo respeta, solo no puede crearlo de cero.
        const item = form.addTextItem().setTitle(itemCfg.title + ' (por WhatsApp)');
        const baseHelp = itemCfg.helpText ? (itemCfg.helpText + ' ') : '';
        item.setHelpText(baseHelp +
          'Apps Script no permite subir archivos desde el form. Mandar por WhatsApp al grupo de la escuela. ' +
          'Carpeta Drive de referencia: ' + itemCfg.folderPath);
        SetupLog.warn('FILE_UPLOAD "' + itemCfg.title + '" convertido a TEXT (limitacion de Apps Script)', {
          originalFolderPath: itemCfg.folderPath
        });
        return;
      }

      case FIELD_TYPES.SECTION_HEADER: {
        const item = form.addSectionHeaderItem().setTitle(itemCfg.title);
        if (itemCfg.helpText) item.setHelpText(itemCfg.helpText);
        return;
      }

      default:
        SetupLog.warn('Tipo de item desconocido: ' + itemCfg.type + ' para "' + itemCfg.title + '"');
    }
  },

  _ensureDestination(form, sheetId) {
    // getDestinationId lanza si no hay destination — envolvemos en try
    let currentDestId = null;
    try {
      currentDestId = form.getDestinationId();
    } catch (err) {
      currentDestId = null;
    }
    if (currentDestId === sheetId) return;
    // Si el form ya tenia un destino DIFERENTE (ej. sheet anterior borrado y recreado con otro id),
    // desvincularlo primero evita crear una pestana "Respuestas 2" en el nuevo sheet.
    if (currentDestId && currentDestId !== sheetId) {
      try {
        form.removeDestination();
      } catch (err) {
        SetupLog.warn('No se pudo removeDestination antes de relinkear', { err: String(err) });
      }
    }
    form.setDestination(FormApp.DestinationType.SPREADSHEET, sheetId);
  },

  _applyYearSuffix(baseName) {
    // si ya termina en -YYYY, no duplicar
    const suffix = '-' + CFG.YEAR;
    return baseName.indexOf(suffix) === baseName.length - suffix.length ? baseName : baseName + suffix;
  }

};
