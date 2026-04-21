/**
 * ConfigDocTemplates.gs — mapping de Forms formales → templates Google Docs.
 * Fase 2.5 del plan v9 implementada 2026-04-21 por FORJA2 (modo autónomo).
 *
 * Responsabilidad:
 *   Fuente de verdad ÚNICA de qué Forms del ciclo tienen generación
 *   automática de Google Doc al recibir respuesta. DocGenerator lee de acá
 *   para saber qué template usar + dónde guardar el Doc copia.
 *
 * Criterio de inclusión:
 *   Son los 9 Forms "formales" del ciclo escolar — los que la directora o
 *   cooperadora necesitan imprimir + firmar + archivar en papel (por
 *   reglamento ministerial). Los 5 restantes (F01-F04 pedagógicos + F07
 *   novedades diarias) NO generan doc — se quedan solo como datos en Sheet.
 *
 * Shape por entrada:
 *   formId:            'Fxx' — key del mapping (mirror de FORMS_CFG en ConfigForms.gs).
 *   registryKey:       'docTemplate:Fxx' — clave en PropertiesRegistry donde
 *                      DocTemplateBuilder guarda el templateDocId tras crear.
 *   outputFolderPath:  path relativo al YEAR donde guardar los Docs generados.
 *                      Coincide con la carpeta FILE_UPLOAD del form correspondiente.
 *   docNamePattern:    nombre del Doc copia. `{timestamp}` es sustituido por
 *                      fecha formateada. Otros placeholders no se sustituyen acá
 *                      (DocGenerator solo hace timestamp en el nombre).
 *   templateTitle:     título human-readable del template (usado al crear
 *                      el Google Doc template por primera vez).
 *   description:       descripción corta del tipo de documento (para logs).
 *
 * Agregar un nuevo form:
 *   1. Agregar entrada acá con los 5 campos.
 *   2. Agregar función _buildTemplateFxx() en DocTemplateBuilder.gs.
 *   3. Re-correr buildAllDocTemplates() (idempotent: solo crea los nuevos).
 *   4. Agregar Fxx al array FORMAL_FORM_IDS de FormalFormsTriggerManager.gs.
 *   5. Re-correr installFormalFormTriggers() (idempotent).
 */

const DOC_TEMPLATES = {

  // ============================================================
  // B. GESTION INSTITUCIONAL — 1 form formal
  // ============================================================

  F05: {
    registryKey: 'docTemplate:F05',
    outputFolderPath: '02-Gestion-Institucional/Actas',
    docNamePattern: 'Acta-{timestamp}',
    templateTitle: 'DAI-Template-F05-Acta-Reunion',
    description: 'Acta de reunión institucional'
  },

  // ============================================================
  // A. GESTION PEDAGOGICA — 1 form formal (PIE)
  // ============================================================

  F06: {
    registryKey: 'docTemplate:F06',
    outputFolderPath: '01-Gestion-Pedagogica/Proyecto-PIE',
    docNamePattern: 'Registro-Avance-PIE-{timestamp}',
    templateTitle: 'DAI-Template-F06-Registro-PIE',
    description: 'Registro de avance del Proyecto PIE (mensual o cierre etapa)'
  },

  // ============================================================
  // C. COMUNICACION — 2 forms formales
  // ============================================================

  F08: {
    registryKey: 'docTemplate:F08',
    outputFolderPath: '03-Comunicacion/Autorizaciones',
    docNamePattern: 'Autorizacion-{timestamp}',
    templateTitle: 'DAI-Template-F08-Autorizacion-Familia',
    description: 'Autorización para familias (por actividad)'
  },

  F09: {
    registryKey: 'docTemplate:F09',
    outputFolderPath: '03-Comunicacion/Comunicados',
    docNamePattern: 'Comunicado-{timestamp}',
    templateTitle: 'DAI-Template-F09-Comunicado',
    description: 'Comunicado / Circular institucional'
  },

  // ============================================================
  // D. COOPERADORA — 3 forms formales
  // ============================================================

  F10: {
    registryKey: 'docTemplate:F10',
    outputFolderPath: '04-Cooperadora/Comprobantes',
    docNamePattern: 'Movimiento-Caja-{timestamp}',
    templateTitle: 'DAI-Template-F10-Movimiento-Cooperadora',
    description: 'Comprobante de ingreso / egreso de caja cooperadora'
  },

  F11: {
    registryKey: 'docTemplate:F11',
    outputFolderPath: '04-Cooperadora/Actas-Cooperadora',
    docNamePattern: 'Acta-Cooperadora-{timestamp}',
    templateTitle: 'DAI-Template-F11-Acta-Cooperadora',
    description: 'Acta de reunión de Cooperadora escolar'
  },

  F12: {
    registryKey: 'docTemplate:F12',
    outputFolderPath: '04-Cooperadora/Solicitudes',
    docNamePattern: 'Solicitud-Compra-{timestamp}',
    templateTitle: 'DAI-Template-F12-Solicitud-Compra',
    description: 'Solicitud de compra / gasto a Cooperadora'
  },

  // ============================================================
  // E. ADMINISTRACION — 2 forms formales
  // ============================================================

  F13: {
    registryKey: 'docTemplate:F13',
    outputFolderPath: '05-Administracion/Pre-carga-SGE',
    docNamePattern: 'Pre-carga-SGE-{timestamp}',
    templateTitle: 'DAI-Template-F13-Precarga-SGE',
    description: 'Pre-carga de datos para SGE (imprimible)'
  },

  F14: {
    registryKey: 'docTemplate:F14',
    outputFolderPath: '05-Administracion/Legajos',
    docNamePattern: 'Legajo-{timestamp}',
    templateTitle: 'DAI-Template-F14-Legajo',
    description: 'Ficha de legajo digital de alumno'
  }

};

/**
 * DOC_TEMPLATE_FORM_IDS — array de formIds que tienen doc template configurado.
 * Lo usa FormalFormsTriggerManager para iterar en installFormalFormTriggers().
 */
const DOC_TEMPLATE_FORM_IDS = Object.keys(DOC_TEMPLATES);

/**
 * TEMPLATES_ROOT_FOLDER_NAME — nombre de la carpeta en root de Drive de
 * `driveproyectodai@gmail.com` donde viven los 9 templates Google Docs.
 * DocTemplateBuilder la crea al correr buildAllDocTemplates().
 *
 * Convención: v1 sufijado. Si a futuro hay cambios structural en los templates,
 * se bumpearía a v2 con nueva carpeta, sin pisar los v1 (back-compat histórico).
 */
const TEMPLATES_ROOT_FOLDER_NAME = 'DAI-Templates-Docs-v1';
