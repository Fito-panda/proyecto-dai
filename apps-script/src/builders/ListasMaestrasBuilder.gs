/**
 * ListasMaestrasBuilder.gs — crea/llena SHEET-Listas-Maestras y devuelve un snapshot en memoria
 * que los builders de forms consumen para los dropdowns con `choicesFromList`.
 *
 * Pestañas creadas en SHEET-Listas-Maestras: Alumnos, Espacios, Secciones, Familias.
 *
 * Docentes NO se crea acá (paso 2 plan v3 baja/suplentes 2026-04-27): la fuente
 * única de docentes es la pestaña '👥 Docentes' del Sheet template (10 cols con
 * Estado/Token), leída por _readDocentesFromContainer() filtrando Estado=Activa.
 *
 * PLACEHOLDERS — DEFAULT_DOCENTES, DEFAULT_ESPACIOS, DEFAULT_SECCIONES son
 * fallbacks usados cuando la fuente real está vacía (caso pre-siembra inicial).
 * Las filas marcadas "(ejemplo)" son solo para que la directora vea cómo se completa.
 */

const ListasMaestrasBuilder = {

  // PLACEHOLDERS — Pérez, Gómez, López son apellidos muy comunes en Argentina, intencionalmente
  // obvios para que nadie confunda estos 3 ejemplos con docentes reales.
  // 2026-04-27 paso 2 plan v3 baja/suplentes: estos placeholders solo se usan
  // como fallback cuando la pestaña 👥 Docentes del Sheet template está vacía
  // (caso pre-siembra inicial). Después del primer setupAll, los docentes
  // reales se leen de 👥 Docentes filtrando Estado=Activa.
  DEFAULT_DOCENTES: [
    'Perez Maria (ejemplo - borrar)',
    'Gomez Juan (ejemplo - borrar)',
    'Lopez Ana (ejemplo - borrar)'
  ],

  // Espacios curriculares default = PCI Cordoba 2026.
  // Escuelas de otras provincias editan esta lista en la pestana 📖 Espacios curriculares.
  DEFAULT_ESPACIOS: [
    'Lengua y Literatura',
    'Matematica',
    'Ciencias Naturales y Ciudadania',
    'Ciencias Sociales y Ciudadania',
    'Educacion Tecnologica y Ciencias de la Computacion',
    'Lengua Extranjera — Ingles',
    'Educacion Fisica',
    'Educacion Artistica — Artes Visuales',
    'Literatura y TIC',
    'Proyecto Institucional'
  ],

  // Secciones default = caso tipico escuela rural plurigrado (3 secciones, 6 grados).
  // Escuelas con mas/menos secciones editan en la pestana 📚 Secciones y grados.
  DEFAULT_SECCIONES: [
    'Seccion 1 (1° y 2°) — ejemplo',
    'Seccion 2 (3° y 4°) — ejemplo',
    'Seccion 3 (5° y 6°) — ejemplo'
  ],

  TAB_ALUMNOS: 'Alumnos',
  // TAB_DOCENTES eliminada (paso 2 plan v3 baja/suplentes 2026-04-27).
  // La pestaña 'Docentes' plana de SHEET-Listas-Maestras dejó de existir;
  // la fuente única ahora es '👥 Docentes' del Sheet template.
  TAB_ESPACIOS: 'Espacios',
  TAB_SECCIONES: 'Secciones',
  TAB_FAMILIAS: 'Familias',

  /**
   * Crea el spreadsheet + pestanas + headers. Si ya existe, solo lee los valores.
   * Retorna { spreadsheet, snapshot } donde snapshot es el objeto para resolver choicesFromList.
   */
  build(sheetsFolder) {
    const name = CFG.MASTER_LISTS_SHEET_NAME;
    const result = SheetBuilder.getOrCreate(sheetsFolder, name);
    const ss = result.spreadsheet;

    this._ensureTab(ss, this.TAB_ALUMNOS, ['Apellido', 'Nombre', 'DNI', 'Seccion', 'Grado'], []);
    // 2026-04-27 paso 2 plan v3 baja/suplentes: pestaña Docentes plana
    // ELIMINADA. La fuente única de docentes ahora es la pestaña '👥 Docentes'
    // del Sheet template (10 columnas con Estado/Token), leída por
    // _readDocentesFromContainer() abajo.
    this._ensureTab(ss, this.TAB_ESPACIOS, ['Espacio curricular', 'Campo de formacion'],
      this.DEFAULT_ESPACIOS.map(function(e) { return [e, '']; }));
    this._ensureTab(ss, this.TAB_SECCIONES, ['Seccion'],
      this.DEFAULT_SECCIONES.map(function(s) { return [s]; }));
    this._ensureTab(ss, this.TAB_FAMILIAS, ['Alumno', 'Padre/Madre/Tutor', 'Telefono', 'Email'], []);

    SheetBuilder.removeDefaultTabIfPossible(ss);

    const snapshot = this._buildSnapshot(ss);
    SetupLog.info('Listas Maestras listas', {
      docentes: snapshot.docentes.length,
      alumnos: snapshot.alumnos.length,
      espacios: snapshot.espacios.length,
      secciones: snapshot.secciones.length
    });
    return { spreadsheet: ss, snapshot: snapshot };
  },

  _ensureTab(spreadsheet, tabName, headers, seedRows) {
    const sheet = SheetBuilder.getOrCreateTab(spreadsheet, tabName);
    // Si esta vacia, poner headers + seed
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      if (seedRows && seedRows.length) {
        sheet.getRange(2, 1, seedRows.length, headers.length).setValues(
          seedRows.map(function(row) {
            // pad row to headers length
            const padded = row.slice();
            while (padded.length < headers.length) padded.push('');
            return padded;
          })
        );
      }
      sheet.autoResizeColumns(1, headers.length);
    }
  },

  /**
   * Lee cada pestana y arma el snapshot que el FormBuilder usa.
   */
  _buildSnapshot(spreadsheet) {
    const self = this;
    const alumnos = this._readColumn(spreadsheet, this.TAB_ALUMNOS, 2, 2); // Nombre (col 2), skip header
    const alumnosConApellido = this._readAlumnosCompletos(spreadsheet);
    // Paso 2 plan v3 (2026-04-27): docentes leídos de '👥 Docentes' del Sheet
    // template (no de SHEET-Listas-Maestras pestaña Docentes plana, eliminada).
    // Filtra Estado=Activa. La directora es una fila más en 👥 Docentes
    // (no entidad separada). La key 'docentes_plus_directora' se ELIMINA —
    // los 6 forms que la usaban migran a 'docentes' en el paso 3 del plan.
    const docentes = this._readDocentesFromContainer();
    const espacios = this._readColumn(spreadsheet, this.TAB_ESPACIOS, 1, 2);
    const secciones = this._readColumn(spreadsheet, this.TAB_SECCIONES, 1, 2);

    return {
      alumnos: alumnosConApellido.length ? alumnosConApellido : alumnos,
      docentes: docentes.length ? docentes : self.DEFAULT_DOCENTES.slice(),
      docentes_plus_sin: (docentes.length ? docentes : self.DEFAULT_DOCENTES.slice()).concat(['Sin pareja pedagogica']),
      espacios: espacios.length ? espacios : self.DEFAULT_ESPACIOS.slice(),
      espacios_plus_general: (espacios.length ? espacios : self.DEFAULT_ESPACIOS.slice()).concat(['General / No aplica']),
      secciones: secciones.length ? secciones : self.DEFAULT_SECCIONES.slice(),
      secciones_plus_todas: (secciones.length ? secciones : self.DEFAULT_SECCIONES.slice()).concat(['Todas'])
    };
  },

  /**
   * _readDocentesFromContainer — paso 2 plan v3 (2026-04-27).
   * Lee la pestaña '👥 Docentes' del Sheet template (active spreadsheet),
   * filtra filas con Estado=Activa, y formatea como "Apellido, Nombre".
   *
   * Schema esperado de '👥 Docentes' (10 cols, definido en ConfigSheetBuilder):
   *   1=Apellido, 2=Nombre, 3=DNI, 4=Email, 5=Tipo,
   *   6=Estado, 7=Fecha alta, 8=Fecha cambio Estado, 9=Notas, 10=Token
   *
   * Layout del Sheet: row 1 = headers, row 2 = helptext mergeado, row 3+ = data.
   *
   * Defensive: si no hay container activo (smoke test, contexto raro),
   * retorna []. El caller usa DEFAULT_DOCENTES como fallback.
   *
   * Retorna: array de strings tipo "Peralta, Nelly" filtrados Estado=Activa.
   */
  _readDocentesFromContainer() {
    try {
      const container = SpreadsheetApp.getActiveSpreadsheet();
      if (!container) return [];
      const tab = container.getSheetByName('👥 Docentes');
      if (!tab) return [];
      const lastRow = tab.getLastRow();
      // row 1 = headers, row 2 = helptext, datos desde row 3
      if (lastRow < 3) return [];

      // Leer 6 columnas (Apellido/Nombre/DNI/Email/Tipo/Estado), data rows
      const range = tab.getRange(3, 1, lastRow - 2, 6);
      const values = range.getValues();

      return values
        .filter(function(row) {
          const estado = String(row[5] || '').trim();
          return estado === 'Activa';
        })
        .map(function(row) {
          const apellido = String(row[0] || '').trim();
          const nombre = String(row[1] || '').trim();
          if (!apellido && !nombre) return '';
          if (!apellido) return nombre;
          if (!nombre) return apellido;
          return apellido + ', ' + nombre;
        })
        .filter(function(s) { return s.length > 0; });
    } catch (err) {
      if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
        SetupLog.warn('_readDocentesFromContainer fallo, fallback a DEFAULT_DOCENTES', {
          err: String(err)
        });
      }
      return [];
    }
  },

  _readColumn(spreadsheet, tabName, col, startRow) {
    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow < startRow) return [];
    const values = sheet.getRange(startRow, col, lastRow - startRow + 1, 1).getValues();
    return values
      .map(function(row) { return String(row[0] || '').trim(); })
      .filter(function(v) { return v.length > 0; });
  },

  _readAlumnosCompletos(spreadsheet) {
    const sheet = spreadsheet.getSheetByName(this.TAB_ALUMNOS);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Apellido, Nombre, DNI, Seccion
    return values
      .filter(function(row) { return row[0] || row[1]; })
      .map(function(row) {
        const apellido = String(row[0] || '').trim();
        const nombre = String(row[1] || '').trim();
        const seccion = String(row[3] || '').trim();
        const display = (apellido + ' ' + nombre).trim();
        return seccion ? (display + ' — ' + seccion) : display;
      })
      .filter(function(v) { return v.length > 0; });
  }

};
