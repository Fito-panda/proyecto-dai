/**
 * TuPanelTabBuilder.gs — crea/actualiza pestaña "📱 Cómo entrar" en el Sheet
 * container-bound del Apps Script.
 *
 * Modelo C (sesión 5 chunk G 2026-05-01): UNA URL única común a toda la
 * escuela (sin tokens personalizados, sin URLs por docente). Cualquier
 * docente Activa o Licencia entra con SU mail logueado en Chrome.
 *
 * Lugar canónico de descubrimiento de la URL para cuando la directora no
 * compartió el link via WhatsApp (Cazada H estructural anti-SPOF: la
 * pestaña sobrevive a la persona — cualquier docente Activa con acceso al
 * yearFolder Drive puede abrir el Sheet y ver la URL).
 *
 * Sesión 5 chunk G:
 *   - Pestaña renombrada de "🚀 Tu Panel" a "📱 Cómo entrar".
 *   - Migración no destructiva: si existe pestaña con nombre viejo, se
 *     renombra en lugar de crear nueva.
 *   - Eliminado _getDirectorToken (TokenService eliminado en chunk E).
 *   - Eliminada lógica de URL admin con token.
 *   - Texto reescrito para reflejar modelo "todas pares" + nota cuenta dueña.
 *
 * Idempotente: re-run pisa contenido existente.
 *
 * Contract:
 *   TuPanelTabBuilder.ensure(spreadsheet)
 *     → { created: boolean, updated: boolean, renamed: boolean, tabName: string, hasUrl: boolean }
 */

