/**
 * SetupOrchestrator.gs — coordina el orden completo:
 *
 *   1. ensureParentFolder  (aborta si falla)
 *   2. ensureYearFolder    (aborta si falla)
 *   3. buildFolderTree     (aborta si falla)
 *   4. buildListasMaestras (aborta si falla)
 *   5. ensureDashboard     (continue-on-error)
 *   6. por cada form de la fase: build (continue-on-error)
 *   7. flush log a SHEET-Setup-Log
 *
 * Retorna { ok: [...], failed: [...], skipped: [...] }.
 */

const SetupOrchestrator = {

  run(phase) {
    phase = phase || PHASES.ALL;
    SetupLog.reset();
    SetupLog.info('===== setupAll iniciando =====', { phase: phase, timestamp: new Date().toISOString() });

    const report = { phase: phase, ok: [], failed: [], skipped: [] };

    // 1-3: fundaciones (abort-on-error)
    let ctx = null;
    try {
      const parent = FolderBuilder.ensureParentFolder();
      const yearFolder = FolderBuilder.ensureYearFolder(parent);
      const folders = FolderBuilder.buildTree(yearFolder, FOLDERS_CFG);
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
    const queue = PhaseFilter.filter(FORMS_CFG, phase);
    SetupLog.info('Forms a procesar en esta fase: ' + queue.length, {
      ids: queue.map(function(f) { return f.id; })
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

    // 7. flush log
    this._flushLogSafe(ctx.masterListsSpreadsheet);

    SetupLog.info('===== setupAll completo =====', {
      ok: report.ok.length,
      failed: report.failed.length
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
