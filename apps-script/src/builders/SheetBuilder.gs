/**
 * SheetBuilder.gs — crea o reusa Google Sheets dentro de una carpeta destino.
 */

const SheetBuilder = {

  /**
   * Busca (registry -> search) o crea un Sheet dentro de parentFolder.
   * Retorna { spreadsheet, file, created }.
   */
  getOrCreate(parentFolder, name) {
    Guard.assertNonEmpty(name, 'name');
    const registryKey = 'sheet:' + name;

    const resolved = IdempotencyService.resolveByRegistryOrSearch(
      registryKey,
      function(id) { return DriveApp.getFileById(id); },
      function() { return IdempotencyService.findFileByMime(parentFolder, name, MimeType.GOOGLE_SHEETS); }
    );

    if (resolved.obj) {
      SetupLog.info('Sheet reusado (' + resolved.source + ')', { name: name });
      return {
        spreadsheet: SpreadsheetApp.openById(resolved.obj.getId()),
        file: resolved.obj,
        created: false
      };
    }

    // Crear nuevo Spreadsheet y moverlo al parent
    const spreadsheet = SpreadsheetApp.create(name);
    const file = DriveApp.getFileById(spreadsheet.getId());
    file.moveTo(parentFolder);
    PropertiesRegistry.set(registryKey, { id: file.getId(), type: 'sheet' });
    SetupLog.info('Sheet creado', { name: name, id: file.getId() });
    return { spreadsheet: spreadsheet, file: file, created: true };
  },

  /**
   * Asegura que exista una pestana con el nombre dado. Retorna la pestana.
   */
  getOrCreateTab(spreadsheet, tabName) {
    let sheet = spreadsheet.getSheetByName(tabName);
    if (sheet) return sheet;
    sheet = spreadsheet.insertSheet(tabName);
    return sheet;
  },

  /**
   * Borra la pestana 'Sheet1' / 'Hoja 1' default si existe y hay al menos otra pestana.
   * Lo usamos despues de crear pestanas custom para dejar limpio.
   */
  removeDefaultTabIfPossible(spreadsheet) {
    const candidates = ['Sheet1', 'Hoja 1', 'Hoja1'];
    if (spreadsheet.getSheets().length < 2) return;
    candidates.forEach(function(name) {
      const sheet = spreadsheet.getSheetByName(name);
      if (sheet && spreadsheet.getSheets().length > 1) {
        spreadsheet.deleteSheet(sheet);
      }
    });
  }

};