const TuPanelTabBuilder = {

  TAB_NAME: '📱 Cómo entrar',
  TAB_NAME_LEGACY: '🚀 Tu Panel',
  HELP_URL: 'https://proyectodai.com/ayuda',

  ensure(spreadsheet) {
    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!spreadsheet) {
      throw new Error('TuPanelTabBuilder.ensure: no hay spreadsheet activo.');
    }

    const teacherUrl = this._getTeacherUrl();
    const adminUrl = teacherUrl ? (teacherUrl + '?role=admin') : '';
    const hasUrl = !!teacherUrl;

    let sheet = spreadsheet.getSheetByName(this.TAB_NAME);
    let renamed = false;

    // Sesión 5 chunk G: migración no destructiva. Si existe pestaña con
    // nombre viejo "🚀 Tu Panel", renombrarla en lugar de crear nueva.
    if (!sheet) {
      const oldSheet = spreadsheet.getSheetByName(this.TAB_NAME_LEGACY);
      if (oldSheet) {
        oldSheet.setName(this.TAB_NAME);
        sheet = oldSheet;
        renamed = true;
      }
    }

    const created = !sheet;
    if (created) {
      sheet = spreadsheet.insertSheet(this.TAB_NAME);
    } else {
      // Pisamos contenido previo sin borrar la pestaña (idempotencia)
      sheet.clear();
    }

    const lines = this._buildBannerLines(adminUrl, teacherUrl, hasUrl);
    const range = sheet.getRange(1, 1, lines.length, 1);
    range.setValues(lines.map(function(l) { return [l]; }));
    range.setWrap(true);

    // Formato: row 1 = título grande bold, resto texto normal
    sheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    sheet.setColumnWidth(1, 720);

    // Ocultamos resto de columnas vacías para que se vea limpio
    try {
      const maxCols = sheet.getMaxColumns();
      if (maxCols > 1) {
        sheet.hideColumns(2, maxCols - 1);
      }
    } catch (err) {
      // no-op si ya están ocultas
    }

    // Movemos la pestaña al principio (después de "👋 Arranque" si existe)
    try {
      spreadsheet.setActiveSheet(sheet);
      const arranque = spreadsheet.getSheetByName('👋 Arranque');
      const targetIndex = arranque ? (arranque.getIndex() + 1) : 2;
      spreadsheet.moveActiveSheet(targetIndex);
    } catch (err) {
      // no-op
    }

    if (typeof SetupLog !== 'undefined' && SetupLog.info) {
      SetupLog.info('TuPanelTabBuilder.ensure ' + (created ? 'created' : (renamed ? 'renamed+updated' : 'updated')), {
        tab: this.TAB_NAME,
        renamed: renamed,
        hasUrl: hasUrl
      });
    }

    return {
      created: created,
      updated: !created,
      renamed: renamed,
      tabName: this.TAB_NAME,
      hasUrl: hasUrl
    };
  },

  _getTeacherUrl() {
    // 1er intento: cache que WebApp._getSelfUrl guarda en doGet (única fuente
    // confiable en contextos no-web como ejecuciones manuales desde el IDE).
    try {
      const cached = PropertiesService.getScriptProperties().getProperty('webapp-url:teacher');
      if (cached) return cached;
    } catch (err) {
      // no-op: fallback al getUrl() directo
    }
    // 2do intento: ScriptApp.getService().getUrl() — funciona solo dentro de
    // request web (doGet). En funciones manuales del IDE retorna null.
    try {
      return ScriptApp.getService().getUrl() || '';
    } catch (err) {
      return '';
    }
  },

  _buildBannerLines(adminUrl, teacherUrl, hasUrl) {
    const sep = '──────────────────────────────────────────────';

    if (!hasUrl) {
      return [
        'CÓMO ENTRAR AL PANEL',
        '',
        'El web app todavía no está publicado. Esto es el paso manual de 30 segundos que hay que hacer una sola vez.',
        '',
        sep,
        '',
        'CÓMO PUBLICAR TU PANEL',
        '',
        '1. En este mismo archivo: menú Extensiones → Apps Script.',
        '2. Arriba a la derecha: Implementar → Nueva implementación.',
        '3. Tipo: Aplicación web. "Ejecutar como": Usuario que accede a la aplicación web. "Quién tiene acceso": Cualquier usuario con cuenta de Google.',
        '4. Click Implementar. Autorizá los permisos (aparece una pantalla amarilla — es normal, clickeá "Configuración avanzada" → "Ir a (no seguro)" → "Permitir").',
        '5. Volvé a este archivo. En el menú DAI: "Refrescar Tu Panel" → listo.',
        '',
        sep,
        '',
        'Dudas paso a paso (con video de 1 minuto): ' + this.HELP_URL
      ];
    }

    return [
      'CÓMO ENTRAR AL PANEL',
      '',
      'Para administrar tu escuela desde el celular, entrá a este link con tu mail de la escuela ya registrado:',
      '',
      sep,
      '',
      'PANEL ADMIN  (todas las docentes registradas Activa o Licencia)',
      '',
      adminUrl,
      '',
      'Guardá este link en favoritos del celular. La primera vez te va a pedir login Google y permisos — aceptá.',
      '',
      'Cualquier docente registrada puede operar el panel: sumar docentes nuevas, marcar licencias, dar de baja. No hay roles privilegiados — todas son pares.',
      '',
      sep,
      '',
      'PANEL PARA TODAS LAS DOCENTES  (sin login, público)',
      '',
      teacherUrl,
      '',
      'Imprimí el QR de esta URL desde el panel admin (botón "Imprimir QR para sala docentes") y pegalo en sala de docentes.',
      '',
      sep,
      '',
      '¿NO TE DEJA ENTRAR AL PANEL ADMIN?',
      '',
      'Significa que tu mail no está cargado en la lista de docentes. Pediselo a cualquier compañera Activa (directora, vicedirectora, otra docente registrada) — desde el panel pueden sumarte con el botón "+ Sumar nueva docente".',
      '',
      sep,
      '',
      'NOTA SOBRE LA CUENTA DUEÑA DEL SISTEMA',
      '',
      'Esta escuela tiene su sistema en una cuenta Google institucional (la que usaste para configurar todo al principio). Cuidá la contraseña como cuenta bancaria — compartila solo con 2-3 personas de máxima confianza (directora + vicedirectora + secretaria). Si alguna vez la directora se va, esas personas siguen pudiendo entrar al panel y operar sin esperar transferencias. Esa cuenta institucional NO tiene poderes especiales en el panel — entra como cualquier docente Activa, pero garantiza la continuidad operativa de la escuela.',
      '',
      sep,
      '',
      'Dudas paso a paso (con video): ' + this.HELP_URL
    ];
  }
};
