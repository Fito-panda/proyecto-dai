/**
 * SetupOrchestrator.gs — coordina el orden completo:
 *
 *   1. ensureParentFolder  (aborta si falla)
 *   2. ensureYearFolder    (aborta si falla)
 *   3. buildFolderTree     (aborta si falla)
 *   4. buildListasMaestras (aborta si falla)
 *   5. ensureDashboard     (continue-on-error)
 *   6. por cada form de la fase: build (continue-on-error)
 *   6.5. share automatico del year folder con emails docentes (continue-on-error, Fase 2)
 *   7. flush log a SHEET-Setup-Log
 *
 * Retorna { ok: [...], failed: [...], skipped: [...], shared: {...} }.
 */

const SetupOrchestrator = {

  run(phase) {
    phase = phase || PHASES.ALL;
    SetupLog.reset();
    SetupLog.info('===== setupAll iniciando =====', { phase: phase, timestamp: new Date().toISOString() });

    const report = { phase: phase, ok: [], failed: [], skipped: [], shared: null };

    // 1-3: fundaciones (abort-on-error)
    let ctx = null;
    try {
      const parent = FolderBuilder.ensureParentFolder();
      const yearFolder = FolderBuilder.ensureYearFolder(parent);
      // R1 fix B1: getFoldersCfg() genera Legajos/Seccion-N según CFG.SECTION_COUNT.
      const folders = FolderBuilder.buildTree(yearFolder, getFoldersCfg());
      const sheetsFolder = folders['06-Sheets-Maestros'];
      const formsFolder = folders['07-Formularios'];

      // 4. listas maestras
      const listasResult = ListasMaestrasBuilder.build(sheetsFolder);

      ctx = {
        parentFolder: parent,
        yearFolder: yearFolder,
        folders: folders,
        sheetsFolder: sheetsFolder,
        formsFolder: formsFolder,
        masterLists: listasResult.snapshot,
        masterListsSpreadsheet: listasResult.spreadsheet
      };
    } catch (err) {
      SetupLog.error('Fundaciones fallaron — abortando', { err: String(err), stack: err.stack });
      this._flushLogSafe(null);
      throw err;
    }

    // 5. dashboard (continue-on-error)
    try {
      this._ensureDashboard(ctx.sheetsFolder);
    } catch (err) {
      SetupLog.warn('Dashboard no se pudo crear — continuando', { err: String(err) });
    }

    // 6. forms (continue-on-error)
    // 2026-04-26: cooperadora invisible por default (decisión de scope: la maneja
    // la comisión de padres por afuera del sistema). PhaseFilter omite forms
    // phase='cooperadora' a menos que un caller pase explícitamente cooperadora_activa=true.
    const onboardingFlags = {};
    const queue = PhaseFilter.filter(FORMS_CFG, phase, onboardingFlags);
    SetupLog.info('Forms a procesar en esta fase: ' + queue.length, {
      ids: queue.map(function(f) { return f.id; }),
      onboardingFlags: onboardingFlags
    });

    queue.forEach(function(cfg) {
      try {
        const result = FormBuilder.build(cfg, ctx);
        report.ok.push({
          id: cfg.id,
          title: cfg.title,
          formUrl: result.form.getPublishedUrl(),
          editUrl: result.form.getEditUrl(),
          sheetUrl: result.sheet.getUrl(),
          created: result.created
        });
      } catch (err) {
        SetupLog.error('Form ' + cfg.id + ' fallo — siguiendo con los otros', {
          title: cfg.title,
          err: String(err),
          stack: err.stack
        });
        report.failed.push({ id: cfg.id, title: cfg.title, error: String(err) });
      }
    });

    // 6.4 NUEVO (paso 4 plan v3 baja/suplentes 2026-04-27): siembra inicial
    // de la pestaña '👥 Docentes' del Sheet template usando los datos del
    // onboarding (director_email + teacher_emails). Idempotente via upsertByEmail
    // — si la fila ya existe (corrida previa de setupAll), no duplica.
    // Resuelve el bootstrap paradox: la directora queda registrada con su token
    // antes de que el panel admin valide tokens, así puede entrar al primer login.
    try {
      report.seeded = this._seedDocentesFromOnboarding();
    } catch (err) {
      SetupLog.warn('Siembra inicial Docentes fallo — continuando', { err: String(err) });
      report.seeded = { seeded: 0, skipped: 0, reason: 'error', error: String(err) };
    }

    // 6.5 share automatico (paso 4 plan v3 modificado): ahora lee emails de
    // '👥 Docentes' filtrando Estado != 'No disponible' (no de
    // _respuestas_config.teacher_emails). teacher_emails queda como siembra
    // inicial — se vuelca a Docentes en paso 6.4 y después se ignora.
    try {
      report.shared = this._shareYearFolderWithTeachers(ctx.yearFolder);
    } catch (err) {
      SetupLog.warn('Share automatico fallo — continuando', { err: String(err) });
      report.shared = { shared: [], skipped: [], reason: 'error', error: String(err) };
    }

    // 6.7 pestaña "Tu Panel" en el Sheet container-bound con los 2 URLs (Fase 3b.1, continue-on-error)
    try {
      report.tuPanel = TuPanelTabBuilder.ensure(SpreadsheetApp.getActiveSpreadsheet());
    } catch (err) {
      SetupLog.warn('Tu Panel tab fallo — continuando', { err: String(err) });
      report.tuPanel = { created: false, updated: false, error: String(err) };
    }

    // 7. flush log
    this._flushLogSafe(ctx.masterListsSpreadsheet);

    SetupLog.info('===== setupAll completo =====', {
      ok: report.ok.length,
      failed: report.failed.length,
      shared: (report.shared && report.shared.shared) ? report.shared.shared.length : 0
    });

    // Tambien imprimimos un resumen amigable en consola
    this._printSummary(report);

    return report;
  },

  _ensureDashboard(sheetsFolder) {
    const result = SheetBuilder.getOrCreate(sheetsFolder, CFG.DASHBOARD_SHEET_NAME);
    const ss = result.spreadsheet;
    CFG.DASHBOARD_TABS.forEach(function(tabName) {
      const sheet = SheetBuilder.getOrCreateTab(ss, tabName);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Pegar formula IMPORTRANGE/QUERY manualmente. Ver README.']);
        sheet.getRange(1, 1).setFontStyle('italic').setFontColor('#888888');
      }
    });
    SheetBuilder.removeDefaultTabIfPossible(ss);
  },

  /**
   * _shareYearFolderWithTeachers — paso 4 plan v3 (2026-04-27) modificado.
   *
   * Lee emails de la pestaña '👥 Docentes' del Sheet template filtrando
   * Estado != 'No disponible' (incluye Activa Y Licencia — la docente con
   * licencia mantiene acceso al Drive porque puede volver). NO lee más de
   * _respuestas_config.teacher_emails.
   *
   * teacher_emails del onboarding queda como siembra inicial: el paso 6.4
   * (_seedDocentesFromOnboarding) lo vuelca a 👥 Docentes y después se ignora.
   *
   * Retorna: { shared: [emails], skipped: [{email, error}], reason: string|null }.
   */
  _shareYearFolderWithTeachers(yearFolder) {
    const containerSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!containerSheet) {
      SetupLog.warn('Share: no hay container active, skipeado');
      return { shared: [], skipped: [], reason: 'no-container' };
    }
    const tab = containerSheet.getSheetByName('👥 Docentes');
    if (!tab) {
      SetupLog.warn('Share: pestaña 👥 Docentes no existe, skipeado');
      return { shared: [], skipped: [], reason: 'no-tab' };
    }
    const lastRow = tab.getLastRow();
    // row 1 = headers, row 2 = helptext, datos desde row 3
    if (lastRow < 3) {
      SetupLog.info('Share: 👥 Docentes vacia, nada que compartir');
      return { shared: [], skipped: [], reason: 'empty' };
    }

    // Lee 6 columnas (Apellido/Nombre/DNI/Email/Tipo/Estado), data rows
    const range = tab.getRange(3, 1, lastRow - 2, 6);
    const values = range.getValues();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const result = {
      shared: [],
      skipped: [],
      reason: null
    };

    values.forEach(function(row) {
      const email = String(row[3] || '').trim();
      const estado = String(row[5] || '').trim();

      // Filtrar No disponible (revocados — Activa y Licencia mantienen acceso)
      if (estado === 'No disponible') return;
      if (!email) return;

      if (!emailRegex.test(email)) {
        result.skipped.push({ email: email, error: 'invalid-format' });
        SetupLog.warn('Share: email con formato invalido', { email: email });
        return;
      }

      try {
        yearFolder.addEditor(email);
        result.shared.push(email);
        SetupLog.info('Share a docente OK', { email: email, estado: estado });
      } catch (err) {
        result.skipped.push({ email: email, error: String(err) });
        SetupLog.warn('Share fallo para email', { email: email, err: String(err) });
      }
    });

    SetupLog.info('Share desde 👥 Docentes terminado', {
      shared: result.shared.length,
      skipped: result.skipped.length
    });

    return result;
  },

  /**
   * _seedDocentesFromOnboarding — paso 4 plan v3 (2026-04-27).
   *
   * Siembra inicial de la pestaña '👥 Docentes' del Sheet template usando los
   * datos del onboarding (_respuestas_config). Lee:
   *   - director_email + director_name + director_dni → 1 fila para la directora.
   *   - teacher_emails (PARAGRAPH multi-linea) → 1 fila por cada email valido.
   *
   * Cada fila se agrega solo si NO existe ya una fila con ese email en la
   * pestaña (idempotencia via _upsertDocenteByEmail). Token UUID generado
   * con Utilities.getUuid() para cada nueva fila. Estado inicial = 'Activa'.
   *
   * Defensive: si _respuestas_config no esta poblada (caso pre-onboarding
   * o smoke test sin onboarding), retorna sin sembrar.
   *
   * Retorna: { seeded: int, skipped: int, reason: string|null }.
   */
  _seedDocentesFromOnboarding() {
    let rawConfig;
    try {
      rawConfig = readConfigFromSheet();
    } catch (err) {
      SetupLog.warn('Siembra: no se pudo leer _respuestas_config, skipeado', {
        err: String(err)
      });
      return { seeded: 0, skipped: 0, reason: 'no-config' };
    }

    const containerSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!containerSheet) {
      SetupLog.warn('Siembra: no hay container active, skipeado');
      return { seeded: 0, skipped: 0, reason: 'no-container' };
    }
    const tab = containerSheet.getSheetByName('👥 Docentes');
    if (!tab) {
      SetupLog.warn('Siembra: pestaña 👥 Docentes no existe, skipeado');
      return { seeded: 0, skipped: 0, reason: 'no-tab' };
    }

    const today = new Date();
    const result = { seeded: 0, skipped: 0, reason: null };

    // 1. Directora — siembra con sus datos del onboarding
    const directorEmail = String(rawConfig.director_email || '').trim();
    const directorName = String(rawConfig.director_name || '').trim();
    const directorDni = String(rawConfig.director_dni || '').trim();

    if (directorEmail && this._isValidEmail(directorEmail)) {
      // Parse "Apellido Nombre" — primera palabra apellido, resto nombre
      const parts = directorName.split(' ').filter(function(p) { return p.length > 0; });
      const apellido = parts.length > 0 ? parts[0] : '';
      const nombre = parts.slice(1).join(' ');

      const wasSeeded = this._upsertDocenteByEmail(tab, [
        apellido,
        nombre,
        directorDni,
        directorEmail,
        '', // Tipo (opcional, vacio inicial)
        'Activa',
        today,
        today,
        'Directora (sembrada del onboarding)',
        Utilities.getUuid()
      ]);
      if (wasSeeded) result.seeded++;
      else result.skipped++;
    }

    // 2. Docentes del campo teacher_emails (PARAGRAPH multi-linea)
    const rawTeachers = String(rawConfig.teacher_emails || '').trim();
    if (rawTeachers) {
      const candidates = rawTeachers.split(/[\n,;]+/)
        .map(function(e) { return e.trim(); })
        .filter(function(e) { return e.length > 0; });

      const self = this;
      candidates.forEach(function(email) {
        if (!self._isValidEmail(email)) {
          result.skipped++;
          return;
        }
        const wasSeeded = self._upsertDocenteByEmail(tab, [
          '', // Apellido (vacio — Nely o ella misma lo completan despues)
          '', // Nombre
          '', // DNI
          email,
          '', // Tipo
          'Activa',
          today,
          today,
          'Sembrada del onboarding (apellido/nombre vacios — completar a mano o via "Sumar docente")',
          Utilities.getUuid()
        ]);
        if (wasSeeded) result.seeded++;
        else result.skipped++;
      });
    }

    SetupLog.info('Siembra inicial Docentes OK', result);
    return result;
  },

  /**
   * _upsertDocenteByEmail — paso 4 plan v3.
   *
   * Append-only-if-not-exists para la pestaña '👥 Docentes'. Verifica si ya
   * existe una fila con el mismo email (col 4). Si existe: retorna false
   * (no append, no update — la siembra solo inicializa). Si no existe:
   * appendRow con la fila completa (10 columnas).
   *
   * fila: array de 10 valores en orden del schema:
   *   [Apellido, Nombre, DNI, Email, Tipo, Estado, Fecha alta, Fecha cambio, Notas, Token]
   *
   * Retorna: true si se appendió, false si ya existía (skip).
   *
   * Idempotencia: corrida dos veces de setupAll() NO duplica filas (fix Loop 3
   * hallazgo 4-A — siembra duplicada).
   */
  _upsertDocenteByEmail(tab, fila) {
    const targetEmail = String(fila[3] || '').trim().toLowerCase();
    if (!targetEmail) return false;

    const lastRow = tab.getLastRow();
    if (lastRow >= 3) {
      // Lee columna Email (col 4) desde row 3 hasta el final
      const emails = tab.getRange(3, 4, lastRow - 2, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0] || '').trim().toLowerCase() === targetEmail) {
          return false; // ya existe, skip
        }
      }
    }

    // No existe, appendRow con la fila completa (10 columnas)
    tab.appendRow(fila);
    return true;
  },

  /**
   * _isValidEmail — validación regex básica (mismo regex que el share).
   */
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  },

  _flushLogSafe(fallbackSpreadsheet) {
    try {
      SetupLog.flushTo(fallbackSpreadsheet);
    } catch (err) {
      console.log('WARN: no se pudo flushear log al sheet: ' + err);
    }
  },

  _printSummary(report) {
    console.log('');
    console.log('========== RESUMEN ==========');
    console.log('Fase: ' + report.phase);
    console.log('OK: ' + report.ok.length);
    console.log('Fallos: ' + report.failed.length);
    if (report.shared) {
      console.log('Share docentes: ' + report.shared.shared.length + ' editores agregados' +
        (report.shared.skipped.length ? ', ' + report.shared.skipped.length + ' skipeados' : ''));
    }
    console.log('');
    if (report.ok.length) {
      console.log('Forms listos:');
      report.ok.forEach(function(r) {
        console.log('  [' + r.id + '] ' + r.title + (r.created ? ' (nuevo)' : ' (reusado)'));
        console.log('    URL publica: ' + r.formUrl);
      });
    }
    if (report.failed.length) {
      console.log('');
      console.log('Forms que fallaron:');
      report.failed.forEach(function(r) {
        console.log('  [' + r.id + '] ' + r.title + ' — ' + r.error);
      });
      console.log('');
      console.log('Podes volver a correr setupAll() — es idempotente y solo reintentara los fallidos.');
    }
    console.log('==============================');
  }

};
