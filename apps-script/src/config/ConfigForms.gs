/**
 * ConfigForms.gs — fuente unica de verdad para los 11 formularios productivos (F01-F09 + F13-F14) + F10/F11/F12 dormidos para forks que reactiven cooperadora.
 *
 * Convenciones:
 *   - id: codigo corto Fxx, unico. Usado como registry key.
 *   - phase: pedagogica | institucional | comunicacion | cooperadora | admin
 *   - folderPath: donde vive el FORM (siempre '07-Formularios' por convencion).
 *   - sheetName: nombre del Sheet destino (el builder le aplica sufijo -YYYY).
 *   - sheetFolderPath: donde vive el Sheet destino (siempre '06-Sheets-Maestros').
 *   - familyFacing: true -> el builder omite items FILE_UPLOAD (familias pueden no tener cuenta Google).
 *   - items[].type: uno de FIELD_TYPES.
 *   - items[].choices: array estatico de strings.
 *   - items[].choicesFromList: key del snapshot de listas maestras (docentes, alumnos, ...).
 *   - items[].folderPath: SOLO para FILE_UPLOAD — carpeta destino (relativa al YEAR).
 *   - items[].required: default false.
 *
 * Los items se aplican en el orden del array.
 */

function _generatePeriodosSemanales() {
  const meses = ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const out = [];
  meses.forEach(function(mes) {
    for (let i = 1; i <= 4; i++) out.push('Semana ' + i + ' ' + mes);
  });
  return out;
}
const PERIODOS_SEMANAL = _generatePeriodosSemanales();

const TURNOS_HORA = ['1ra hora', '2da hora', '3ra hora', '4ta hora', '5ta hora (JE)'];

const ETAPAS_PIE = [
  'Etapa Inicial (marzo)',
  'Etapa Desarrollo (abril-junio)',
  'Etapa Cierre (julio-agosto)'
];

const INDICADOR_AVANCE = ['No iniciado', 'En proceso', 'Avanzado', 'Completado'];

const PERIODOS_SGE = [
  'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  '1er Trimestre', '2do Trimestre', '3er Trimestre'
];

