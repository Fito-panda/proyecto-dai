/**
 * WebApp.gs — Fase 3a (plan v9)
 *
 * Ruteo doGet(e):
 *   - ?role=admin  -> PanelDirectora.html
 *   - (sin param)  -> PanelDocentes.html
 *
 * Scope Fase 3a (explícito):
 *   - Render mobile-first de ambos paneles.
 *   - Lee contexto de escuela desde CFG (Fase 1).
 *   - Arma URLs reales de forms + sheets desde Properties Registry
 *     (ya poblado por Fase 2 + Fase 2.5 — no hace falta hardcodear).
 *   - Lazy cache de URLs publicadas para evitar N FormApp.openById por render.
 *
 * Fuera de scope Fase 3a (queda para 3b):
 *   - deployWebApps() helper.
 *   - QR generator real (por ahora placeholder).
 *   - sendFinalEmail() + PDF (Capa 3 del plan v9).
 *   - Wiring del botón "Regenerar sistema" con setupAll() (botón existe, stub).
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
  cooperadora:   { icon: '🤝', label: 'Cooperadora' },
  admin:         { icon: '📊', label: 'Administración' }
};

const PHASE_ORDER = ['pedagogica', 'institucional', 'comunicacion', 'cooperadora', 'admin'];

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
      ctx.onboardingFormUrl = _getOnboardingFormUrl();
      const totalForms = (typeof FORMS_CFG !== 'undefined' ? FORMS_CFG.length : 0);
      const activeForms = _filterByOnboardingFlags(typeof FORMS_CFG !== 'undefined' ? FORMS_CFG : []).length;
      ctx.cfgSummary = {
        formsActive: activeForms,
        formsTotal: totalForms,
        sectionCount: Number(cfg.section_count) || 5,
        cooperadoraActive: _parseBool(cfg.cooperadora_activa)
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

  function _parseBool(v) {
    if (v === true) return true;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'si' || s === 'sí' || s === 'yes' || s === 'true' || s === '1';
    }
    return false;
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

  // Aplica PhaseFilter con los flags leídos del onboarding (cooperadora_activa, etc.)
  // para que los paneles respeten el mismo filtrado que setupAll() hace al crear los
  // artefactos. Si cooperadora_activa=false, los 3 forms de cooperadora no aparecen.
  function _filterByOnboardingFlags(formsCfg) {
    const cfg = _readCfgSafe();
    const flags = { cooperadora_activa: _parseBool(cfg.cooperadora_activa) };
    if (typeof PhaseFilter !== 'undefined' && PhaseFilter.filter) {
      return PhaseFilter.filter(formsCfg, 'all', flags);
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
      return ScriptApp.getService().getUrl() || '';
    } catch (err) {
      return '';
    }
  }

  return {
    _getContext: _getContext
  };
})();
