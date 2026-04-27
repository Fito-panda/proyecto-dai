/**
 * ConfigSheetBuilder.gs — crea/reusa las 8 pestañas del Sheet template DAI.
 * Fase 2 del plan v9 implementada 2026-04-20 por FORJA2.
 *
 * Arquitectura:
 *   - Esta clase SOLO maneja pestañas "estáticas" del Sheet container-bound.
 *   - NO crea el Form de onboarding (eso es FormOnboardingBuilder, próximo sub-paso).
 *   - NO crea la pestaña _respuestas_config (esa la crea Google Sheets cuando
 *     FormOnboardingBuilder linkea el Form via setDestination, y la renombra).
 *
 * Guardrails anti-pérdida (plan v9 línea 369):
 *   - Sin clear() ni deleteSheet() ni deleteRows() sobre pestañas con data del usuario.
 *   - Idempotencia estricta: getSheetByName() antes de crear.
 *   - Si la pestaña existe con headers distintos, NO pisa — loguea WARN y skipea.
 *
 * Layout por pestaña:
 *   - kind 'table':     Row 1 = headers (bold), Row 2 = helptext mergeado (italic),
 *                       Row 3+ libre para data. Freeze 2 rows.
 *   - kind 'narrative': Col A = bannerLines[] (una por row), primera row bold 14pt.
 *                       Se usa para la pestaña de bienvenida '👋 Arranque'.
 *
 * Convención de emojis en nombres de pestaña: los toma del plan v9 literal
 * (interfaz visible para la directora — no aplica la regla anti-emoji que
 * rige chat/canon de autor).
 */

