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
    // R1 fix B3 (=D7): PhaseFilter recibe onboardingFlags. Si cooperadora_activa=false,
    // omite F10-F12. Valor viene de CFG.COOPERADORA_ACTIVA (parsed "Si"/"No" → boolean).
    const onboardingFlags = {
      cooperadora_activa: CFG.COOPERADORA_ACTIVA
    };
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

    // 6.5 share automatico a emails docentes declarados en onboarding (Fase 2, continue-on-error)
    try {
      report.shared = this._shareYearFolderWithTeachers(ctx.yearFolder);
    } catch (err) {
      SetupLog.warn('Share automatico fallo — continuando', { err: String(err) });
      report.shared = { shared: [], skipped: [], reason: 'error', error: String(err) };
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
   * _shareYearFolderWithTeachers — agrega como editors al yearFolder los
   * emails listados en el campo teacher_emails de _respuestas_config (Fase 2).
   *
   * Parsing: el campo PARAGRAPH del Form se guarda como string con saltos de
   * linea. Acepto separadores \n, coma, punto y coma. Valido formato email
   * básico antes de addEditor.
   *
   * Retorna: { shared: [emails], skipped: [{email, error}], reason: string|null }.
   */
  _shareYearFolderWithTeachers(yearFolder) {
    let rawConfig;
    try {
      rawConfig = readConfigFromSheet();
    } catch (err) {
      SetupLog.warn('Share automatico: no se pudo leer _respuestas_config, skipeado', {
        err: String(err)
      });
      return { shared: [], skipped: [], reason: 'no-config' };
    }

    const raw = String(rawConfig.teacher_emails || '').trim();
    if (!raw) {
      SetupLog.info('Share automatico: teacher_emails vacio, nada que compartir');
      return { shared: [], skipped: [], reason: 'empty' };
    }

    // Parse: split \n, coma, ; — trim, filter vacios
    const candidates = raw.split(/[\n,;]+/)
      .map(function(e) { return e.trim(); })
      .filter(function(e) { return e.length > 0; });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = candidates.filter(function(e) { return emailRegex.test(e); });
    const invalid = candidates.filter(function(e) { return !emailRegex.test(e); });

    if (invalid.length) {
      SetupLog.warn('Emails con formato invalido, skipeados', { emails: invalid });
    }

    const result = {
      shared: [],
      skipped: invalid.map(function(e) { return { email: e, error: 'invalid-format' }; }),
      reason: null
    };

    valid.forEach(function(email) {
      try {
        yearFolder.addEditor(email);
        result.shared.push(email);
        SetupLog.info('Share a docente OK', { email: email });
      } catch (err) {
        result.skipped.push({ email: email, error: String(err) });
        SetupLog.warn('Share fallo para email', { email: email, err: String(err) });
      }
    });

    SetupLog.info('Share automatico terminado', {
      shared: result.shared.length,
      skipped: result.skipped.length,
      totalCandidates: candidates.length
    });

    return result;
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