const FORMS_CFG = [

  // ============================================================
  // A. GESTION PEDAGOGICA
  // ============================================================

  {
    id: 'F01',
    phase: 'pedagogica',
    title: 'Planificacion semanal/quincenal',
    description: 'Completar al inicio del periodo. Menos de 3 minutos desde celular.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Planificaciones',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DROPDOWN', title: 'Docente', required: true, choicesFromList: 'docentes' },
      { type: 'DROPDOWN', title: 'Pareja pedagogica', choicesFromList: 'docentes_plus_sin' },
      { type: 'DROPDOWN', title: 'Periodo', required: true, choices: PERIODOS_SEMANAL },
      { type: 'DATE', title: 'Fecha inicio', required: true },
      { type: 'DATE', title: 'Fecha fin', required: true },
      { type: 'CHECKBOX', title: 'Seccion/es', required: true, choicesFromList: 'secciones' },
      { type: 'DROPDOWN', title: 'Espacio curricular', required: true, choicesFromList: 'espacios' },
      { type: 'DROPDOWN', title: 'Campo de formacion JE',
        choices: ['Ciencias', 'Literatura y TIC', 'Ingles', 'Ed. Fisica', 'Artes Visuales', 'No aplica'] },
      { type: 'PARAGRAPH', title: 'Contenido/progresion — Grado menor',
        helpText: 'Que contenido trabaja el grado mas bajo de la seccion' },
      { type: 'PARAGRAPH', title: 'Contenido/progresion — Grado mayor',
        helpText: 'Que contenido trabaja el grado mas alto' },
      { type: 'PARAGRAPH', title: 'Actividad comun (plurigrado)', required: true,
        helpText: 'La actividad que comparten ambos grados' },
      { type: 'PARAGRAPH', title: 'Actividad diferenciada — Grado menor' },
      { type: 'PARAGRAPH', title: 'Actividad diferenciada — Grado mayor' },
      { type: 'DROPDOWN', title: 'Vinculacion con PIE',
        choices: ['Si, directa', 'Si, indirecta', 'No aplica'] },
      { type: 'PARAGRAPH', title: 'Descripcion vinculacion PIE',
        helpText: 'Solo si respondio "Si" arriba' },
      { type: 'PARAGRAPH', title: 'Recursos necesarios',
        helpText: 'Materiales, tecnologia, espacio' },
      { type: 'CHECKBOX', title: 'Evaluacion prevista',
        choices: ['Rubrica', 'Lista de cotejo', 'Registro anecdotico',
                  'Cuestionario autoevaluativo', 'Portafolio', 'Otra'] },
      { type: 'PARAGRAPH', title: 'Observaciones' },
      { type: 'FILE_UPLOAD', title: 'Adjunto (opcional)',
        folderPath: '01-Gestion-Pedagogica/Planificaciones' }
    ]
  },

  {
    id: 'F02',
    phase: 'pedagogica',
    title: 'Registro de clase',
    description: 'Completar despues de cada clase. Reemplaza el Word compartido.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Registro-Clases',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DROPDOWN', title: 'Docente', required: true, choicesFromList: 'docentes' },
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Turno/hora', required: true, choices: TURNOS_HORA },
      { type: 'DROPDOWN', title: 'Seccion', required: true, choicesFromList: 'secciones' },
      { type: 'DROPDOWN', title: 'Espacio curricular', required: true, choicesFromList: 'espacios' },
      { type: 'PARAGRAPH', title: 'Que se trabajo hoy', required: true,
        helpText: 'Descripcion breve de lo que realmente paso' },
      { type: 'DROPDOWN', title: 'Se cumplio lo planificado',
        choices: ['Si, completo', 'Parcialmente', 'No, se modifico'] },
      { type: 'SHORT_TEXT', title: 'Motivo de modificacion',
        helpText: 'Solo si no se cumplio' },
      { type: 'SHORT_TEXT', title: 'Alumnos ausentes',
        helpText: 'Nombres o cantidad' },
      { type: 'PARAGRAPH', title: 'Observaciones relevantes',
        helpText: 'Incidentes, logros, dificultades' },
      { type: 'SHORT_TEXT', title: 'Recursos utilizados',
        helpText: 'Lo que efectivamente se uso' },
      { type: 'FILE_UPLOAD', title: 'Evidencia (foto/archivo)',
        folderPath: '01-Gestion-Pedagogica/Registros-de-Clase' }
    ]
  },

  {
    id: 'F03',
    phase: 'pedagogica',
    title: 'Seguimiento de alumno',
    description: 'Registrar cualquier observacion relevante sobre un alumno.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Seguimiento-Alumnos',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DROPDOWN', title: 'Docente que registra', required: true, choicesFromList: 'docentes' },
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Alumno/a', required: true, choicesFromList: 'alumnos' },
      { type: 'DROPDOWN', title: 'Seccion', choicesFromList: 'secciones' },
      { type: 'DROPDOWN', title: 'Tipo de registro', required: true,
        choices: ['Avance academico', 'Dificultad academica', 'Conducta positiva',
                  'Incidente conductual', 'Situacion familiar', 'Salud',
                  'Inasistencias reiteradas', 'Otro'] },
      { type: 'DROPDOWN', title: 'Espacio curricular relacionado', choicesFromList: 'espacios_plus_general' },
      { type: 'PARAGRAPH', title: 'Descripcion', required: true,
        helpText: 'Que paso, que se observo' },
      { type: 'PARAGRAPH', title: 'Accion tomada',
        helpText: 'Que se hizo o se va a hacer' },
      { type: 'DROPDOWN', title: 'Requiere seguimiento',
        choices: ['Si, urgente', 'Si, puede esperar', 'No, solo registro'] },
      { type: 'DROPDOWN', title: 'Se hablo con la familia',
        choices: ['Si', 'No', 'No corresponde'] },
      { type: 'FILE_UPLOAD', title: 'Evidencia (opcional)',
        folderPath: '01-Gestion-Pedagogica/Seguimiento-Alumnos' }
    ]
  },

  {
    id: 'F04',
    phase: 'pedagogica',
    title: 'Evaluacion formativa',
    description: 'Completar al cerrar una unidad, proyecto o instancia evaluativa.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Evaluaciones',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DROPDOWN', title: 'Docente', required: true, choicesFromList: 'docentes' },
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Seccion', required: true, choicesFromList: 'secciones' },
      { type: 'DROPDOWN', title: 'Espacio curricular', required: true, choicesFromList: 'espacios' },
      { type: 'SHORT_TEXT', title: 'Unidad/proyecto evaluado', required: true },
      { type: 'CHECKBOX', title: 'Instrumento usado', required: true,
        choices: ['Rubrica', 'Lista de cotejo', 'Registro anecdotico',
                  'Cuestionario autoevaluativo', 'Portafolio',
                  'Evaluacion escrita', 'Presentacion oral', 'Otro'] },
      { type: 'DROPDOWN', title: 'Vinculacion con PIE', choices: ['Si', 'No'] },
      { type: 'PARAGRAPH', title: 'Criterios evaluados',
        helpText: 'Que se evaluo (pegar de la rubrica o lista)' },
      { type: 'PARAGRAPH', title: 'Resultados generales — Grado menor' },
      { type: 'PARAGRAPH', title: 'Resultados generales — Grado mayor' },
      { type: 'SHORT_TEXT', title: 'Alumnos con desempeno destacado' },
      { type: 'SHORT_TEXT', title: 'Alumnos que necesitan refuerzo' },
      { type: 'PARAGRAPH', title: 'Ajustes para la proxima instancia',
        helpText: 'Que cambiarias' },
      { type: 'FILE_UPLOAD', title: 'Rubrica o instrumento (archivo)',
        folderPath: '01-Gestion-Pedagogica/Evaluaciones' }
    ]
  },

  // ============================================================
  // B. GESTION INSTITUCIONAL
  // ============================================================

  {
    id: 'F05',
    phase: 'institucional',
    title: 'Acta de reunion',
    description: 'Completar despues de cada reunion. Libro de actas digital.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Actas',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'SHORT_TEXT', title: 'Hora inicio', helpText: 'HH:MM' },
      { type: 'SHORT_TEXT', title: 'Hora fin', helpText: 'HH:MM' },
      { type: 'DROPDOWN', title: 'Tipo de reunion', required: true,
        choices: ['Reunion de personal', 'Reunion de area', 'Reunion con familias',
                  'Reunion con supervision', 'Reunion de pareja pedagogica', 'Otra'] },
      { type: 'SHORT_TEXT', title: 'Lugar',
        helpText: 'Ej: Salon principal, patio, virtual' },
      { type: 'DROPDOWN', title: 'Convocada por',
        choices: ['Directora (ejemplo)', 'Docente', 'Supervision'] },
      { type: 'CHECKBOX', title: 'Participantes', choicesFromList: 'docentes' },
      { type: 'SHORT_TEXT', title: 'Otros participantes',
        helpText: 'Familias, supervision, invitados externos' },
      { type: 'PARAGRAPH', title: 'Orden del dia', required: true },
      { type: 'PARAGRAPH', title: 'Desarrollo', required: true,
        helpText: 'Que se discutio, punto por punto' },
      { type: 'PARAGRAPH', title: 'Acuerdos/decisiones' },
      { type: 'SHORT_TEXT', title: 'Responsables de acuerdos' },
      { type: 'DATE', title: 'Fecha limite de acuerdos' },
      { type: 'PARAGRAPH', title: 'Observaciones' },
      { type: 'FILE_UPLOAD', title: 'Archivo adjunto',
        folderPath: '02-Gestion-Institucional/Actas',
        helpText: 'Foto del acta manuscrita u otro documento' }
    ]
  },

  {
    id: 'F06',
    phase: 'institucional',
    title: 'Registro de avance del PIE',
    description: 'Mensual o al cierre de cada etapa del PIE.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-PIE',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha de registro', required: true },
      { type: 'DROPDOWN', title: 'Etapa del PIE', required: true, choices: ETAPAS_PIE },
      { type: 'DROPDOWN', title: 'Quien registra', required: true, choicesFromList: 'docentes' },
      { type: 'PARAGRAPH', title: 'Objetivo del PIE trabajado',
        helpText: 'Cual de los objetivos del PIE se esta reportando' },
      { type: 'PARAGRAPH', title: 'Acciones realizadas en el periodo', required: true },
      { type: 'CHECKBOX', title: 'Espacios curriculares involucrados', choicesFromList: 'espacios' },
      { type: 'CHECKBOX', title: 'Secciones involucradas', choicesFromList: 'secciones' },
      { type: 'CHECKBOX', title: 'Docentes participantes', choicesFromList: 'docentes' },
      { type: 'DROPDOWN', title: 'Indicador de avance', required: true, choices: INDICADOR_AVANCE },
      { type: 'PARAGRAPH', title: 'Evidencias',
        helpText: 'Que evidencias existen (fotos, trabajos, registros)' },
      { type: 'FILE_UPLOAD', title: 'Archivos de evidencia',
        folderPath: '01-Gestion-Pedagogica/Proyecto-PIE' },
      { type: 'PARAGRAPH', title: 'Dificultades encontradas' },
      { type: 'PARAGRAPH', title: 'Ajustes propuestos',
        helpText: 'Que hay que cambiar para la proxima etapa' },
      { type: 'DROPDOWN', title: 'Vinculacion con "Proyecto Especial"',
        choices: ['Si, directa', 'Si, indirecta', 'No aplica'] }
    ]
  },

  {
    id: 'F07',
    phase: 'institucional',
    title: 'Novedades diarias',
    description: 'Una vez por dia, al abrir la escuela.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Novedades-Diarias',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Quien registra', required: true, choicesFromList: 'docentes' },
      { type: 'CHECKBOX', title: 'Asistencia docente', choicesFromList: 'docentes',
        helpText: 'Marcar los docentes PRESENTES' },
      { type: 'SHORT_TEXT', title: 'Docentes ausentes — motivo',
        helpText: 'Solo si hubo ausentes' },
      { type: 'SHORT_TEXT', title: 'Cantidad total de alumnos presentes' },
      { type: 'PARAGRAPH', title: 'Alumnos ausentes (nombres)' },
      { type: 'SHORT_TEXT', title: 'Novedades de infraestructura',
        helpText: 'Roturas, faltantes, etc. Solo si aplica' },
      { type: 'DROPDOWN', title: 'Novedades climaticas/acceso',
        choices: ['Normal', 'Lluvia leve', 'Lluvia fuerte', 'Nieve',
                  'Corte de camino', 'Corte de luz', 'Corte de internet'] },
      { type: 'SHORT_TEXT', title: 'Actividades especiales del dia',
        helpText: 'Salidas, visitas, actos, etc.' },
      { type: 'PARAGRAPH', title: 'Otras novedades' }
    ]
  },

  // ============================================================
  // C. COMUNICACION
  // ============================================================

  {
    id: 'F08',
    phase: 'comunicacion',
    title: 'Autorizacion para familias (plantilla)',
    description: 'Formulario plantilla. Crear una COPIA por actividad y prellenar la actividad + fecha antes de enviar.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Autorizaciones',
    sheetFolderPath: '06-Sheets-Maestros',
    familyFacing: true,
    items: [
      { type: 'DROPDOWN', title: 'Nombre del alumno/a', required: true, choicesFromList: 'alumnos' },
      { type: 'DROPDOWN', title: 'Seccion', choicesFromList: 'secciones' },
      { type: 'SHORT_TEXT', title: 'Nombre del padre/madre/tutor', required: true },
      { type: 'SHORT_TEXT', title: 'DNI del padre/madre/tutor', required: true },
      { type: 'SHORT_TEXT', title: 'Telefono de contacto', required: true },
      { type: 'SHORT_TEXT', title: 'Actividad',
        helpText: 'La escuela prellena este campo al copiar la plantilla' },
      { type: 'DATE', title: 'Fecha de la actividad' },
      { type: 'MULTIPLE_CHOICE', title: 'Autorizo la participacion', required: true,
        choices: ['Si, autorizo', 'No autorizo'] },
      { type: 'PARAGRAPH', title: 'Observaciones (alergias, medicacion, etc.)' },
      { type: 'SHORT_TEXT', title: 'Contacto de emergencia alternativo',
        helpText: 'Nombre y telefono' }
    ]
  },

  {
    id: 'F09',
    phase: 'comunicacion',
    title: 'Comunicado / Circular',
    description: 'Registro interno de cada comunicado emitido.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Comunicados',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Emitido por', required: true,
        choices: ['Directora (ejemplo)', 'Docente'] },
      { type: 'CHECKBOX', title: 'Destinatarios', required: true,
        choices: ['Todas las familias', 'Seccion 1', 'Seccion 2', 'Seccion 3',
                  'Docentes'] },
      { type: 'SHORT_TEXT', title: 'Asunto', required: true,
        helpText: 'Titulo del comunicado' },
      { type: 'DROPDOWN', title: 'Tipo', required: true,
        choices: ['Informativo', 'Solicitud', 'Recordatorio', 'Convocatoria', 'Urgente'] },
      { type: 'PARAGRAPH', title: 'Contenido del comunicado', required: true },
      { type: 'DROPDOWN', title: 'Requiere respuesta/confirmacion',
        choices: ['Si', 'No'] },
      { type: 'DATE', title: 'Fecha limite de respuesta',
        helpText: 'Solo si requiere respuesta' },
      { type: 'FILE_UPLOAD', title: 'Archivo adjunto',
        folderPath: '03-Comunicacion/Comunicados' },
      { type: 'CHECKBOX', title: 'Canal de envio',
        choices: ['WhatsApp', 'Email', 'Cuaderno de comunicaciones', 'Cartelera'] }
    ]
  },

  // ============================================================
  // D. COOPERADORA ESCOLAR
  // ============================================================

  {
    id: 'F10',
    phase: 'cooperadora',
    title: 'Ingreso / Egreso de fondos (cooperadora)',
    description: 'Cada movimiento de dinero. Libro de caja digital.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Caja-Cooperadora',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'MULTIPLE_CHOICE', title: 'Tipo de movimiento', required: true,
        choices: ['Ingreso', 'Egreso'] },
      { type: 'DROPDOWN', title: 'Categoria', required: true,
        choices: [
          'Ingreso — Cuota cooperadora',
          'Ingreso — Evento/actividad',
          'Ingreso — Donacion',
          'Ingreso — Subsidio',
          'Ingreso — Venta',
          'Ingreso — Otro',
          'Egreso — Material didactico',
          'Egreso — Mantenimiento',
          'Egreso — Evento',
          'Egreso — Servicio',
          'Egreso — Insumos',
          'Egreso — Otro'
        ] },
      { type: 'SHORT_TEXT', title: 'Descripcion', required: true,
        helpText: 'Detalle del movimiento' },
      { type: 'SHORT_TEXT', title: 'Monto (pesos)', required: true },
      { type: 'DROPDOWN', title: 'Medio de pago',
        choices: ['Efectivo', 'Transferencia', 'Otro'] },
      { type: 'FILE_UPLOAD', title: 'Comprobante (foto/PDF)',
        folderPath: '04-Cooperadora/Comprobantes' },
      { type: 'SHORT_TEXT', title: 'Nro de comprobante' },
      { type: 'SHORT_TEXT', title: 'Registrado por', required: true,
        helpText: 'Nombre del miembro de cooperadora' },
      { type: 'SHORT_TEXT', title: 'Aprobado por',
        helpText: 'Nombre de quien autorizo (para egresos)' },
      { type: 'SHORT_TEXT', title: 'Observaciones' }
    ]
  },

  {
    id: 'F11',
    phase: 'cooperadora',
    title: 'Acta de reunion de cooperadora',
    description: 'Completar despues de cada reunion de cooperadora.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Actas-Cooperadora',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'SHORT_TEXT', title: 'Hora inicio' },
      { type: 'SHORT_TEXT', title: 'Hora fin' },
      { type: 'DROPDOWN', title: 'Tipo de reunion', required: true,
        choices: ['Ordinaria', 'Extraordinaria', 'Asamblea'] },
      { type: 'SHORT_TEXT', title: 'Lugar' },
      { type: 'SHORT_TEXT', title: 'Cantidad de asistentes', required: true },
      { type: 'PARAGRAPH', title: 'Nombres de asistentes' },
      { type: 'DROPDOWN', title: 'Quorum', choices: ['Si', 'No'] },
      { type: 'PARAGRAPH', title: 'Orden del dia', required: true },
      { type: 'PARAGRAPH', title: 'Desarrollo', required: true },
      { type: 'PARAGRAPH', title: 'Mociones y votaciones',
        helpText: 'Si hubo votacion: que se voto, resultado' },
      { type: 'PARAGRAPH', title: 'Acuerdos/resoluciones' },
      { type: 'SHORT_TEXT', title: 'Responsables' },
      { type: 'DATE', title: 'Proxima reunion', helpText: 'Fecha tentativa' },
      { type: 'FILE_UPLOAD', title: 'Archivo adjunto',
        folderPath: '04-Cooperadora/Actas-Cooperadora' }
    ]
  },

  {
    id: 'F12',
    phase: 'cooperadora',
    title: 'Solicitud de compra / gasto',
    description: 'Cualquier miembro o docente que necesite algo de cooperadora.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Solicitudes-Cooperadora',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha de solicitud', required: true },
      { type: 'SHORT_TEXT', title: 'Solicitado por', required: true },
      { type: 'DROPDOWN', title: 'Rol',
        choices: ['Docente', 'Directora', 'Miembro cooperadora', 'Otro'] },
      { type: 'SHORT_TEXT', title: 'Que se necesita', required: true,
        helpText: 'Descripcion del bien o servicio' },
      { type: 'PARAGRAPH', title: 'Para que', required: true,
        helpText: 'Justificacion' },
      { type: 'DROPDOWN', title: 'Urgencia', required: true,
        choices: ['Urgente (esta semana)', 'Normal (este mes)', 'Puede esperar'] },
      { type: 'SHORT_TEXT', title: 'Monto estimado',
        helpText: 'Si se sabe' },
      { type: 'SHORT_TEXT', title: 'Proveedor sugerido' },
      { type: 'FILE_UPLOAD', title: 'Presupuesto adjunto',
        folderPath: '04-Cooperadora/Solicitudes' }
    ]
  },

  // ============================================================
  // E. ADMINISTRACION
  // ============================================================

  {
    id: 'F13',
    phase: 'admin',
    title: 'Pre-carga para SGE',
    description: 'Staging manual de datos que despues se cargan al SGE provincial.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Precarga-SGE',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha de pre-carga', required: true },
      { type: 'DROPDOWN', title: 'Tipo de dato', required: true,
        choices: ['Asistencia mensual', 'Calificaciones', 'Datos de alumno nuevo',
                  'Actualizacion de datos', 'Legajo', 'Otro'] },
      { type: 'DROPDOWN', title: 'Seccion', choicesFromList: 'secciones_plus_todas' },
      { type: 'DROPDOWN', title: 'Periodo', choices: PERIODOS_SGE },
      { type: 'PARAGRAPH', title: 'Datos a cargar', required: true,
        helpText: 'Descripcion o listado de lo que hay que subir' },
      { type: 'FILE_UPLOAD', title: 'Archivo con datos',
        folderPath: '05-Administracion/Pre-carga-SGE' },
      { type: 'DROPDOWN', title: 'Preparado por', required: true, choicesFromList: 'docentes' },
      { type: 'SHORT_TEXT', title: 'Observaciones' }
    ]
  },

  {
    id: 'F14',
    phase: 'admin',
    title: 'Legajo interno',
    description: 'Ingreso, actualizacion o preparacion de legajo de alumno.',
    folderPath: '07-Formularios',
    sheetName: 'SHEET-Legajos',
    sheetFolderPath: '06-Sheets-Maestros',
    items: [
      { type: 'DATE', title: 'Fecha', required: true },
      { type: 'DROPDOWN', title: 'Alumno/a', required: true, choicesFromList: 'alumnos' },
      { type: 'SHORT_TEXT', title: 'Nombre completo (si es nuevo ingreso)',
        helpText: 'Solo completar si arriba elegiste "Nuevo ingreso" o el alumno no aparece' },
      { type: 'SHORT_TEXT', title: 'DNI' },
      { type: 'DROPDOWN', title: 'Seccion', choicesFromList: 'secciones' },
      { type: 'DROPDOWN', title: 'Tipo de documento', required: true,
        choices: ['DNI (frente y dorso)', 'Partida de nacimiento', 'CVAC', 'CUS',
                  'Ficha de inscripcion', 'Certificado de alumno regular',
                  'Boletin anterior', 'Informe psicopedagogico',
                  'Certificado medico', 'Otro'] },
      { type: 'FILE_UPLOAD', title: 'Archivo',
        folderPath: '05-Administracion/Legajos',
        helpText: 'Foto o PDF del documento' },
      { type: 'DROPDOWN', title: 'Estado',
        choices: ['Borrador', 'Revisado', 'Listo para SGE', 'Subido a SGE'] },
      { type: 'SHORT_TEXT', title: 'Observaciones' },
      { type: 'DROPDOWN', title: 'Registrado por', required: true, choicesFromList: 'docentes' }
    ]
  }

];
