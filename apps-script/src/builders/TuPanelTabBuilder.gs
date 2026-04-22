/**
 * TuPanelTabBuilder.gs — crea/actualiza pestaña "🚀 Tu Panel" en el Sheet
 * container-bound del Apps Script.
 *
 * Fase 3b.1 del plan v9 (scope reducido post-cazada 2026-04-22: reemplaza el
 * email final del plan v9 original; los 2 URLs del panel se entregan en esta
 * pestaña, visible siempre que la directora abra su Sheet).
 *
 * Contenido de la pestaña:
 *   - Row 1: título bold 14pt.
 *   - Rows 3+: banner narrative con los 2 URLs + instrucciones.
 *
 * Idempotente: re-run pisa contenido existente de la pestaña (para refrescar
 * URLs si el deploy cambió). No duplica pestañas.
 *
 * Contract:
 *   TuPanelTabBuilder.ensure(spreadsheet)
 *     → { created: boolean, updated: boolean, tabName: string, hasUrl: boolean }
 */

const TuPanelTabBuilder = {

  TAB_NAME: '🚀 Tu Panel',
  HELP_URL: 'https://proyectodai.com/ayuda',

  ensure(spreadsheet) {
    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!spreadsheet) {
      throw new Error('TuPanelTabBuilder.ensure: no hay spreadsheet activo.');
    }

    const adminUrl = this._getAdminUrl();
    const teacherUrl = this._getTeacherUrl();
    const hasUrl = !!teacherUrl;

    let sheet = spreadsheet.getSheetByName(this.TAB_NAME);
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
      SetupLog.info('TuPanelTabBuilder.ensure ' + (created ? 'created' : 'updated'), {
        tab: this.TAB_NAME,
        hasUrl: hasUrl
      });
    }

    return {
      created: created,
      updated: !created,
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

  _getAdminUrl() {
    const base = this._getTeacherUrl();
    return base ? (base + '?role=admin') : '';
  },

  _buildBannerLines(adminUrl, teacherUrl, hasUrl) {
    const sep = '──────────────────────────────────────────────';

    if (!hasUrl) {
      return [
        'TU PANEL',
        '',
        'Tu Panel todavía no está publicado. Esto es el paso manual de 30 segundos que hay que hacer una sola vez.',
        '',
        sep,
        '',
        'CÓMO PUBLICAR TU PANEL',
        '',
        '1. En este mismo archivo: menú Extensiones → Apps Script.',
        '2. Arriba a la derecha: Implementar → Nueva implementación.',
        '3. Seleccioná "Aplicación web". "Ejecutar como: Yo". "Quién tiene acceso: Cualquiera".',
        '4. Click Implementar. Autorizá los permisos (aparece una pantalla roja — es normal, clickeá "Configuración avanzada" → "Ir a (no seguro)" → Permitir).',
        '5. Volvé a este archivo. En la pestaña DAI del menú: "Refrescar Tu Panel" → listo.',
        '',
        sep,
        '',
        'Dudas paso a paso (con video de 1 minuto): ' + this.HELP_URL
      ];
    }

    return [
      'TU PANEL',
      '',
      'Acá tenés los 2 links que usás todo el año. Guardá esta pestaña.',
      '',
      sep,
      '',
      'TU PANEL PRIVADO  (solo vos)',
      '',
      adminUrl,
      '',
      'Guardalo en favoritos del celular. Desde ahí ves el estado del sistema, tus respuestas de cada formulario, y regenerás si hace falta.',
      '',
      sep,
      '',
      'PANEL PARA LAS MAESTRAS',
      '',
      teacherUrl,
      '',
      'CÓMO COMPARTIRLO CON LAS MAESTRAS:',
      '',
      '1. Tocá el link "Tu panel privado" de arriba.',
      '2. Bajá hasta la sección "Panel para las maestras".',
      '3. Tocá el botón verde "Copiar link para WhatsApp".',
      '4. Abrí WhatsApp y pegalo en el grupo de docentes.',
      '',
      sep,
      '',
      'Dudas: ' + this.HELP_URL
    ];
  }
};
