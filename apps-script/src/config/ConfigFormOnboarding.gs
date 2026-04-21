/**
 * ConfigFormOnboarding.gs — schema del Form de onboarding DAI.
 * Fase 2 del plan v9 implementada 2026-04-20 por FORJA2.
 *
 * Este Form es ESPECIAL — no es parte de los 14 Forms del ciclo escolar
 * (FORMS_CFG en ConfigForms.gs). Se ejecuta una sola vez al inicio del año:
 *   1. La directora abre el Sheet container-bound (copia del Template).
 *   2. Lee la pestaña '👋 Arranque' que tiene el link a este Form.
 *   3. Llena este Form (~3 min).
 *   4. Al enviar: el trigger onFormSubmit escribe a '_respuestas_config' y
 *      ejecuta setupAll() automáticamente.
 *
 * Arquitectura de nombres de campos:
 *   - Los `title` de los items son keys TÉCNICAS en snake_case (ej: 'school_name').
 *   - Esos titles se usan DIRECTAMENTE como headers de columna en
 *     '_respuestas_config' (Google Forms crea el header con el title literal).
 *   - readConfigFromSheet() (ConfigRoot.gs) busca headers por esos nombres exactos.
 *   - La legibilidad para la directora se entrega vía `helpText` con ejemplos.
 *   - Si a futuro se quieren titles user-friendly, habrá que agregar un aliasMap
 *     en readConfigFromSheet. Decisión registrada como deuda técnica D5.
 *
 * Coherencia con CFG_REQUIRED_KEYS (ConfigRoot.gs):
 *   Los 3 items con title ∈ {'school_name', 'academic_year', 'location'} DEBEN
 *   estar marcados required y presentes en este schema. Son el contrato de Fase 1.
 */

