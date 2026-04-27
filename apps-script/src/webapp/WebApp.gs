/**
 * WebApp.gs — Fase 3a + 3b (plan v9, scope cut 2026-04-22)
 *
 * Ruteo doGet(e):
 *   - ?role=admin  -> PanelDirectora.html
 *   - (sin param)  -> PanelDocentes.html
 *
 * Scope implementado (Fase 3a + 3b):
 *   - Render mobile-first de ambos paneles con shadows/hover/active states.
 *   - Lee contexto de escuela desde CFG (Fase 1).
 *   - Arma URLs reales de forms + sheets desde Properties Registry
 *     (ya poblado por Fase 2 + Fase 2.5).
 *   - Lazy cache de URLs publicadas ('form-url:Fxx') para evitar N
 *     FormApp.openById por render.
 *   - QR inline en Panel Directora vía QuickChart.io (imagen real,
 *     no placeholder).
 *   - Cache de la URL self del web app en Properties ('webapp-url:teacher')
 *     para que TuPanelTabBuilder (invocado desde contexto no-web) la pueda
 *     leer — ScriptApp.getService().getUrl() solo funciona en doGet.
 *
 * Fuera de scope (cortado en cazada 2026-04-22, ver emergentes DAI):
 *   - PDF generator de 2 páginas — KITCHEN SINK, nadie lo pidió.
 *   - Email final con adjunto — reemplazado por pestaña 'Tu Panel' del Sheet.
 *   - deployWebApps() programático — no existe API usable al 2026. La
 *     directora hace deploy manual una vez (guiado en /ayuda Paso 0).
 *   - Wiring del botón "Regenerar sistema" con setupAll() (sigue stub).
 *   - Wiring del botón "Imprimir guía" (sigue stub).
 */

