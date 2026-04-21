/**
 * ConfigFolders.gs — arbol de carpetas dentro de <PARENT>/<YEAR>/.
 *
 * Estructura definida en Sistema-de-Formularios-Propuesta.md (16 abr 2026).
 * El builder recorre este arbol en orden y crea cada carpeta si no existe.
 *
 * folderPath en ConfigForms.gs referencia estas rutas (relativas a <YEAR>/).
 *
 * R1 2026-04-21 (fix B1): las carpetas `Legajos/Seccion-N` ahora se generan
 * dinámicamente según CFG.SECTION_COUNT del onboarding. Antes estaban
 * hardcoded a Seccion-1/2/3 aunque la directora pusiera otro valor.
 *
 * API:
 *   - FOLDERS_CFG (const): estructura DEFAULT con 3 secciones hardcoded.
 *     Se usa como fallback cuando CFG no está disponible (ej. smoke tests
 *     que no corren en container-bound). Mantenido por back-compat.
 *   - getFoldersCfg(): función que retorna el árbol con secciones ajustadas
 *     a CFG.SECTION_COUNT (= respuesta del Form). SetupOrchestrator la usa.
 */

// ----------------------------------------------------------------------------
// Sub-trees estáticos (no dependen de CFG)
// ----------------------------------------------------------------------------

function _staticFolderSubtree() {
  return [
    { path: '01-Gestion-Pedagogica', children: [
      { path: 'Planificaciones' },
      { path: 'Registros-de-Clase' },
      { path: 'Seguimiento-Alumnos' },
      { path: 'Evaluaciones', children: [
        { path: 'Rubricas' },
        { path: 'Listas-de-Cotejo' },
        { path: 'Portafolios' }
      ]},
      { path: 'Proyecto-PIE', children: [
        { path: 'Etapa-Inicial' },
        { path: 'Etapa-Desarrollo' },
        { path: 'Etapa-Cierre' },
        { path: 'Evidencias-Proyecto-Especial' }
      ]}
    ]},
    { path: '02-Gestion-Institucional', children: [
      { path: 'Actas' },
      { path: 'PEI' },
      { path: 'PMI' },
      { path: 'Normativa' },
      { path: 'Novedades-Diarias' }
    ]},
    { path: '03-Comunicacion', children: [
      { path: 'Comunicados' },
      { path: 'Autorizaciones' },
      { path: 'Plantillas' }
    ]},
    { path: '04-Cooperadora', children: [
      { path: 'Actas-Cooperadora' },
      { path: 'Comprobantes' },
      { path: 'Solicitudes' },
      { path: 'Informes-Mensuales' }
    ]}
  ];
}

function _adminSubtreeWithSections(sectionCount) {
  const secciones = [];
  for (let i = 1; i <= sectionCount; i++) {
    secciones.push({ path: 'Seccion-' + i });
  }
  return { path: '05-Administracion', children: [
    { path: 'Pre-carga-SGE' },
    { path: 'Legajos', children: secciones }
  ]};
}

function _tailFolders() {
  return [
    { path: '06-Sheets-Maestros' },
    { path: '07-Formularios' },
    { path: '08-Archivo' }
  ];
}

// ----------------------------------------------------------------------------
// API principal — dinámica (preferida)
// ----------------------------------------------------------------------------

/**
 * getFoldersCfg() — retorna el árbol completo con `Legajos/Seccion-N` ajustado
 * según CFG.SECTION_COUNT del onboarding. Si CFG no está accesible, cae en
 * default 3 secciones con WARN en el log.
 *
 * Usado por SetupOrchestrator.run() (reemplaza al FOLDERS_CFG estático).
 */
function getFoldersCfg() {
  let sectionCount = 3; // default conservador
  try {
    const cfgValue = CFG.SECTION_COUNT;
    if (typeof cfgValue === 'number' && cfgValue > 0) {
      sectionCount = cfgValue;
    }
  } catch (err) {
    // CFG no accesible (no container-bound, pestaña no existe, etc.) → fallback.
    if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
      SetupLog.warn('getFoldersCfg: CFG.SECTION_COUNT no accesible, usando default 3', {
        err: String(err && err.message || err)
      });
    }
  }

  return _staticFolderSubtree()
    .concat([_adminSubtreeWithSections(sectionCount)])
    .concat(_tailFolders());
}

// ----------------------------------------------------------------------------
// Back-compat: FOLDERS_CFG estático con 3 secciones hardcoded
// ----------------------------------------------------------------------------
// Evaluado a load-time con default 3 (no toca CFG, no puede crashear).
// Se mantiene para código legacy que lo importe directamente y para tests
// que no corren en container-bound. SetupOrchestrator NO lo usa — usa
// getFoldersCfg().

const FOLDERS_CFG = _staticFolderSubtree()
  .concat([_adminSubtreeWithSections(3)])
  .concat(_tailFolders());