const ONBOARDING_FORM_CFG = {

  id: 'F00',
  phase: 'onboarding',
  title: 'DAI — Onboarding de la escuela',
  description: 'Completá una vez al inicio del año (menos de 3 minutos). Al enviar este formulario se configura automáticamente todo el sistema DAI: carpetas Drive, los 14 formularios del ciclo, y share con los docentes. Podés editar respuestas después si algo cambia.',

  // folderPath: NO aplica — este Form vive linkeado al Sheet container-bound,
  // no dentro de la carpeta 07-Formularios del ciclo.
  //
  // sheetName: NO aplica — las respuestas van a la pestaña '_respuestas_config'
  // del mismo Sheet container-bound (FormOnboardingBuilder la renombra).

  items: [

    // ========================================================================
    // A. Identidad de la escuela (required — contrato con CFG_REQUIRED_KEYS)
    // ========================================================================

    {
      type: 'SHORT_TEXT',
      title: 'school_name',
      required: true,
      helpText: 'Nombre oficial de la escuela. Ej: "Escuela Rural N° 123 - Bartolome Mitre".'
    },
    {
      type: 'SHORT_TEXT',
      title: 'academic_year',
      required: true,
      helpText: 'Año lectivo. Ej: 2026. Solo el número, 4 dígitos.'
    },
    {
      type: 'SHORT_TEXT',
      title: 'location',
      required: true,
      helpText: 'Ciudad y provincia. Ej: "Capilla del Monte, Córdoba".'
    },

    // ========================================================================
    // B. Directora (datos de contacto + SGE)
    // ========================================================================

    {
      type: 'SHORT_TEXT',
      title: 'director_name',
      required: true,
      helpText: 'Nombre completo de la directora (o director).'
    },
    {
      type: 'SHORT_TEXT',
      title: 'director_email',
      required: true,
      helpText: 'Email de contacto. Se usa para notificaciones del sistema y como editor default de la carpeta Drive.'
    },
    {
      type: 'SHORT_TEXT',
      title: 'director_cuil',
      helpText: 'CUIL (opcional hoy, recomendado). Lo usa Fase 3 para pre-carga en SGE. Formato: 20-12345678-9.'
    },

    // ========================================================================
    // C. Estructura operativa de la escuela
    // ========================================================================

    {
      type: 'MULTIPLE_CHOICE',
      title: 'turno',
      required: true,
      choices: [
        'JUE Modelo A (5 horas)',
        'JUE Modelo B (6 horas)',
        'Tradicional (4 horas)',
        'Otro'
      ],
      helpText: 'Turno/jornada del año lectivo. JUE = Jornada Única Extendida (TransFORMAR@cba). Modelo A = 5h, Modelo B = 6h.'
    },
    {
      type: 'SHORT_TEXT',
      title: 'section_count',
      required: true,
      helpText: 'Cantidad total de secciones (grupos/grados) de la escuela. Solo el número. Ej: 3.'
    },

    // ========================================================================
    // D. Espacios curriculares del PCI (checkbox pre-poblado)
    // ========================================================================

    {
      type: 'CHECKBOX',
      title: 'espacios_curriculares',
      required: true,
      choices: [
        'Lengua',
        'Matematica',
        'Ciencias Sociales',
        'Ciencias Naturales',
        'Ingles',
        'Educacion Fisica',
        'Educacion Artistica - Plastica',
        'Educacion Artistica - Musica',
        'Tecnologia / Informatica',
        'Formacion Etica y Ciudadana / ESI',
        'Catequesis / Religion (electivo)'
      ],
      helpText: 'Marcá los espacios que se dictan en tu escuela según el PCI 2026 Córdoba. Podés marcar varios. En Fase 2.5 se cargan los defaults completos del destilado PCI+PIE.'
    },

    // ========================================================================
    // E. Share automático (emails de docentes para compartir Drive)
    // ========================================================================

    {
      type: 'PARAGRAPH',
      title: 'teacher_emails',
      required: true,
      helpText: 'Emails de docentes que van a tener acceso editor a la carpeta Drive. UNO POR LINEA. Ej:\nana@escuela.com\nbeatriz@gmail.com\ncarlos@escuela.com'
    },

    // ========================================================================
    // F. Cooperadora (condiciona creación de Forms F10-F12)
    // ========================================================================

    {
      type: 'MULTIPLE_CHOICE',
      title: 'cooperadora_activa',
      required: true,
      choices: ['Si', 'No'],
      helpText: '¿La escuela tiene Cooperadora activa este año? Si respondés "Si", setupAll crea los Forms F10-F12 (caja, actas, solicitudes). Si "No", los omite.'
    },

    // ========================================================================
    // G. PEI (opcional)
    // ========================================================================

    {
      type: 'MULTIPLE_CHOICE',
      title: 'pei_activo',
      choices: ['Si', 'No'],
      helpText: 'Opcional. ¿La escuela tiene PEI (Plan Educativo Institucional) vigente? Si respondés "Si", cargá el link en la pestaña 📖 del Sheet después del onboarding.'
    },

    // ========================================================================
    // H. Observaciones libres
    // ========================================================================

    {
      type: 'PARAGRAPH',
      title: 'observations',
      helpText: 'Opcional. Particularidades del plan, electivos no listados, decisiones pedagógicas especiales, etc. Fito las revisa para ajustes de Fase 2.5+.'
    },

    // ========================================================================
    // I. Confirmación final (controla si trigger ejecuta setupAll)
    // ========================================================================

    {
      type: 'MULTIPLE_CHOICE',
      title: 'confirm_generate',
      required: true,
      choices: [
        'Si, generá todo ahora',
        'No, solo guardá la config (corro setupAll después manualmente)'
      ],
      helpText: 'Si elegís "Si", al enviar este form se ejecuta setupAll() automáticamente (crea carpetas Drive, los 14 Forms del ciclo, y share con docentes). Si elegís "No", los datos quedan guardados en _respuestas_config pero setupAll NO corre — podés ejecutarlo manualmente después desde el IDE.'
    }

  ]

};

// ============================================================================
// Utilidad exportada: validar que el schema incluye las keys obligatorias
// del contrato con ConfigRoot (defensa contra drift futuro).
// ============================================================================

/**
 * _validateOnboardingSchemaCoherence() — chequea en tiempo de carga que los
 * required keys de CFG_REQUIRED_KEYS existan como items required en
 * ONBOARDING_FORM_CFG. Si falta alguno, tira Error al instante.
 * Se ejecuta automáticamente al cargar el script.
 */
function _validateOnboardingSchemaCoherence() {
  const titles = ONBOARDING_FORM_CFG.items.map(function(it) { return it.title; });
  const requiredTitles = ONBOARDING_FORM_CFG.items
    .filter(function(it) { return it.required; })
    .map(function(it) { return it.title; });

  CFG_REQUIRED_KEYS.forEach(function(key) {
    if (titles.indexOf(key) === -1) {
      throw new Error(
        'ConfigFormOnboarding.gs: falta item con title "' + key + '" ' +
        '(requerido por CFG_REQUIRED_KEYS en ConfigRoot.gs).'
      );
    }
    if (requiredTitles.indexOf(key) === -1) {
      throw new Error(
        'ConfigFormOnboarding.gs: item "' + key + '" existe pero no está marcado required.' +
        ' CFG_REQUIRED_KEYS obliga a que sea required.'
      );
    }
  });
}