function doGet(e) {
  const role = (e && e.parameter && e.parameter.role) || '';
  const isAdmin = role === 'admin';
  const templateName = isAdmin ? 'src/webapp/PanelDirectora' : 'src/webapp/PanelDocentes';
  const template = HtmlService.createTemplateFromFile(templateName);
  template.ctx = WebApp._getContext(isAdmin);
  return template.evaluate()
    .setTitle('DAI — ' + (isAdmin ? 'Panel Directora' : 'Escuela'))
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Para que los templates incluyan otros archivos: <?!= include('webapp/Styles') ?>
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const FORM_ICONS = {
  F01: '📅', F02: '📝', F03: '👤', F04: '✅',
  F05: '📋', F06: '🎯', F07: '📣',
  F08: '👨‍👩‍👧', F09: '📢',
  F10: '💰', F11: '📋', F12: '🛒',
  F13: '🏛️', F14: '📁'
};

const PHASE_LABELS = {
  pedagogica:    { icon: '📚', label: 'Pedagógica' },
  institucional: { icon: '🏫', label: 'Institucional' },
  comunicacion:  { icon: '💬', label: 'Comunicación' },
  admin:         { icon: '📊', label: 'Administración' }
};

const PHASE_ORDER = ['pedagogica', 'institucional', 'comunicacion', 'admin'];

const WebApp = (function() {

  function _getContext(isAdmin) {
    const cfg = _readCfgSafe();
    const year = String(cfg.academic_year || '');
    const ctx = {
      schoolName: cfg.school_name || 'Escuela',
      year: year,
      location: cfg.location || '',
      directorName: cfg.director_name || '',
      isAdmin: isAdmin,
      helpUrl: 'https://proyectodai.com/ayuda',
      phaseOrder: PHASE_ORDER,
      phaseLabels: PHASE_LABELS
    };
    if (isAdmin) {
      ctx.sheetLinks = _getSheetLinks(year);
      ctx.panelDocentesUrl = _getSelfUrl();
      ctx.panelDocentesQrUrl = ctx.panelDocentesUrl
        ? 'https://quickchart.io/qr?text=' + encodeURIComponent(ctx.panelDocentesUrl) + '&size=240&margin=2&ecLevel=M'
        : '';
      ctx.onboardingFormUrl = _getOnboardingFormUrl();
      const totalForms = (typeof FORMS_CFG !== 'undefined' ? FORMS_CFG.length : 0);
      const activeForms = _filterByOnboardingFlags(typeof FORMS_CFG !== 'undefined' ? FORMS_CFG : []).length;
      ctx.cfgSummary = {
        formsActive: activeForms,
        formsTotal: totalForms,
        sectionCount: Number(cfg.section_count) || 5
      };
    } else {
      ctx.formsByPhase = _getFormsByPhase();
    }
    return ctx;
  }

  function _readCfgSafe() {
    try {
      if (typeof readConfigFromSheet === 'function') {
        return readConfigFromSheet() || {};
      }
    } catch (err) {
      Logger.log('[WebApp] _readCfgSafe fallback: ' + (err && err.message));
    }
    return {};
  }

  function _getSheetLinks(year) {
    if (typeof FORMS_CFG === 'undefined') return [];
    const formsToShow = _filterByOnboardingFlags(FORMS_CFG);
    return formsToShow.map(function(form) {
      const key = 'sheet:' + form.sheetName + '-' + year;
      const entry = PropertiesRegistry.get(key);
      const id = entry && entry.id;
      const exists = !!id;
      return {
        formId: form.id,
        title: form.title,
        url: exists ? ('https://docs.google.com/spreadsheets/d/' + id + '/edit') : '#',
        exists: exists
      };
    });
  }

  function _getFormsByPhase() {
    if (typeof FORMS_CFG === 'undefined') return {};
    const byPhase = {};
    PHASE_ORDER.forEach(function(p) { byPhase[p] = []; });
    const formsToShow = _filterByOnboardingFlags(FORMS_CFG);
    formsToShow.forEach(function(form) {
      const phase = byPhase[form.phase] ? form.phase : 'admin';
      byPhase[phase].push({
        formId: form.id,
        title: form.title,
        description: form.description || '',
        icon: FORM_ICONS[form.id] || '📝',
        url: _getPublicFormUrlCached(form.id)
      });
    });
    return byPhase;
  }

  // 2026-04-26: cooperadora invisible por default (decisión de scope: la maneja
  // la comisión de padres por afuera del sistema). Los paneles respetan el mismo
  // filtrado que setupAll() hace al crear los artefactos.
  function _filterByOnboardingFlags(formsCfg) {
    if (typeof PhaseFilter !== 'undefined' && PhaseFilter.filter) {
      return PhaseFilter.filter(formsCfg, 'all', {});
    }
    return formsCfg.slice();
  }

  // Lazy cache: primera llamada hace FormApp.openById + getPublishedUrl y guarda
  // la URL plana (no JSON) en Script Properties bajo 'form-url:Fxx'. Llamadas
  // siguientes leen directo del cache sin tocar FormApp.
  function _getPublicFormUrlCached(formId) {
    const props = PropertiesService.getScriptProperties();
    const cacheKey = 'form-url:' + formId;
    const cached = props.getProperty(cacheKey);
    if (cached) return cached;
    const entry = PropertiesRegistry.get('form:' + formId);
    const internalId = entry && entry.id;
    if (!internalId) return '#';
    try {
      const form = FormApp.openById(internalId);
      const url = form.getPublishedUrl();
      props.setProperty(cacheKey, url);
      return url;
    } catch (err) {
      Logger.log('[WebApp] _getPublicFormUrlCached ' + formId + ': ' + (err && err.message));
      return '#';
    }
  }

  function _getOnboardingFormUrl() {
    const props = PropertiesService.getScriptProperties();
    const cacheKey = 'form-url:F00';
    const cached = props.getProperty(cacheKey);
    if (cached) return cached;
    const entry = PropertiesRegistry.get('form:F00:onboarding');
    const internalId = entry && entry.id;
    if (!internalId) return '#';
    try {
      const form = FormApp.openById(internalId);
      const url = form.getPublishedUrl();
      props.setProperty(cacheKey, url);
      return url;
    } catch (err) {
      return '#';
    }
  }

  function _getSelfUrl() {
    try {
      const url = ScriptApp.getService().getUrl() || '';
      // Cache para contextos no-web (funciones manuales desde IDE, triggers programados).
      // ScriptApp.getService().getUrl() solo retorna URL dentro de un request web (doGet).
      // Al cachear acá, cualquier llamada posterior desde otro contexto (p.ej.
      // TuPanelTabBuilder invocado por regenerateTuPanelTab) puede leerla.
      if (url) {
        try {
          PropertiesService.getScriptProperties().setProperty('webapp-url:teacher', url);
        } catch (cacheErr) {
          // no-op: el cache es best-effort
        }
      }
      return url;
    } catch (err) {
      return '';
    }
  }

  return {
    _getContext: _getContext
  };
})();
