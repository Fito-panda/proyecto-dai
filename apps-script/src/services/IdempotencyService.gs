/**
 * IdempotencyService.gs — capa doble para evitar duplicados:
 *   1. PropertiesRegistry (O(1) lookup por cfg.id)
 *   2. Drive search por nombre dentro del parent (fallback reconciliador)
 *
 * Si el registry apunta a un id que ya no existe (borrado manual), cae al search.
 * Si el search encuentra, re-registra y devuelve. Si no, el caller crea.
 */

const IdempotencyService = {

  /**
   * Intenta recuperar una carpeta por (parentFolder, name). null si no existe.
   */
  findFolder(parentFolder, name) {
    Guard.assertNonEmpty(name, 'name');
    const iter = parentFolder.getFoldersByName(name);
    return iter.hasNext() ? iter.next() : null;
  },

  /**
   * Intenta recuperar un archivo por (parentFolder, name, mimeType).
   */
  findFileByMime(parentFolder, name, mimeType) {
    Guard.assertNonEmpty(name, 'name');
    const iter = parentFolder.getFilesByName(name);
    while (iter.hasNext()) {
      const file = iter.next();
      if (!mimeType || file.getMimeType() === mimeType) return file;
    }
    return null;
  },

  /**
   * Trata de abrir un artifact por id guardado en Properties.
   * Retorna null si el id no existe o fue borrado.
   */
  tryOpenById(id, opener) {
    if (!id) return null;
    try {
      return opener(id);
    } catch (err) {
      return null;
    }
  },

  /**
   * Flow estandar: registry -> fallback search -> null.
   * El caller decide que hacer si retorna null (crear).
   */
  resolveByRegistryOrSearch(registryKey, opener, searchFn) {
    const entry = PropertiesRegistry.get(registryKey);
    if (entry && entry.id) {
      const obj = this.tryOpenById(entry.id, opener);
      if (obj) return { obj: obj, source: 'registry' };
    }
    const found = searchFn();
    if (found) {
      PropertiesRegistry.set(registryKey, { id: found.getId(), type: entry ? entry.type : undefined });
      return { obj: found, source: 'search' };
    }
    return { obj: null, source: 'none' };
  }

};
