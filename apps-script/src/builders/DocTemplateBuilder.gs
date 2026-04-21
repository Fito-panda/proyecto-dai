/**
 * DocTemplateBuilder.gs — crea programáticamente los 9 templates Google Docs
 * para los Forms formales del ciclo DAI. Fase 2.5 del plan v9 implementada
 * 2026-04-21 por FORJA2 (modo autónomo).
 *
 * Responsabilidad:
 *   - Crear 1 carpeta root `DAI-Templates-Docs-v1/` en el Drive de
 *     driveproyectodai@gmail.com (idempotente vía registry).
 *   - Crear 9 Google Docs dentro de esa carpeta, 1 por form formal (F05, F06,
 *     F08, F09, F10, F11, F12, F13, F14), usando DocumentApp para construir
 *     headings + párrafos + placeholders snake_case (ej: `{{fecha}}`,
 *     `{{hora_inicio}}`, `{{school_name}}`).
 *   - Registrar cada templateId en PropertiesRegistry con key `docTemplate:Fxx`.
 *   - Al correr por segunda vez, reusar los templates del registry (idempotent).
 *
 * Entry point:
 *   DocTemplateBuilder.buildAll() → vos (Fito) lo corrés UNA VEZ desde el IDE
 *   via la función wrapper `buildAllDocTemplates()` en Main.gs.
 *
 * Después de crear los templates:
 *   - Podés abrirlos manualmente en Drive y retocar formato si querés.
 *   - Los placeholders `{{slug}}` NO se tocan. DocGenerator los reemplaza al
 *     generar cada Doc copia.
 *   - Si querés re-estructurar el contenido sin romper DocGenerator:
 *     mantené los `{{slug}}` exactos, cambiá el layout alrededor.
 *
 * Layout común de los 9 templates:
 *   1. Título institucional grande.
 *   2. Subtítulo {{school_name}}.
 *   3. Línea con {{location}} — Año lectivo {{academic_year}}.
 *   4. Separador horizontal.
 *   5. Bloque de datos clave (pares "Label: {{slug}}").
 *   6. Secciones de contenido (heading 2 + párrafo con placeholder).
 *   7. Espacio de firma al final.
 *
 * Referencia de placeholders: cada template usa los slugs de los items del
 * Form correspondiente (generados por `_slugify(title)` en DocGenerator).
 * Ver ConfigForms.gs para los titles exactos por form.
 */

