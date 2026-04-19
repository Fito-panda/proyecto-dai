/**
 * PropertiesRegistry.gs — wrapper sobre PropertiesService.getScriptProperties().
 * Guarda el mapeo artifact-key -> {id, type, createdAt} para lookup O(1) en re-runs.
 *
 * Keys tipicos:
 *   'folder:Escuela'
 *   'folder:2026'
 *   'folder:2026/07-Formularios'
 *   'sheet:SHEET-Planificaciones-2026'
 *   'form:F01'
 */

const PropertiesRegistry = {

  _store: null,

  _getStore() {
    if (!this._store) this._store = PropertiesService.getScriptProperties();
    return this._store;
  },

  get(key) {
    const raw = this._getStore().getProperty(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  },

  set(key, value) {
    Guard.assertNonEmpty(key, 'key');
    const payload = Object.assign({}, value, { updatedAt: new Date().toISOString() });
    this._getStore().setProperty(key, JSON.stringify(payload));
    return payload;
  },

  remove(key) {
    this._getStore().deleteProperty(key);
  },

  /**
   * Borra todas las entradas del registry. Util para reset manual.
   * No borra los artifacts en Drive — solo el indice.
   */
  wipe() {
    this._getStore().deleteAllProperties();
  },

  all() {
    const props = this._getStore().getProperties();
    const result = {};
    Object.keys(props).forEach(function(key) {
      try {
        result[key] = JSON.parse(props[key]);
      } catch (err) {
        result[key] = props[key];
      }
    });
    return result;
  }

};
