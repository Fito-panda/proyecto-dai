/**
 * Logger.gs — log a consola del IDE + acumula en memoria para volcar al final a SHEET-Setup-Log.
 * No pisa el Logger nativo de Apps Script; se llama SetupLog.
 */

const SetupLog = {

  _entries: [],

  info(msg, meta) {
    this._push('INFO', msg, meta);
  },

  warn(msg, meta) {
    this._push('WARN', msg, meta);
  },

  error(msg, meta) {
    this._push('ERROR', msg, meta);
  },

  _push(level, msg, meta) {
    const entry = {
      ts: new Date().toISOString(),
      level: level,
      message: msg,
      meta: meta ? JSON.stringify(meta) : ''
    };
    this._entries.push(entry);
    // espejo en consola del IDE
    console.log('[' + level + '] ' + msg + (meta ? ' ' + entry.meta : ''));
  },

  entries() {
    return this._entries.slice();
  },

  reset() {
    this._entries = [];
  },

  /**
   * Vuelca las entries a un Sheet. Crea pestana nueva por corrida (timestamp)
   * y rota: mantiene solo las ultimas MAX_LOG_TABS para que el spreadsheet no crezca sin limite.
   */
  flushTo(spreadsheet) {
    if (!spreadsheet) return;
    const MAX_LOG_TABS = 5;
    const tabName = 'Log-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Rotacion: borrar logs viejos antes de insertar el nuevo
    const oldLogs = spreadsheet.getSheets()
      .filter(function(s) { return s.getName().indexOf('Log-') === 0; })
      .sort(function(a, b) { return a.getName().localeCompare(b.getName()); });
    while (oldLogs.length >= MAX_LOG_TABS) {
      const toRemove = oldLogs.shift();
      spreadsheet.deleteSheet(toRemove);
    }

    const sheet = spreadsheet.insertSheet(tabName);
    sheet.appendRow(['Timestamp', 'Level', 'Message', 'Meta']);
    this._entries.forEach(function(e) {
      sheet.appendRow([e.ts, e.level, e.message, e.meta]);
    });
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 4);
  }

};