const ConfigSheetBuilder = {

  /**
   * SCHEMA — definición canónica de las 8 pestañas del template DAI.
   *
   * Campos:
   *   name:        string visible de la pestaña (con emoji, plan v9 líneas 367-374).
   *   kind:        'table' | 'narrative'.
   *   headers:     string[] columnas Row 1 (solo kind='table').
   *   helptext:    string Row 2 mergeado (solo kind='table').
   *   bannerLines: string[] Col A rows 1..N (solo kind='narrative').
   */
  SCHEMA: [
    {
      name: '👋 Arranque',
      kind: 'narrative',
      bannerLines: [
        'Bienvenida DAI — Arranque del año escolar.',
        '',
        'Paso 1: Enviá el Form de onboarding (link abajo).',
        'Paso 2: Una vez enviado, todo se configura automáticamente.',
        'Paso 3: Recibirás un email con los links a tus paneles.',
        '',
        'Form de onboarding: [el link lo pega FormOnboardingBuilder al correr bootstrapTemplate]',
        '',
        'Dudas: proyectodai.com/ayuda'
      ]
    },
    {
      name: '👥 Docentes',
      kind: 'table',
      headers: ['Apellido', 'Nombre', 'DNI', 'Email', 'Tipo', 'Estado', 'Fecha alta', 'Fecha cambio Estado', 'Notas', 'Token'],
      helptext: 'Lista docente del año. Apellido + Nombre + Email obligatorios. DNI y Tipo opcionales (Tipo: Titular | Suplente | Docente JE | Otro). Estado lo cambia el sistema cuando tocás los botones del Panel Directora (Activa | Licencia | No disponible). Fecha alta y Fecha cambio: el sistema las completa solo. Notas: campo libre, escribí lo que quieras. Token: NO lo toques — el sistema lo usa para el link personal del Panel Directora.',
      hiddenColumns: [10]
    },
    {
      name: '📚 Secciones',
      kind: 'table',
      headers: ['seccion', 'ciclo', 'turno', 'docente_titular', 'cantidad_alumnos'],
      helptext: 'Secciones del año lectivo. "ciclo": 1ro | 2do | 3ro | 4to | 5to | 6to. "turno": JUE (jornada unica extendida, Modelo A TransFORMAR@cba).'
    },
    {
      name: '🎓 Alumnos',
      kind: 'table',
      headers: ['apellido', 'nombre', 'dni', 'seccion', 'fecha_nacimiento', 'observaciones'],
      helptext: 'Nomina de alumnos. DNI sin puntos ni espacios. "fecha_nacimiento" formato DD/MM/YYYY. Esta pestana NO va al SGE — es registro pedagogico interno.'
    },
    {
      name: '📖 Espacios curriculares',
      kind: 'table',
      headers: ['espacio', 'ciclo', 'carga_horaria', 'docente', 'pce_alineado'],
      helptext: 'Espacios oficiales del PCI. "pce_alineado": true | false (Proyecto Curricular del Espacio al dia). Defaults del PCI 2026 Cordoba se cargaran en Fase 2.5 (ver destilado PCI+PIE).'
    },
    {
      name: '👨\u200d👩\u200d👧 Familias',
      kind: 'table',
      headers: ['alumno', 'vinculo', 'nombre_contacto', 'telefono', 'email', 'autorizado_retirar'],
      helptext: 'Contactos familiares por alumno. "vinculo": madre | padre | tutor/a | abuelo/a | otro. "autorizado_retirar": true | false (legal para retirar al alumno).'
    },
    {
      name: '✅ Formularios',
      kind: 'table',
      headers: ['form', 'url', 'creado', 'respuestas'],
      helptext: 'Catalogo de los 11 Forms del ciclo escolar. setupAll() popula esta pestana automaticamente tras crear cada Form. "respuestas": contador manual o via funcion de actualizacion.'
    },
    {
      name: '📋 Estado del sistema',
      kind: 'table',
      headers: ['Fecha', 'Tipo', 'Quién', 'Qué', 'Detalle'],
      helptext: 'Log auditable de operaciones e intentos del sistema. NO editar manualmente. Tipo: INFO (operación normal) | WARN (situación esperada pero atípica) | ERROR (algo falló, puede requerir acción manual). Quién: email de quien ejecutó la operación. Qué: descripción corta. Detalle: contexto extra (errores, IDs, payload).'
    }
  ],

  /**
   * build(spreadsheet) — crea o reusa las 8 pestañas canónicas del template.
   * Idempotente: pestañas existentes con schema coincidente se reusan; con schema
   * distinto se skipean (no se pisan).
   *
   * Retorna: { created: [names], reused: [names], skipped: [names] }
   */
  build(spreadsheet) {
    Guard.assert(spreadsheet !== null && spreadsheet !== undefined,
      'ConfigSheetBuilder.build requiere un Spreadsheet valido.');

    const result = { created: [], reused: [], skipped: [] };
    const self = this;

    this.SCHEMA.forEach(function(cfg) {
      const outcome = self._ensureTab(spreadsheet, cfg);
      result[outcome].push(cfg.name);
    });

    SetupLog.info('ConfigSheetBuilder.build OK', {
      created: result.created.length,
      reused: result.reused.length,
      skipped: result.skipped.length,
      totalSchema: this.SCHEMA.length
    });

    return result;
  },

  /**
   * _ensureTab — crea una pestaña según cfg, o la reusa si ya existe con schema
   * coincidente, o la skipea si existe con schema distinto.
   * Retorna: 'created' | 'reused' | 'skipped'.
   */
  _ensureTab(spreadsheet, cfg) {
    const existing = spreadsheet.getSheetByName(cfg.name);

    if (existing) {
      if (this._matchesSchema(existing, cfg)) {
        SetupLog.info('Tab reusada', { name: cfg.name });
        return 'reused';
      }
      SetupLog.warn('Tab existe con schema distinto, NO se pisa (guardrail)', {
        name: cfg.name,
        expected: cfg.headers || '(narrative banner)',
        actualRow1: this._readRow1(existing)
      });
      return 'skipped';
    }

    const tab = spreadsheet.insertSheet(cfg.name);

    if (cfg.kind === 'table') {
      this._populateTableTab(tab, cfg);
    } else if (cfg.kind === 'narrative') {
      this._populateNarrativeTab(tab, cfg);
    } else {
      throw new Error('ConfigSheetBuilder: kind desconocido "' + cfg.kind + '" para tab "' + cfg.name + '".');
    }

    SetupLog.info('Tab creada', { name: cfg.name, kind: cfg.kind });
    return 'created';
  },

  /**
   * _populateTableTab — headers bold Row 1 + helptext mergeado italic Row 2 + freeze 2 rows.
   */
  _populateTableTab(tab, cfg) {
    const lastCol = cfg.headers.length;

    // Row 1: headers bold
    tab.getRange(1, 1, 1, lastCol).setValues([cfg.headers]).setFontWeight('bold');

    // Row 2: helptext merged italic + wrap
    tab.getRange(2, 1, 1, lastCol).merge().setValue(cfg.helptext).setFontStyle('italic').setWrap(true);
    tab.setRowHeight(2, 48);

    // Freeze headers + helptext
    tab.setFrozenRows(2);

    // Hide columns marked as cfg.hiddenColumns (1-indexed). Used by 👥 Docentes
    // to ocultar la columna Token, que el sistema usa pero la directora no debe
    // editar — evita confusión visual sin perder la dato necesario para el link.
    if (cfg.hiddenColumns && cfg.hiddenColumns.length > 0) {
      cfg.hiddenColumns.forEach(function(colNum) {
        tab.hideColumns(colNum);
      });
    }
  },

  /**
   * _populateNarrativeTab — banner de texto en Col A. Primera row bold 14pt.
   */
  _populateNarrativeTab(tab, cfg) {
    const values = cfg.bannerLines.map(function(line) { return [line]; });
    tab.getRange(1, 1, values.length, 1).setValues(values);
    tab.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    tab.setColumnWidth(1, 600);
  },

  /**
   * _matchesSchema — compara Row 1 de la pestaña con cfg.headers.
   * Para narrative, siempre retorna true (no se valida contenido).
   */
  _matchesSchema(tab, cfg) {
    if (cfg.kind === 'narrative') return true;

    const row1 = this._readRow1(tab);
    if (row1.length < cfg.headers.length) return false;

    for (let i = 0; i < cfg.headers.length; i++) {
      if (String(row1[i]).trim() !== cfg.headers[i]) return false;
    }
    return true;
  },

  /**
   * _readRow1 — lee la primera fila completa de la pestaña como array.
   * Retorna [] si la pestaña no tiene columnas.
   */
  _readRow1(tab) {
    const lastCol = tab.getLastColumn();
    if (lastCol < 1) return [];
    return tab.getRange(1, 1, 1, lastCol).getValues()[0];
  }

};
