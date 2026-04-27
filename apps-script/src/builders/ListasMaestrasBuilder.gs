/**
 * ListasMaestrasBuilder.gs — crea/llena SHEET-Listas-Maestras y devuelve un snapshot en memoria
 * que los builders de forms consumen para los dropdowns con `choicesFromList`.
 *
 * Pestanas: Alumnos, Docentes, Espacios, Secciones, Cooperadora, Familias.
 *
 * PLACEHOLDERS — reemplazar con datos reales en pestana 👥 Docentes del Sheet template.
 * Las filas marcadas "(ejemplo)" son solo para que la directora vea como se completa.
 * La primera vez que corra "Generar todo", es esperable que borre los ejemplos y cargue
 * sus datos reales.
 */

const ListasMaestrasBuilder = {

  // PLACEHOLDERS — Pérez, Gómez, López son apellidos muy comunes en Argentina, intencionalmente
  // obvios para que nadie confunda estos 3 ejemplos con docentes reales.
  DEFAULT_DOCENTES: [
    'Perez Maria (ejemplo - borrar)',
    'Gomez Juan (ejemplo - borrar)',
    'Lopez Ana (ejemplo - borrar)'
  ],

  DEFAULT_DIRECTORA: 'Directora (ejemplo - borrar)',

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
  TAB_DOCENTES: 'Docentes',
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
    this._ensureTab(ss, this.TAB_DOCENTES, ['Nombre completo', 'Cargo', 'Espacios curriculares'],
      this.DEFAULT_DOCENTES.map(function(n) { return [n, '', '']; }));
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
    const docentes = this._readColumn(spreadsheet, this.TAB_DOCENTES, 1, 2);
    const espacios = this._readColumn(spreadsheet, this.TAB_ESPACIOS, 1, 2);
    const secciones = this._readColumn(spreadsheet, this.TAB_SECCIONES, 1, 2);

    return {
      alumnos: alumnosConApellido.length ? alumnosConApellido : alumnos,
      docentes: docentes.length ? docentes : self.DEFAULT_DOCENTES.slice(),
      docentes_plus_directora: (docentes.length ? docentes : self.DEFAULT_DOCENTES.slice()).concat([self.DEFAULT_DIRECTORA]),
      docentes_plus_sin: (docentes.length ? docentes : self.DEFAULT_DOCENTES.slice()).concat(['Sin pareja pedagogica']),
      espacios: espacios.length ? espacios : self.DEFAULT_ESPACIOS.slice(),
      espacios_plus_general: (espacios.length ? espacios : self.DEFAULT_ESPACIOS.slice()).concat(['General / No aplica']),
      secciones: secciones.length ? secciones : self.DEFAULT_SECCIONES.slice(),
      secciones_plus_todas: (secciones.length ? secciones : self.DEFAULT_SECCIONES.slice()).concat(['Todas'])
    };
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
