/**
 * DocGenerator.gs — genera Google Docs a partir de templates con placeholders
 * reemplazados por datos de respuestas de Forms formales.
 * Fase 2.5 del plan v9 implementada 2026-04-21 por FORJA2 (modo autónomo).
 *
 * Flujo:
 *   1. Dado un formId (F05, F06, ...), busca el templateDocId en el registry
 *      (key 'docTemplate:Fxx'). El template fue creado por DocTemplateBuilder
 *      al correr bootstrapTemplate o al correr buildAllDocTemplates manual.
 *   2. Copia el template a un Google Doc nuevo dentro del outputFolder
 *      correspondiente (Drive).
 *   3. Abre el Doc copia via DocumentApp.
 *   4. Itera responseData (dict pre-extraído por el caller; ver Input):
 *      para cada header del Form, slugifica el nombre → `{{slug}}` y hace
 *      `body.replaceText('\\{\\{slug\\}\\}', valor)`.
 *   5. saveAndClose.
 *   6. Retorna { docId, docUrl, docName }.
 *
 * Input responseData (provisto por el caller — típicamente
 * FormalFormsTriggerManager._extractResponseData que ya maneja Form-based y
 * Spreadsheet-based event shapes):
 *   Shape canónico: { "Titulo del item del Form": value | [value, ...] }
 *   Donde:
 *     - key = título literal del item del Form (se slugifica adentro).
 *     - value = string (respuestas simples), array de strings (CHECKBOX),
 *       null/undefined/"" (se convierten a "").
 *   También acepta flat dict { slug_ya_hecho: "valor" } — _slugify es
 *   idempotente sobre snake_case sin tildes.
 *
 * Arquitectura:
 *   - Placeholders del template son snake_case sin tildes: `{{fecha}}`,
 *     `{{hora_inicio}}`, `{{orden_del_dia}}`. Generados via `_slugify(header)`.
 *   - Valores array (de CHECKBOX multi-select) se join por coma.
 *   - Array-de-arrays (CHECKBOX_GRID / GRID_SCALE) NO está soportado —
 *     ver deuda D16 en la cápsula de Fase 2.5. Los 9 forms formales actuales
 *     no usan esos tipos.
 *
 * Idempotencia:
 *   - Cada generación crea un Doc NUEVO con timestamp en el nombre.
 *   - No reusa Docs previos (cada respuesta del Form produce 1 Doc).
 *   - No hay registry de Docs generados (irrelevante, crecen monotónicamente).
 */