const DocTemplateBuilder = {

  TEMPLATES_ROOT_REGISTRY_KEY: 'docTemplatesRoot',

  /**
   * buildAll() — entry point. Crea o reusa root + 9 templates.
   * Retorna: { created: [...], reused: [...], failed: [...] }
   */
  buildAll() {
    SetupLog.info('===== DocTemplateBuilder.buildAll iniciando =====', {
      timestamp: new Date().toISOString()
    });

    const rootFolder = this._ensureRootFolder();
    const results = { created: [], reused: [], failed: [] };
    const self = this;

    DOC_TEMPLATE_FORM_IDS.forEach(function(formId) {
      try {
        const r = self._ensureTemplate(formId, rootFolder);
        if (r.created) {
          results.created.push({ formId: formId, docId: r.docId, title: r.title });
        } else {
          results.reused.push({ formId: formId, docId: r.docId });
        }
      } catch (err) {
        SetupLog.error('DocTemplateBuilder: fallo al crear template', {
          formId: formId,
          err: String(err && err.message || err),
          stack: err && err.stack
        });
        results.failed.push({ formId: formId, error: String(err) });
      }
    });

    SetupLog.info('DocTemplateBuilder.buildAll OK', {
      created: results.created.length,
      reused: results.reused.length,
      failed: results.failed.length,
      rootFolderId: rootFolder.getId()
    });

    return Object.assign({}, results, {
      rootFolderId: rootFolder.getId(),
      rootFolderUrl: rootFolder.getUrl(),
      message: 'Templates: ' + results.created.length + ' creados, ' +
        results.reused.length + ' reusados, ' + results.failed.length + ' fallos.'
    });
  },

  // ===========================================================================
  // Internos: ensure root + ensure template
  // ===========================================================================

  _ensureRootFolder() {
    const entry = PropertiesRegistry.get(this.TEMPLATES_ROOT_REGISTRY_KEY);
    if (entry && entry.id) {
      try {
        const folder = DriveApp.getFolderById(entry.id);
        SetupLog.info('DocTemplateBuilder: root folder reusado del registry', {
          id: folder.getId()
        });
        return folder;
      } catch (err) {
        SetupLog.warn('DocTemplateBuilder: root folder del registry no existe, buscando por nombre', {
          oldId: entry.id
        });
      }
    }

    const iter = DriveApp.getRootFolder().getFoldersByName(TEMPLATES_ROOT_FOLDER_NAME);
    let folder;
    if (iter.hasNext()) {
      folder = iter.next();
      SetupLog.info('DocTemplateBuilder: root folder encontrado por búsqueda en My Drive', {
        id: folder.getId()
      });
    } else {
      folder = DriveApp.getRootFolder().createFolder(TEMPLATES_ROOT_FOLDER_NAME);
      SetupLog.info('DocTemplateBuilder: root folder creado', {
        name: TEMPLATES_ROOT_FOLDER_NAME,
        id: folder.getId()
      });
    }

    PropertiesRegistry.set(this.TEMPLATES_ROOT_REGISTRY_KEY, {
      id: folder.getId(),
      type: 'folder',
      name: TEMPLATES_ROOT_FOLDER_NAME
    });

    return folder;
  },

  _ensureTemplate(formId, rootFolder) {
    const tmplMeta = DOC_TEMPLATES[formId];
    if (!tmplMeta) {
      throw new Error('DocTemplateBuilder: no hay metadata en DOC_TEMPLATES para formId "' + formId + '".');
    }

    const entry = PropertiesRegistry.get(tmplMeta.registryKey);
    if (entry && entry.id) {
      try {
        const existing = DriveApp.getFileById(entry.id);
        return { docId: existing.getId(), created: false, title: tmplMeta.templateTitle };
      } catch (err) {
        SetupLog.warn('DocTemplateBuilder: template del registry no accesible, recreando', {
          formId: formId,
          oldId: entry.id
        });
      }
    }

    const doc = DocumentApp.create(tmplMeta.templateTitle);
    const docId = doc.getId();

    const buildFn = this['_buildTemplate' + formId];
    if (!buildFn) {
      throw new Error('DocTemplateBuilder: no hay método _buildTemplate' + formId + '() definido.');
    }
    buildFn.call(this, doc);

    doc.saveAndClose();

    const file = DriveApp.getFileById(docId);
    file.moveTo(rootFolder);

    PropertiesRegistry.set(tmplMeta.registryKey, {
      id: docId,
      type: 'docTemplate',
      title: tmplMeta.templateTitle,
      createdAt: new Date().toISOString()
    });

    SetupLog.info('DocTemplateBuilder: template creado', {
      formId: formId,
      docId: docId,
      title: tmplMeta.templateTitle
    });

    return { docId: docId, created: true, title: tmplMeta.templateTitle };
  },

  // ===========================================================================
  // Helpers de layout (reusables por los 9 templates)
  // ===========================================================================

  _addInstitutionalHeader(body, documentTypeLabel) {
    body.appendParagraph(documentTypeLabel).setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph('{{school_name}}').setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    body.appendParagraph('{{location}} — Año lectivo {{academic_year}}');
    body.appendHorizontalRule();
  },

  _addDataRow(body, label, slug) {
    const p = body.appendParagraph('');
    p.appendText(label + ': ').setBold(true);
    p.appendText('{{' + slug + '}}').setBold(false);
  },

  _addSection(body, title, bodyText) {
    body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(bodyText || '');
  },

  _addSignatureLine(body) {
    body.appendParagraph('');
    body.appendParagraph('');
    body.appendParagraph('Firma: _______________________________');
    body.appendParagraph('Aclaración: ___________________________');
    body.appendParagraph('Fecha de firma: _______________________');
  },

  _addDivider(body) {
    body.appendParagraph('');
    body.appendHorizontalRule();
    body.appendParagraph('');
  },

  // ===========================================================================
  // 9 templates (1 por form formal)
  // ===========================================================================

  _buildTemplateF05(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'ACTA DE REUNIÓN');
    body.appendParagraph('');
    this._addDataRow(body, 'Fecha', 'fecha');
    this._addDataRow(body, 'Hora inicio', 'hora_inicio');
    this._addDataRow(body, 'Hora fin', 'hora_fin');
    this._addDataRow(body, 'Tipo de reunión', 'tipo_de_reunion');
    this._addDataRow(body, 'Lugar', 'lugar');
    this._addDataRow(body, 'Convocada por', 'convocada_por');
    this._addDivider(body);
    this._addSection(body, 'Participantes', '{{participantes}}');
    body.appendParagraph('Otros participantes: {{otros_participantes}}');
    this._addSection(body, 'Orden del día', '{{orden_del_dia}}');
    this._addSection(body, 'Desarrollo', '{{desarrollo}}');
    this._addSection(body, 'Acuerdos / Decisiones', '{{acuerdos_decisiones}}');
    body.appendParagraph('Responsables de los acuerdos: {{responsables_de_acuerdos}}');
    body.appendParagraph('Fecha límite de los acuerdos: {{fecha_limite_de_acuerdos}}');
    this._addSection(body, 'Observaciones', '{{observaciones}}');
    this._addSignatureLine(body);
  },

  _buildTemplateF06(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'REGISTRO DE AVANCE DEL PIE');
    body.appendParagraph('Proyecto Educativo Institucional — "Sembrando cambios"');
    this._addDivider(body);
    this._addDataRow(body, 'Fecha de registro', 'fecha_de_registro');
    this._addDataRow(body, 'Etapa del PIE', 'etapa_del_pie');
    this._addDataRow(body, 'Quien registra', 'quien_registra');
    this._addDivider(body);
    this._addSection(body, 'Objetivo del PIE trabajado', '{{objetivo_del_pie_trabajado}}');
    this._addSection(body, 'Acciones realizadas en el período', '{{acciones_realizadas_en_el_periodo}}');
    body.appendParagraph('Espacios curriculares involucrados: {{espacios_curriculares_involucrados}}');
    body.appendParagraph('Secciones involucradas: {{secciones_involucradas}}');
    body.appendParagraph('Docentes participantes: {{docentes_participantes}}');
    body.appendParagraph('Indicador de avance: {{indicador_de_avance}}');
    this._addSection(body, 'Evidencias', '{{evidencias}}');
    this._addSection(body, 'Dificultades encontradas', '{{dificultades_encontradas}}');
    this._addSection(body, 'Ajustes propuestos', '{{ajustes_propuestos}}');
    body.appendParagraph('Vinculación con "Proyecto Especial": {{vinculacion_con_proyecto_especial}}');
    this._addSignatureLine(body);
  },

  _buildTemplateF08(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'AUTORIZACIÓN PARA ACTIVIDAD');
    body.appendParagraph('');
    this._addDataRow(body, 'Alumno/a', 'nombre_del_alumno_a');
    this._addDataRow(body, 'Sección', 'seccion');
    this._addDataRow(body, 'Padre / Madre / Tutor', 'nombre_del_padre_madre_tutor');
    this._addDataRow(body, 'DNI del padre/madre/tutor', 'dni_del_padre_madre_tutor');
    this._addDataRow(body, 'Teléfono de contacto', 'telefono_de_contacto');
    this._addDivider(body);
    this._addSection(body, 'Actividad', '{{actividad}}');
    this._addDataRow(body, 'Fecha de la actividad', 'fecha_de_la_actividad');
    this._addDivider(body);
    this._addSection(body, 'Autorizo la participación', '{{autorizo_la_participacion}}');
    this._addSection(body, 'Observaciones (alergias, medicación, etc.)', '{{observaciones_alergias_medicacion_etc}}');
    this._addDataRow(body, 'Contacto de emergencia alternativo', 'contacto_de_emergencia_alternativo');
    this._addSignatureLine(body);
  },

  _buildTemplateF09(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'COMUNICADO / CIRCULAR');
    body.appendParagraph('');
    this._addDataRow(body, 'Fecha', 'fecha');
    this._addDataRow(body, 'Emitido por', 'emitido_por');
    this._addDataRow(body, 'Destinatarios', 'destinatarios');
    this._addDataRow(body, 'Asunto', 'asunto');
    this._addDataRow(body, 'Tipo', 'tipo');
    this._addDivider(body);
    this._addSection(body, 'Contenido del comunicado', '{{contenido_del_comunicado}}');
    this._addDivider(body);
    body.appendParagraph('Requiere respuesta / confirmación: {{requiere_respuesta_confirmacion}}');
    body.appendParagraph('Fecha límite de respuesta: {{fecha_limite_de_respuesta}}');
    body.appendParagraph('Canal de envío: {{canal_de_envio}}');
    this._addSignatureLine(body);
  },

  _buildTemplateF10(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'MOVIMIENTO DE CAJA COOPERADORA');
    body.appendParagraph('Libro de caja digital — Cooperadora escolar');
    this._addDivider(body);
    this._addDataRow(body, 'Fecha', 'fecha');
    this._addDataRow(body, 'Tipo de movimiento', 'tipo_de_movimiento');
    this._addDataRow(body, 'Categoría', 'categoria');
    this._addDivider(body);
    this._addSection(body, 'Descripción del movimiento', '{{descripcion}}');
    this._addDataRow(body, 'Monto (pesos)', 'monto_pesos');
    this._addDataRow(body, 'Medio de pago', 'medio_de_pago');
    this._addDataRow(body, 'N° de comprobante', 'nro_de_comprobante');
    this._addDataRow(body, 'Registrado por', 'registrado_por');
    this._addDataRow(body, 'Aprobado por (para egresos)', 'aprobado_por');
    this._addSection(body, 'Observaciones', '{{observaciones}}');
    this._addSignatureLine(body);
  },

  _buildTemplateF11(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'ACTA DE REUNIÓN DE COOPERADORA');
    body.appendParagraph('');
    this._addDataRow(body, 'Fecha', 'fecha');
    this._addDataRow(body, 'Hora inicio', 'hora_inicio');
    this._addDataRow(body, 'Hora fin', 'hora_fin');
    this._addDataRow(body, 'Tipo de reunión', 'tipo_de_reunion');
    this._addDataRow(body, 'Lugar', 'lugar');
    this._addDataRow(body, 'Cantidad de asistentes', 'cantidad_de_asistentes');
    this._addDataRow(body, 'Quórum alcanzado', 'quorum');
    this._addDivider(body);
    this._addSection(body, 'Nombres de asistentes', '{{nombres_de_asistentes}}');
    this._addSection(body, 'Orden del día', '{{orden_del_dia}}');
    this._addSection(body, 'Desarrollo', '{{desarrollo}}');
    this._addSection(body, 'Mociones y votaciones', '{{mociones_y_votaciones}}');
    this._addSection(body, 'Acuerdos / resoluciones', '{{acuerdos_resoluciones}}');
    body.appendParagraph('Responsables: {{responsables}}');
    body.appendParagraph('Próxima reunión: {{proxima_reunion}}');
    this._addSignatureLine(body);
  },

  _buildTemplateF12(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'SOLICITUD DE COMPRA / GASTO');
    body.appendParagraph('A Cooperadora escolar');
    this._addDivider(body);
    this._addDataRow(body, 'Fecha de solicitud', 'fecha_de_solicitud');
    this._addDataRow(body, 'Solicitado por', 'solicitado_por');
    this._addDataRow(body, 'Rol', 'rol');
    this._addDivider(body);
    this._addSection(body, 'Qué se necesita', '{{que_se_necesita}}');
    this._addSection(body, 'Para qué (justificación)', '{{para_que}}');
    this._addDataRow(body, 'Urgencia', 'urgencia');
    this._addDataRow(body, 'Monto estimado', 'monto_estimado');
    this._addDataRow(body, 'Proveedor sugerido', 'proveedor_sugerido');
    this._addDivider(body);
    body.appendParagraph('Decisión de Cooperadora').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph('[  ] Aprobada     [  ] Rechazada     [  ] En revisión');
    body.appendParagraph('Observaciones de Cooperadora: _______________________________________');
    this._addSignatureLine(body);
  },

  _buildTemplateF13(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'PRE-CARGA PARA SGE');
    body.appendParagraph('Sistema de Gestión Estudiantil — staging manual previo a carga oficial');
    this._addDivider(body);
    this._addDataRow(body, 'Fecha de pre-carga', 'fecha_de_precarga');
    this._addDataRow(body, 'Tipo de dato', 'tipo_de_dato');
    this._addDataRow(body, 'Sección', 'seccion');
    this._addDataRow(body, 'Período', 'periodo');
    this._addDataRow(body, 'Preparado por', 'preparado_por');
    this._addDivider(body);
    this._addSection(body, 'Datos a cargar', '{{datos_a_cargar}}');
    this._addSection(body, 'Observaciones', '{{observaciones}}');
    this._addDivider(body);
    body.appendParagraph('Control de carga efectiva al SGE').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph('[  ] Cargado al SGE provincial');
    body.appendParagraph('Fecha de carga: ________________________');
    body.appendParagraph('Responsable carga: _____________________');
    this._addSignatureLine(body);
  },

  _buildTemplateF14(doc) {
    const body = doc.getBody();
    body.clear();
    this._addInstitutionalHeader(body, 'FICHA DE LEGAJO INTERNO');
    body.appendParagraph('Registro previo al Legajo Digital oficial del SGE');
    this._addDivider(body);
    this._addDataRow(body, 'Fecha', 'fecha');
    this._addDataRow(body, 'Alumno/a', 'alumno_a');
    this._addDataRow(body, 'Nombre completo (si es nuevo ingreso)', 'nombre_completo_si_es_nuevo_ingreso');
    this._addDataRow(body, 'DNI', 'dni');
    this._addDataRow(body, 'Sección', 'seccion');
    this._addDataRow(body, 'Tipo de documento', 'tipo_de_documento');
    this._addDataRow(body, 'Estado', 'estado');
    this._addDataRow(body, 'Registrado por', 'registrado_por');
    this._addDivider(body);
    this._addSection(body, 'Observaciones', '{{observaciones}}');
    this._addSignatureLine(body);
  }

};
