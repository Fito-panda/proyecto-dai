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

// ============================================================================
// Helpers top-level paso 17.1 plan v3 baja/suplentes-docente (2026-04-30).
// Definidos en scope global (NO dentro del IIFE WebApp) para que las funciones
// globales `getEquipoDocenteForPanel`, `submitOperativoFromPanel`, etc. los
// puedan invocar. Prefix `_` por convención de privacidad.
// ============================================================================

function _dateToIso(d) {
  if (!d) return '';
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
  return '';
}

function _normalizeNombre(s) {
  return String(s || '').normalize('NFC').trim();
}

function _normalizeEmail(s) {
  return String(s || '').toLowerCase().trim();
}

/**
 * _readEquipoDocente — lee 👥 Docentes con whitelist de columnas y agrupa
 * por Estado. Whitelist crítico (SPOF 29 bloqueante): NUNCA exponer col 9
 * (Notas) ni col 10 (Token) al frontend.
 *
 * Retorna: { activas: [...], licencia: [...], bajas: [...] }
 * Cada item: { apellido, nombre, email, tipo, estado, fechaAlta_iso, fechaCambio_iso }
 */
function _readEquipoDocente() {
  const ss = TemplateResolver.resolve('👥 Docentes');
  if (!ss) return { activas: [], licencia: [], bajas: [] };
  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) return { activas: [], licencia: [], bajas: [] };

  const lastRow = tab.getLastRow();
  if (lastRow < 3) return { activas: [], licencia: [], bajas: [] };

  // Lee SOLO cols 1-8 (Apellido, Nombre, DNI, Email, Tipo, Estado, FechaAlta,
  // FechaCambio). NO col 9 (Notas) ni col 10 (Token). SPOF 29 bloqueante de
  // seguridad: el token de cada docente da acceso al PanelDirectora con su
  // identidad. Si filtra al HTML del browser, cualquiera con DevTools en
  // celular de la directora ve los tokens de TODAS las docentes.
  const range = tab.getRange(3, 1, lastRow - 2, 8).getValues();

  const result = { activas: [], licencia: [], bajas: [] };
  for (let i = 0; i < range.length; i++) {
    const row = range[i];
    const apellido = String(row[0] || '').trim();
    const nombre = String(row[1] || '').trim();
    const email = String(row[3] || '').trim();
    if (!apellido && !nombre && !email) continue;

    // SPOF 8: Estado vacío default a 'Activa' defensive.
    const estadoRaw = String(row[5] || '').trim();
    const estado = estadoRaw || 'Activa';

    const docente = {
      apellido: apellido,
      nombre: nombre,
      email: email,
      tipo: String(row[4] || '').trim(),
      estado: estado,
      fechaAlta_iso: _dateToIso(row[6]),
      fechaCambio_iso: _dateToIso(row[7])
      // dni intencionalmente omitido (privacidad innecesaria al frontend).
      // notas intencionalmente omitido (col 9, no necesario).
      // token intencionalmente omitido (col 10, SPOF 29 bloqueante).
    };

    const bucket = estado === 'Activa' ? 'activas'
                 : estado === 'Licencia' ? 'licencia'
                 : 'bajas';
    result[bucket].push(docente);
  }
  return result;
}

/**
 * _getDeployVersionCached — extrae deploy ID del web app URL para que el
 * cliente detecte cache stale del HTML servido (SPOF 36). Si Apps Script
 * deploya nueva versión y el browser de la directora cachea el HTML viejo
 * por horas, el cliente puede comparar este valor contra getDeployVersion()
 * y avisar "hay versión nueva, recargá".
 *
 * SPOF 42 fix: SOLO cachear si tenemos URL real del web app (match exitoso
 * del regex). Si la función se invoca standalone desde IDE,
 * ScriptApp.getService().getUrl() retorna vacío y caemos al fallback
 * timestamp — pero NO cacheamos para no contaminar producción.
 */