const DocGenerator = {

  /**
   * generate(formId, responseData, outputFolder, options) — genera un Doc copia
   * del template correspondiente con los placeholders reemplazados.
   *
   * Params:
   *   formId:       'F05', 'F06', ..., 'F14'. Debe estar en DOC_TEMPLATES.
   *   responseData: object con los datos del Form. Ver arquitectura §2.
   *   outputFolder: Folder destino (Drive). Si es string, se interpreta como
   *                 folderPath relativo al CFG.YEAR y se resuelve via folders dict.
   *   options:      { docNamePrefix?, docNameSuffix?, folders?, timestamp? }
   *                 - folders: dict de paths → Folder (opcional; si outputFolder
   *                   es string requiere folders). Del ctx de setupAll.
   *                 - timestamp: Date (default new Date()) para el nombre del Doc.
   *
   * Retorna: { docId, docUrl, docName, placeholdersReplaced, placeholdersMissing }
   * Throws:
   *   - Error si no hay mapping en DOC_TEMPLATES para el formId.
   *   - Error si el template no existe en el registry o en Drive.
   *   - Error si outputFolder no es válido.
   */
  generate(formId, responseData, outputFolder, options) {
    Guard.assertNonEmpty(formId, 'formId');
    Guard.assert(responseData && typeof responseData === 'object',
      'DocGenerator.generate: responseData debe ser un objeto.');

    const templateMeta = DOC_TEMPLATES[formId];
    if (!templateMeta) {
      throw new Error(
        'DocGenerator: no hay template configurado para formId "' + formId + '". ' +
        'Forms con template: ' + Object.keys(DOC_TEMPLATES).join(', ') + '.'
      );
    }

    // 1. Resolver templateDocId desde el registry.
    const registryEntry = PropertiesRegistry.get(templateMeta.registryKey);
    if (!registryEntry || !registryEntry.id) {
      throw new Error(
        'DocGenerator: el template "' + templateMeta.registryKey + '" no está en el registry. ' +
        'Ejecutá buildAllDocTemplates() una vez antes de usar DocGenerator, o ' +
        'verificá que el template no haya sido eliminado manualmente de Drive.'
      );
    }

    let templateFile;
    try {
      templateFile = DriveApp.getFileById(registryEntry.id);
    } catch (err) {
      throw new Error(
        'DocGenerator: el template registry tiene id "' + registryEntry.id +
        '" pero DriveApp no lo puede abrir. ¿Borrado? Re-correr buildAllDocTemplates(). ' +
        'Error original: ' + err.message
      );
    }

    // 2. Resolver outputFolder.
    const targetFolder = this._resolveFolder(outputFolder, templateMeta.outputFolderPath, options);

    // 3. Nombre del Doc copia.
    const timestamp = (options && options.timestamp) || new Date();
    const tsString = Utilities.formatDate(timestamp, 'America/Argentina/Cordoba', 'yyyy-MM-dd-HHmm');
    const docName = (options && options.docNamePrefix ? options.docNamePrefix + '-' : '') +
      templateMeta.docNamePattern.replace('{timestamp}', tsString) +
      (options && options.docNameSuffix ? '-' + options.docNameSuffix : '');

    // 4. Copiar template al folder destino.
    const copyFile = templateFile.makeCopy(docName, targetFolder);
    SetupLog.info('DocGenerator: template copiado', {
      formId: formId,
      templateId: registryEntry.id,
      copyId: copyFile.getId(),
      docName: docName,
      folder: targetFolder.getName()
    });

    // 5. Abrir Doc + replaceText por cada placeholder.
    const doc = DocumentApp.openById(copyFile.getId());
    const body = doc.getBody();

    // Enriquecer responseData con info institucional del CFG antes de normalizar.
    const enriched = this._enrichWithCFG(responseData);
    const normalized = this._normalizeResponseData(enriched);
    const replaced = [];
    const missing = [];

    Object.keys(normalized).forEach(function(slug) {
      const value = normalized[slug];
      const placeholder = '{{' + slug + '}}';
      const escaped = placeholder.replace(/[{}]/g, '\\$&');
      // body.replaceText acepta regex; escapamos las {} para tratarlas literales.
      try {
        const result = body.replaceText(escaped, String(value));
        if (result) {
          replaced.push(slug);
        }
      } catch (err) {
        SetupLog.warn('DocGenerator: replaceText falló para placeholder', {
          slug: slug,
          err: String(err)
        });
      }
    });

    doc.saveAndClose();

    // 6. Detectar placeholders que quedaron sin reemplazar ({{xxx}} aún en el body).
    // Para eso re-abrimos en modo read + buscamos {{ pattern.
    const verifyDoc = DocumentApp.openById(copyFile.getId());
    const verifyText = verifyDoc.getBody().getText();
    const leftoverMatches = verifyText.match(/\{\{[a-z0-9_]+\}\}/gi);
    if (leftoverMatches) {
      leftoverMatches.forEach(function(m) {
        const slug = m.replace(/[{}]/g, '');
        if (missing.indexOf(slug) === -1) missing.push(slug);
      });
      SetupLog.warn('DocGenerator: quedaron placeholders sin reemplazar', {
        formId: formId,
        missing: missing,
        count: missing.length
      });
    }

    SetupLog.info('DocGenerator: Doc generado OK', {
      formId: formId,
      docId: copyFile.getId(),
      docName: docName,
      placeholdersReplaced: replaced.length,
      placeholdersMissing: missing.length
    });

    return {
      docId: copyFile.getId(),
      docUrl: doc.getUrl(),
      docName: docName,
      placeholdersReplaced: replaced,
      placeholdersMissing: missing
    };
  },

  // ===========================================================================
  // Helpers internos
  // ===========================================================================

  /**
   * _resolveFolder — si outputFolder es Folder, lo retorna. Si es string,
   * asume es path relativo al CFG.YEAR y busca en options.folders.
   */
  _resolveFolder(outputFolder, fallbackPath, options) {
    // Si es ya un Folder de DriveApp, retornar directo.
    if (outputFolder && typeof outputFolder.addFile === 'function') {
      return outputFolder;
    }

    // String path → buscar en folders dict
    const pathToUse = (typeof outputFolder === 'string' && outputFolder.length > 0)
      ? outputFolder
      : fallbackPath;

    Guard.assertNonEmpty(pathToUse, 'outputFolder path');

    if (!options || !options.folders) {
      throw new Error(
        'DocGenerator._resolveFolder: outputFolder es path "' + pathToUse +
        '" pero no se pasó options.folders (dict de folders del ctx de setupAll).'
      );
    }

    const folder = options.folders[pathToUse];
    if (!folder) {
      throw new Error(
        'DocGenerator._resolveFolder: folder "' + pathToUse + '" no existe en el dict. ' +
        'Keys disponibles: ' + Object.keys(options.folders).slice(0, 10).join(', ')
      );
    }

    return folder;
  },

  /**
   * _normalizeResponseData — convierte responseData a shape { slug: stringValue }.
   * Acepta:
   *   - Dict extraído por FormalFormsTriggerManager._extractResponseData:
   *     { "Fecha": ["2026-04-21"], "Participantes": ["Ana", "Beatriz"], ... }
   *   - Flat dict pre-slugificado: { fecha: "2026-04-21", ... }
   *   - Mezcla.
   * Arrays se joinean con ", ". null/undefined/vacío → "".
   * NO soporta array-de-arrays (CHECKBOX_GRID / GRID_SCALE) — deuda D16.
   */
  _normalizeResponseData(responseData) {
    const out = {};
    Object.keys(responseData).forEach(function(key) {
      const slug = DocGenerator._slugify(key);
      const val = responseData[key];
      let stringVal;
      if (Array.isArray(val)) {
        stringVal = val.map(function(v) { return String(v); }).join(', ');
      } else if (val === null || val === undefined) {
        stringVal = '';
      } else {
        stringVal = String(val);
      }
      out[slug] = stringVal;
    });
    return out;
  },

  /**
   * _enrichWithCFG — agrega al responseData las keys institucionales del CFG
   * del onboarding (school_name, academic_year, location, director_name,
   * director_email) para que los templates puedan usarlas como placeholders.
   * Si CFG no está accesible (fuera de container o sin onboarding), retorna
   * responseData sin cambios + WARN en el log.
   *
   * Prioridad: responseData > enriched. Si hay colisión de keys, gana el
   * valor explícito del form submission.
   */
  _enrichWithCFG(responseData) {
    let enriched = {};
    try {
      enriched = {
        school_name: CFG.SCHOOL_NAME || '',
        academic_year: CFG.YEAR || '',
        location: CFG.LOCATION || '',
        director_name: CFG.DIRECTOR_NAME || '',
        director_email: CFG.DIRECTOR_EMAIL || ''
      };
    } catch (err) {
      SetupLog.warn('DocGenerator: CFG no accesible al enriquecer responseData', {
        err: String(err && err.message || err)
      });
    }
    return Object.assign({}, enriched, responseData);
  },

  /**
   * _slugify — convierte "Hora inicio" → "hora_inicio", "Órden/Del día" → "orden_del_dia".
   * Remueve tildes, lowercase, reemplaza no-alfanuméricos por _, trim _ de los bordes.
   */
  _slugify(text) {
    if (!text) return '';
    return String(text)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

};
