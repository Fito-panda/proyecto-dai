/**
 * ConfigFolders.gs — arbol de carpetas dentro de <PARENT>/<YEAR>/.
 *
 * Estructura definida en Sistema-de-Formularios-Propuesta.md (16 abr 2026).
 * El builder recorre este arbol en orden y crea cada carpeta si no existe.
 *
 * folderPath en ConfigForms.gs referencia estas rutas (relativas a <YEAR>/).
 */

const FOLDERS_CFG = [
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
  ]},
  { path: '05-Administracion', children: [
    { path: 'Pre-carga-SGE' },
    { path: 'Legajos', children: [
      { path: 'Seccion-1' },
      { path: 'Seccion-2' },
      { path: 'Seccion-3' }
    ]}
  ]},
  { path: '06-Sheets-Maestros' },
  { path: '07-Formularios' },
  { path: '08-Archivo' }
];
