/**
 * FolderBuilder.gs — crea la estructura de carpetas de Drive.
 *
 * Entrada: CFG.PARENT_FOLDER_NAME ('Escuela') debe existir a mano en My Drive de quien corre.
 * Salida: Map path-relativo-al-YEAR -> Folder. Ej: folders['07-Formularios'] = <Folder>
 *
 * Keys del Map usan '/' como separador para nested (ej '01-Gestion-Pedagogica/Evaluaciones/Rubricas').
 * El year folder queda bajo la key vacia '' y tambien como '<YEAR>' para conveniencia.
 */

const FolderBuilder = {

  /**
   * Busca 'Escuela' en My Drive del usuario corriente. Si hay multiples, agarra la primera.
   * Si no existe, la crea y advierte.
   */
  ensureParentFolder() {
    const name = CFG.PARENT_FOLDER_NAME;
    const iter = DriveApp.getRootFolder().getFoldersByName(name);
    if (iter.hasNext()) {
      const folder = iter.next();
      SetupLog.info('Parent folder encontrado', { name: name, id: folder.getId() });
      PropertiesRegistry.set('folder:' + name, { id: folder.getId(), type: 'folder' });
      return folder;
    }
    // fallback: crear si no existe
    SetupLog.warn('Parent folder "' + name + '" no existe en My Drive. Creandola.');
    const created = DriveApp.getRootFolder().createFolder(name);
    PropertiesRegistry.set('folder:' + name, { id: created.getId(), type: 'folder' });
    return created;
  },

  /**
   * Crea (o reusa) <PARENT>/<YEAR>/ y retorna el folder.
   */
  ensureYearFolder(parentFolder) {
    const year = yearFolderName();
    return this._getOrCreateSubfolder(parentFolder, year, 'folder:' + year);
  },

  /**
   * Recorre FOLDERS_CFG recursivamente bajo yearFolder.
   * Retorna un Map<string, Folder> con paths relativos al YEAR.
   */
  buildTree(yearFolder, treeCfg) {
    const folders = {};
    folders[''] = yearFolder;
    folders[yearFolderName()] = yearFolder;
    this._buildRecursive(yearFolder, treeCfg || FOLDERS_CFG, '', folders);
    return folders;
  },

  _buildRecursive(parentFolder, nodes, parentPath, accum) {
    const self = this;
    nodes.forEach(function(node) {
      const relativePath = parentPath ? (parentPath + '/' + node.path) : node.path;
      const registryKey = 'folder:' + yearFolderName() + '/' + relativePath;
      const folder = self._getOrCreateSubfolder(parentFolder, node.path, registryKey);
      accum[relativePath] = folder;
      if (node.children && node.children.length) {
        self._buildRecursive(folder, node.children, relativePath, accum);
      }
    });
  },

  _getOrCreateSubfolder(parent, name, registryKey) {
    const resolved = IdempotencyService.resolveByRegistryOrSearch(
      registryKey,
      function(id) { return DriveApp.getFolderById(id); },
      function() { return IdempotencyService.findFolder(parent, name); }
    );
    if (resolved.obj) {
      SetupLog.info('Folder reusada (' + resolved.source + ')', { name: name });
      return resolved.obj;
    }
    const created = parent.createFolder(name);
    PropertiesRegistry.set(registryKey, { id: created.getId(), type: 'folder' });
    SetupLog.info('Folder creada', { name: name, id: created.getId() });
    return created;
  },

  /**
   * Helper para resolver un path-string relativo al YEAR contra el map ya construido.
   * Lanza si no existe — caller deberia haber corrido buildTree primero.
   */
  resolvePath(folders, relativePath) {
    Guard.assert(folders && folders[relativePath], 'Folder no encontrada para path: ' + relativePath);
    return folders[relativePath];
  }

};