function _getDeployVersionCached() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('webapp:deployVersion');
  if (cached) return cached;
  try {
    const url = ScriptApp.getService().getUrl() || '';
    const match = url.match(/\/s\/([^/]+)\//);
    if (match) {
      // Tenemos URL real (contexto doGet o post-deploy). Cacheamos.
      const version = match[1].slice(0, 12);
      props.setProperty('webapp:deployVersion', version);
      return version;
    }
    // Standalone IDE u otro contexto sin URL deployada. Fallback timestamp,
    // NO cachear para evitar contaminar.
    return Date.now().toString();
  } catch (err) {
    return 'unknown';
  }
}

/**
 * _resetDeployVersionCache — helper para limpiar el cache si quedó contaminado
 * con un valor incorrecto (ej. timestamp por invocación standalone pre-fix
 * SPOF 42). Invocar manualmente desde el editor cuando haga falta.
 */
function _resetDeployVersionCache() {
  PropertiesService.getScriptProperties().deleteProperty('webapp:deployVersion');
  return 'cache webapp:deployVersion limpiado';
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const role = params.role || '';
  const isAdmin = role === 'admin';

  // Paso 6 plan v3 (2026-04-27): rama admin requiere ?token= valido contra
  // 👥 Docentes via TokenService.validate. Si no autorizado: render
  // PanelInvalido. Si autorizado: PanelDirectora con saludo personalizado.
  // PanelDocentes (sin role=admin) sigue siendo Anyone-with-link sin auth.
  if (isAdmin) {
    const token = String(params.token || '').trim();
    const auth = (typeof TokenService !== 'undefined' && TokenService.validate)
      ? TokenService.validate(token)
      : { authorized: false, docente: null, reason: 'tokenservice-unavailable' };

    if (!auth.authorized) {
      const tmpl = HtmlService.createTemplateFromFile('src/webapp/PanelInvalido');
      tmpl.reason = auth.reason;
      tmpl.docente = auth.docente; // null o {apellido,nombre,email,estado}
      return tmpl.evaluate()
        .setTitle('DAI — Acceso no disponible')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    // Autorizado: PanelDirectora con ctx extendido
    const template = HtmlService.createTemplateFromFile('src/webapp/PanelDirectora');
    template.ctx = WebApp._getContext(true);
    template.ctx.tokenAuth = auth; // {authorized:true, docente:{...}, reason:null}
    // greetingName: nombre primero, fallback apellido, fallback ctx.directorName
    template.ctx.greetingName = auth.docente.nombre
      || auth.docente.apellido
      || template.ctx.directorName
      || template.ctx.schoolName;
    return template.evaluate()
      .setTitle('DAI — Panel Directora')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Default: PanelDocentes (sin auth, mismo comportamiento previo)
  const template = HtmlService.createTemplateFromFile('src/webapp/PanelDocentes');
  template.ctx = WebApp._getContext(false);
  return template.evaluate()
    .setTitle('DAI — Escuela')
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
      // Paso 8 plan v3: forms operativos (phase='operativa') NO se cuentan
      // como "formularios del ciclo escolar" — son del Panel Directora, no
      // del flujo pedagogico/institucional/etc del Panel Docentes.
      const docenteForms = (typeof FORMS_CFG !== 'undefined' ? FORMS_CFG : []).filter(function(f) {
        return PHASE_ORDER.indexOf(f.phase) !== -1;
      });
      const totalForms = docenteForms.length;
      const activeForms = _filterByOnboardingFlags(docenteForms).length;
      ctx.cfgSummary = {
        formsActive: activeForms,
        formsTotal: totalForms,
        sectionCount: Number(cfg.section_count) || 5
      };
      // Paso 17.1 plan v3 (2026-04-30): cargar equipo docente para sección
      // "Equipo Docente" del PanelDirectora. Whitelist en _readEquipoDocente
      // garantiza que token (col 10) NO viaja al frontend (SPOF 29 bloqueante).
      ctx.equipo = _readEquipoDocente();
      ctx.deployVersion = _getDeployVersionCached();
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
      // Paso 8 plan v3: phase='operativa' (forms baja/suplentes del Panel
      // Directora) NO aparecen en el Panel Docentes — solo phases
      // pedagogica/institucional/comunicacion/admin van a los 14 botones.
      if (PHASE_ORDER.indexOf(form.phase) === -1) return;
      byPhase[form.phase].push({
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

// ============================================================================
// Funciones globales paso 17.1 plan v3 baja/suplentes-docente (2026-04-30).
// Invocables desde PanelDirectora.html via google.script.run.X(args).
//
// Endpoints expuestos:
//   - getEquipoDocenteForPanel()        — refresh on-demand del equipo.
//   - submitOperativoFromPanel(accion, email) — invoca handler operativo.
//   - submitSumarFromPanel(payload)     — invoca handleSumarDocente.
//   - getDeployVersion()                — version del deploy actual.
//
// Reglas:
//   - LockService.getDocumentLock().tryLock(5000) en read y mutates (SPOF 32).
//   - Re-lookup post-handler retorna docente actualizada (SPOF 3).
//   - try/catch granular: si refreshDocentes embedded falla pero estado aplicó,
//     retornar warnings:['handler_partial'] en lugar de error (SPOF 25).
//   - OperacionesLog.info('panel-action', {...}) en cada invocación (SPOF 35).
//   - NO toca handlers operativos validados paso 19 — solo orquesta.
// ============================================================================

/**
 * getEquipoDocenteForPanel — refresh on-demand del equipo desde el panel.
 * LockService coordina con refreshDocentes embedded en handlers (SPOF 32) y
 * con submitOperativoFromPanel concurrente (multi-tab).
 *
 * Retorna: { ok: true, equipo: {activas, licencia, bajas} }
 *       o: { ok: false, reason: 'busy' | 'error', error?: string }
 */
function getEquipoDocenteForPanel() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, reason: 'busy' };
  }
  try {
    return { ok: true, equipo: _readEquipoDocente() };
  } catch (err) {
    return { ok: false, reason: 'error', error: String(err) };
  } finally {
    lock.releaseLock();
  }
}

/**
 * submitOperativoFromPanel — wrapper que arma fakeEvent + invoca el handler
 * operativo correcto (handleMarcarLicencia / handleVolvioLicencia /
 * handleDarDeBaja) según `accion`. NO toca handlers — solo orquesta.
 *
 * Acciones soportadas: 'marcarLicencia' | 'volvioLicencia' | 'darDeBaja'.
 *
 * Retorna: { ok: true, accion, docente: {...actualizada}, warnings: [] }
 *       o: { ok: false, reason: '...', error?: string }
 */
function submitOperativoFromPanel(accion, email) {
  const startedAt = new Date();
  const requestId = 'panel-op-' + startedAt.getTime();
  const userEmail = (function() {
    try {
      const e = Session.getActiveUser().getEmail();
      return e || '(self)';
    } catch (err) {
      return '(self)';
    }
  })();

  OperacionesLog.info('panel-action: arrancó', {
    accion: accion, email: email, userEmail: userEmail, requestId: requestId
  });

  // Mapeo accion → handler + dropdownTitle + extraNamedValues.
  const ACCION_MAP = {
    'marcarLicencia':  { handler: handleMarcarLicencia,  dropdownTitle: 'Que docente esta de licencia?', extraNamedValues: {} },
    'volvioLicencia':  { handler: handleVolvioLicencia,  dropdownTitle: 'Que docente volvio?',           extraNamedValues: {} },
    'darDeBaja':       { handler: handleDarDeBaja,       dropdownTitle: 'A quien das de baja?',          extraNamedValues: { 'Confirmacion': ['Si, desde el panel'] } }
  };
  const cfg = ACCION_MAP[accion];
  if (!cfg) {
    OperacionesLog.error('panel-action: accion invalida', { accion: accion, requestId: requestId });
    return { ok: false, reason: 'invalid-accion' };
  }

  // Lock (SPOF 32 + multi-tab).
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    OperacionesLog.warn('panel-action: lock busy', { accion: accion, email: email, requestId: requestId });
    return { ok: false, reason: 'busy' };
  }

  const warnings = [];
  try {
    // Lookup docente por email para construir el dropdown value que el handler espera.
    const ss = TemplateResolver.resolve('👥 Docentes');
    if (!ss) return { ok: false, reason: 'no-template' };
    const tab = ss.getSheetByName('👥 Docentes');
    if (!tab) return { ok: false, reason: 'no-tab' };

    const targetEmailNorm = _normalizeEmail(email);
    const lastRow = tab.getLastRow();
    if (lastRow < 3) return { ok: false, reason: 'docente-not-found' };

    // Lee cols 1-4 (Apellido, Nombre, DNI, Email) para armar dropdown value.
    const range = tab.getRange(3, 1, lastRow - 2, 4).getValues();
    let dropdownValue = null;
    for (let i = 0; i < range.length; i++) {
      const rowEmailNorm = _normalizeEmail(String(range[i][3] || ''));
      if (rowEmailNorm !== targetEmailNorm) continue;
      const apellido = _normalizeNombre(String(range[i][0] || ''));
      const nombre = _normalizeNombre(String(range[i][1] || ''));
      if (apellido && nombre) dropdownValue = apellido + ', ' + nombre;
      else if (apellido) dropdownValue = apellido;
      else if (nombre) dropdownValue = nombre;
      break;
    }
    if (!dropdownValue) {
      OperacionesLog.error('panel-action: docente no encontrada por email', { email: email, requestId: requestId });
      return { ok: false, reason: 'docente-not-found' };
    }

    // Arma fakeEvent que el handler espera (validado paso 19 runCicloVidaTest).
    const fakeNamedValues = {};
    Object.keys(cfg.extraNamedValues).forEach(function(k) {
      fakeNamedValues[k] = cfg.extraNamedValues[k];
    });
    fakeNamedValues[cfg.dropdownTitle] = [dropdownValue];

    // Invoca handler. SPOF 25: try/catch granular para que handler interno
    // que escribió a 👥 Docentes pero falló en refreshDocentes embedded NO
    // invalide el cambio principal.
    try {
      cfg.handler({ namedValues: fakeNamedValues });
    } catch (handlerErr) {
      // Handler tira error (ej. refreshDocentes alcanzó cap 6min).
      // Verificamos si la mutación principal aplicó leyendo de nuevo.
      const verify = _findEquipoDocenteByEmail(email);
      if (verify && _expectedEstado(accion, verify.estado)) {
        warnings.push('handler_partial');
        OperacionesLog.warn('panel-action: handler tiró pero estado aplicó', {
          accion: accion, email: email, err: String(handlerErr), requestId: requestId
        });
      } else {
        OperacionesLog.error('panel-action: handler tiró sin aplicar', {
          accion: accion, email: email, err: String(handlerErr), requestId: requestId
        });
        return { ok: false, reason: 'handler-error', error: String(handlerErr) };
      }
    }

    // Re-lookup post-handler. SPOF 3: cliente recibe docente actualizada.
    const docenteActualizada = _findEquipoDocenteByEmail(email);
    if (!docenteActualizada) {
      return { ok: false, reason: 'docente-not-found-post-update' };
    }

    OperacionesLog.info('panel-action: ok', {
      accion: accion, email: email, requestId: requestId, warnings: warnings,
      durationMs: (new Date()) - startedAt
    });
    return { ok: true, accion: accion, docente: docenteActualizada, warnings: warnings };

  } finally {
    lock.releaseLock();
  }
}

/**
 * submitSumarFromPanel — wrapper para handleSumarDocente desde el panel.
 * Validación duplicate email/DNI server-side defensive (SPOF 21, además del
 * client-side). Logs panel-action (SPOF 35).
 *
 * payload: { apellido, nombre, dni, email, tipo }
 *
 * Retorna: { ok: true, docente, warnings } o { ok: false, reason, error? }.
 */
function submitSumarFromPanel(payload) {
  const startedAt = new Date();
  const requestId = 'panel-sumar-' + startedAt.getTime();

  OperacionesLog.info('panel-sumar: arrancó', {
    email: payload && payload.email, requestId: requestId
  });

  if (!payload || typeof payload !== 'object') {
    return { ok: false, reason: 'payload-invalid' };
  }
  const apellido = _normalizeNombre(payload.apellido);
  const nombre = _normalizeNombre(payload.nombre);
  const dni = String(payload.dni || '').trim();
  const email = _normalizeEmail(payload.email);
  const tipo = String(payload.tipo || '').trim();

  if (!apellido) return { ok: false, reason: 'apellido-vacio' };
  if (!email) return { ok: false, reason: 'email-vacio' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: 'email-invalido' };
  if (apellido.indexOf(',') !== -1) return { ok: false, reason: 'apellido-con-coma' };  // SPOF 28

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, reason: 'busy' };
  }

  try {
    // Duplicate check defensive server-side (SPOF 21).
    const equipo = _readEquipoDocente();
    for (let s = 0; s < 3; s++) {
      const seccion = ['activas', 'licencia', 'bajas'][s];
      for (let i = 0; i < equipo[seccion].length; i++) {
        const d = equipo[seccion][i];
        if (_normalizeEmail(d.email) === email) {
          return {
            ok: false, reason: 'email-duplicado',
            existente: { apellido: d.apellido, nombre: d.nombre, estado: d.estado }
          };
        }
      }
    }
    // DNI duplicate check (DNI omitido del whitelist por privacidad — leemos col 3 directo).
    if (dni) {
      const ss = TemplateResolver.resolve('👥 Docentes');
      if (ss) {
        const tab = ss.getSheetByName('👥 Docentes');
        if (tab && tab.getLastRow() >= 3) {
          const dniCol = tab.getRange(3, 3, tab.getLastRow() - 2, 1).getValues();
          for (let i = 0; i < dniCol.length; i++) {
            if (String(dniCol[i][0] || '').trim() === dni) {
              return { ok: false, reason: 'dni-duplicado' };
            }
          }
        }
      }
    }

    // Arma fakeEvent que handleSumarDocente espera.
    const fakeNamedValues = {
      'Apellido y nombre': [apellido + (nombre ? ' ' + nombre : '')],
      'DNI': [dni],
      'Email': [email],
      'Tipo': [tipo]
    };
    const warnings = [];
    try {
      handleSumarDocente({ namedValues: fakeNamedValues });
    } catch (handlerErr) {
      const verify = _findEquipoDocenteByEmail(email);
      if (verify) {
        warnings.push('handler_partial');
        OperacionesLog.warn('panel-sumar: handler tiró pero fila aplicó', {
          email: email, err: String(handlerErr), requestId: requestId
        });
      } else {
        OperacionesLog.error('panel-sumar: handler tiró sin aplicar', {
          email: email, err: String(handlerErr), requestId: requestId
        });
        return { ok: false, reason: 'handler-error', error: String(handlerErr) };
      }
    }

    const docente = _findEquipoDocenteByEmail(email);
    if (!docente) {
      return { ok: false, reason: 'docente-not-found-post-create' };
    }

    OperacionesLog.info('panel-sumar: ok', {
      email: email, requestId: requestId, warnings: warnings,
      durationMs: (new Date()) - startedAt
    });
    return { ok: true, docente: docente, warnings: warnings };

  } finally {
    lock.releaseLock();
  }
}

/**
 * getDeployVersion — retorna deploy version cacheada para que cliente detecte
 * cache stale del HTML (SPOF 36).
 */
function getDeployVersion() {
  return _getDeployVersionCached();
}

// ============================================================================
// Helpers internos compartidos por los wrappers de panel.
// ============================================================================

function _findEquipoDocenteByEmail(email) {
  const equipo = _readEquipoDocente();
  const targetEmail = _normalizeEmail(email);
  for (let s = 0; s < 3; s++) {
    const seccion = ['activas', 'licencia', 'bajas'][s];
    for (let i = 0; i < equipo[seccion].length; i++) {
      const d = equipo[seccion][i];
      if (_normalizeEmail(d.email) === targetEmail) return d;
    }
  }
  return null;
}

function _expectedEstado(accion, estadoActual) {
  if (accion === 'marcarLicencia') return estadoActual === 'Licencia';
  if (accion === 'volvioLicencia') return estadoActual === 'Activa';
  if (accion === 'darDeBaja') return estadoActual === 'No disponible';
  return false;
}
