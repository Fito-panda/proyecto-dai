---
doc: proyecto-dai/docs/design/refactor-paso-22-mapeo
estado: vivo — mapeo del plomero pre-código paso 22 distribuido
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, chunk 22.0 del paso 22 distribuido. Mapeo dedicado pre-código (lección 1 + 8: mapeo del plomero por sub-paso, no extrapolar global). Escrito post-dale Fito al plan v2 revisado de paso 22 distribuido (modelo X SaaS self-service 10k escuelas, decisión TOMADA del producto desde discovery, NO reabrir).
proyecto_marco: Arcanomedia/DAI
proposito: mapear con detalle los archivos a tocar + cambios concretos + riesgos identificados + orden operativo del paso 22 distribuido (web app configuradora + modelo C multi-tenant via sheetId param) ANTES de tocar código. Validación post-mapeo: si emergen 3+ riesgos críticos NO anticipados en pre-fase, parar para dale Fito.
mutable: sí (puede ajustarse durante chunks)
fecha_elevacion_global: n/a
reemplaza_a: n/a (extiende cadena refactor-modelo-c-mapeo.md de sesión 5)
---

# Refactor paso 22 distribuido — mapeo del plomero pre-código

## 1. Big picture

**Hoy** (modelo C V24, single-tenant): Web App del operador deployado en script bound a `driveproyectodai`. `_resolveAuthByEmail()` usa `TemplateResolver.resolve('👥 Docentes')` que siempre devuelve el Sheet del operador. Cualquier cuenta que entre a la URL del Web App es validada contra el `👥 Docentes` del operador. Validado chunk C cross-account: cuenta externa entra al panel del operador.

**Modelo X distribuido** (SaaS self-service 10k escuelas): Web App único del operador sirve a todas las escuelas. Cada escuela tiene su Sheet propio bootstrappeado. URLs admin + panel docentes incluyen `&sheetId=<MISHEETID()>`. `_resolveAuthByEmail(sheetId)` con `sheetId`: `SpreadsheetApp.openById(sheetId)`; sin `sheetId`: legacy TemplateResolver (uso interno operador). Configurador via `?sheetId=<MISHEETID()>` (sin role) ejecuta `bootstrapTemplate` sobre Sheet copiado de directora externa.

**Decisión arquitectónica TOMADA** del producto desde discovery. Multi-tenant via sheetId param. NO reabrir.

**Estimación honesta paso 22 distribuido**: ~350-480 LOC totales, 6-7 hs activas, 7 chunks 22.0..22.6 sobre branch `feat/paso-22-distribuido`. Mismo patrón refactor modelo C sesión 5.

## 2. Archivos a tocar

| # | Archivo | Cambio principal | Chunk | LOC est |
|---|---|---|---|---|
| 1 | `apps-script/src/webapp/WebApp.gs` `doGet(e)` | Agregar branch configurador (path `?sheetId=` sin role) + branch admin distribuido (`?role=admin&sheetId=`). Path actual sin role para PanelDocentes acepta `sheetId` opcional. | 22.2 + 22.3 | +60 / -10 |
| 2 | `apps-script/src/webapp/WebApp.gs` `_resolveAuthByEmail()` | Aceptar `sheetId` opcional. Con `sheetId`: `SpreadsheetApp.openById(sheetId)`. Sin: legacy TemplateResolver. | 22.2 | +20 |
| 3 | `apps-script/src/webapp/WebApp.gs` `_readEquipoDocente()` | Aceptar `sheetId` opcional. Propagar al Sheet target. | 22.2 | +10 |
| 4 | `apps-script/src/webapp/WebApp.gs` `submitOperativoFromPanel(action, payload, sheetId)` | Argumento `sheetId` final (firma stateless). Resolver Sheet target con helper. | 22.2 | +15 |
| 5 | `apps-script/src/webapp/WebApp.gs` `submitSumarFromPanel(payload, sheetId)` | Idem. | 22.2 | +10 |
| 6 | `apps-script/src/webapp/WebApp.gs` `getEquipoDocenteForPanel(sheetId)` | Idem. | 22.2 | +10 |
| 7 | `apps-script/src/webapp/WebApp.gs` `_findEquipoDocenteByEmail(email, sheetId)` | Idem. | 22.2 | +10 |
| 8 | `apps-script/src/webapp/WebApp.gs` `_getContext(isAdmin, sheetId)` | Pasar `sheetId` al template para uso del cliente JS. | 22.2 | +5 |
| 9 | `apps-script/src/webapp/WebApp.gs` nuevo helper `_resolveTargetSheet(sheetId)` | Centraliza `openById(sheetId)` con caché Properties + defensive guard. Reutilizado por todas las funciones (2-7). | 22.2 | +30 |
| 10 | `apps-script/src/orchestration/OnSubmitDispatcher.gs` | **Ver R9 crítico abajo.** Probable conversión `onFormSubmitDispatcher` (instalable trigger) → `onFormSubmit` (simple trigger nativo del script copiado). Eliminar `installSubmitDispatcher()` post-conversión. | 22.2 | -50 / +30 |
| 11 | `apps-script/src/orchestration/OnSubmitDispatcher.gs` `handleSumarDocente(e)` + `handleAuthCheck(e, formCode)` + `_changeDocenteEstado(e, ...)` | Reemplazar `TemplateResolver.resolve(...)` por `e.range.getSheet().getParent()` (el Sheet bound al trigger es donde escribir). NO usa sheetId param — el trigger ya viene del Sheet correcto. | 22.2 | +20 |
| 12 | `apps-script/src/webapp/PanelDirectora.html` cliente JS | Cada `google.script.run.X(args)` agrega `sheetId` como argumento final. ~30+ callsites. Stateless (voto Fito): `const sheetId = ctx.sheetId;` global JS + propagación. NO Properties stateful (race conditions con misma cuenta en 2 tabs). | 22.2 + 22.3 | +60 |
| 13 | `apps-script/src/webapp/PanelConfigurador.html` NUEVO | HTML separado siguiendo convención (PanelDirectora/PanelDocentes/PanelInvalido). Botón "Configurar mi escuela" + spinner + manejo errores + mensaje final "Listo, volvé al Sheet". | 22.3 | +130 |
| 14 | `apps-script/src/builders/TuPanelTabBuilder.gs` | URLs admin construidas con `&sheetId=` dinámico (custom function `MISHEETID()` resuelve en cada render). Texto de pestaña 📱 Cómo entrar actualizado para mencionar la URL única del operador con sheetId de la escuela. | 22.4 | +30 |
| 15 | `apps-script/src/Main.gs` `MISHEETID()` NUEVO | Custom function `=MISHEETID()` devuelve `SpreadsheetApp.getActive().getId()`. Para uso en fórmulas `=HYPERLINK("...&sheetId=" & MISHEETID(), "...")`. | 22.4 | +5 |
| 16 | `apps-script/src/Main.gs` `bootstrapTemplate()` | Modificar pestaña Arranque: link prefab `=HYPERLINK("<URL operador>/exec?sheetId=" & MISHEETID(), "Configurar mi escuela")`. | 22.3 | +10 |
| 17 | `apps-script/src/orchestration/SetupOrchestrator.gs` o equivalente F00 onboarding submit | Copy del confirm message: "Listo. Esperá 5 minutos y volvé a tu Sheet, vas a ver el link al Panel Directora en pestaña 📱 Cómo entrar." | 22.3 | +5 |
| 18 | `apps-script/src/PanelDocentes.html` | **Verificar pendiente** (R-PanelDocentes): si `sheetId` está presente en URL, usarlo; si no, legacy. Probable cambio mínimo (~10 LOC). | 22.2 | +10 |
| 19 | `apps-script/tests/SmokeTests.gs` + `runCicloVidaTest` | Agregar tests cross-Sheet: validar que `_resolveAuthByEmail(sheetId)` con sheetId externo encuentra docentes del Sheet correcto. Cycle test cross-Sheet con Sheet de prueba externo. | 22.2 + 22.6 | +60 |
| 20 | `apps-script/appsscript.json` manifest | Verificar si scope `https://www.googleapis.com/auth/spreadsheets` ya está incluido (para `openById` cross-Sheet). Si no, agregar. | 22.1 | +1 |

**Total LOC neto estimado**: +470 / -60 = **+410 LOC** (dentro del rango 350-480 estimado en pre-fase v2).

## 3. Cambio detallado de `_resolveAuthByEmail` (chunk 22.2)

```javascript
/**
 * _resolveAuthByEmail(sheetId)
 * Modelo C distribuido (sesión 6, 2026-05-02). Multi-tenant.
 *
 * @param {string|null} sheetId — sheetId del Sheet target. Si presente,
 *   abre via openById(). Si null/undefined, usa TemplateResolver legacy
 *   (Sheet bound al script — uso interno operador).
 * @returns {Object} { authorized, docente, reason }
 */
function _resolveAuthByEmail(sheetId) {
  let userEmail = '';
  try {
    userEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  } catch (err) {
    return { authorized: false, docente: null, reason: 'session-error' };
  }
  if (!userEmail) {
    return { authorized: false, docente: null, reason: 'email-empty' };
  }

  let ss;
  if (sheetId) {
    try {
      ss = SpreadsheetApp.openById(sheetId);
    } catch (err) {
      return {
        authorized: false,
        docente: null,
        reason: 'no-sheet-by-id',
        err: String(err)
      };
    }
  } else {
    ss = TemplateResolver.resolve('👥 Docentes');
  }
  if (!ss) return { authorized: false, docente: null, reason: 'no-template' };

  const tab = ss.getSheetByName('👥 Docentes');
  if (!tab) return { authorized: false, docente: null, reason: 'no-tab' };
  const lastRow = tab.getLastRow();
  if (lastRow < 3) return { authorized: false, docente: null, reason: 'empty-tab' };

  const range = tab.getRange(3, 1, lastRow - 2, 6).getValues();
  for (let i = 0; i < range.length; i++) {
    const rowEmail = String(range[i][3] || '').trim().toLowerCase();
    if (rowEmail !== userEmail) continue;
    const estado = String(range[i][5] || '').trim();
    const docente = {
      apellido: String(range[i][0] || '').trim(),
      nombre: String(range[i][1] || '').trim(),
      email: String(range[i][3] || '').trim(),
      estado: estado
    };
    if (estado === 'No disponible') {
      return { authorized: false, docente: docente, reason: 'estado-no-disponible' };
    }
    return { authorized: true, docente: docente, reason: null };
  }
  return { authorized: false, docente: null, reason: 'email-not-in-docentes' };
}
```

## 4. Cambio detallado del `doGet` (chunk 22.2 + 22.3)

```javascript
function doGet(e) {
  const params = (e && e.parameter) || {};
  const role = params.role || '';
  const sheetId = params.sheetId || '';
  const isAdmin = role === 'admin';
  const isConfigurador = !role && sheetId; // sheetId sin role = configurador

  // Branch configurador (chunk 22.3)
  if (isConfigurador) {
    return _renderConfigurador(sheetId);
  }

  // Branch panel docentes (sin role, sin sheetId, o con sheetId pero sin role).
  if (!isAdmin) {
    const template = HtmlService.createTemplateFromFile('src/webapp/PanelDocentes');
    template.ctx = WebApp._getContext(false, sheetId); // sheetId opcional
    return template.evaluate()
      .setTitle('DAI — Escuela')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Branch panel directora (admin distribuido).
  const auth = _resolveAuthByEmail(sheetId);
  if (!auth.authorized) {
    const tmpl = HtmlService.createTemplateFromFile('src/webapp/PanelInvalido');
    tmpl.reason = auth.reason;
    tmpl.docente = auth.docente;
    return tmpl.evaluate()
      .setTitle('DAI — Acceso no disponible')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  const template = HtmlService.createTemplateFromFile('src/webapp/PanelDirectora');
  template.ctx = WebApp._getContext(true, sheetId);
  template.ctx.sheetId = sheetId; // expuesto al cliente JS para propagar en google.script.run
  template.ctx.tokenAuth = auth;
  template.ctx.greetingName = auth.docente.nombre || auth.docente.apellido
    || template.ctx.directorName || template.ctx.schoolName;
  return template.evaluate()
    .setTitle('DAI — Panel Directora')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * _renderConfigurador(sheetId) — chunk 22.3.
 * Render PanelConfigurador.html. El JS del HTML llama
 * google.script.run.runBootstrapForExternalSheet(sheetId) cuando
 * la directora hace click en "Configurar mi escuela".
 */
function _renderConfigurador(sheetId) {
  const template = HtmlService.createTemplateFromFile('src/webapp/PanelConfigurador');
  template.sheetId = sheetId;
  return template.evaluate()
    .setTitle('DAI — Configurar mi escuela')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * runBootstrapForExternalSheet(sheetId) — invocada por cliente JS de
 * PanelConfigurador.html. Ejecuta bootstrapTemplate sobre el Sheet
 * de la directora externa via openById como user accessing.
 */
function runBootstrapForExternalSheet(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    bootstrapTemplate(ss); // bootstrapTemplate acepta ss opcional, default getActive()
    return { ok: true, sheetName: ss.getName() };
  } catch (err) {
    return { ok: false, err: String(err), stack: err.stack };
  }
}
```

## 5. Cliente JS PanelDirectora.html — patrón sheetId stateless (chunk 22.2 + 22.3)

```javascript
// Inicialización al inicio del <script> del HTML
const sheetId = <?= ctx.sheetId || '' ?>; // injectado por template

// Patrón de propagación en cada google.script.run.X(args):
//
// ANTES (single-tenant):
//   google.script.run.submitOperativoFromPanel(action, payload);
//
// DESPUÉS (multi-tenant):
//   google.script.run.submitOperativoFromPanel(action, payload, sheetId);

// Helper para evitar repetición:
function callServer(method, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [method](...args, sheetId); // sheetId siempre como último arg
  });
}

// Uso:
//   await callServer('submitOperativoFromPanel', 'marcarLicencia', { docenteId: '...' });
```

**Stateless > Stateful** (voto Fito): `Properties.setUserProperty('sheetId', X)` introduce race conditions con misma cuenta en 2 tabs (escuela A y escuela B). Stateless arg-based elimina race.

## 6. Riesgos / SPOFs identificados

| # | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | OAuth re-consent obligatorio al agregar scope `spreadsheets` (si no estaba). Warning amarillo "no verificada" reaparece. | Media | Documentar en plan continuidad. Re-consent UX conocida (chunk A modelo C ya pasó). |
| R2 | `Session.getActiveUser()` retorna vacío para algunas cuentas externas. | Baja | Defensive guard `email-empty` ya existe. Modelo C valida en chunk B sesión 5. |
| R3 | Cliente JS stateful Properties race conditions misma cuenta múltiples tabs. | Alta si stateful | **Decisión: stateless**. sheetId como arg final en cada google.script.run. NO Properties. |
| R4 | TemplateResolver bound retain en uso operador (path sin sheetId). | Baja | Ya validado chunk C. Backwards-compatible. |
| R5 | `MISHEETID()` custom function: ¿accesible desde fórmulas `=HYPERLINK` del Sheet? | Media | Validar en chunk 22.4. Apps Script custom functions en script bound deberían funcionar. Test rápido. |
| R6 | `bootstrapTemplate` cross-Sheet via openById como user accessing. | Alta | Cubierto por test 22.1 (`_testOpenById`). Bloqueante de TODO el paso 22. |
| R7 | sheetId en URL: similar concern de seguridad que tokens UUID pero MENOR (sheetId solo da acceso si email Activa en ESE Sheet). | Baja | Documentar como deuda menor visible en checklist + no bloquea. Privacidad cross-escuela como feature (R-Privacidad abajo). |
| R8 | Refactor cliente JS PanelDirectora.html: 30+ callsites google.script.run. Mucho find&replace mecánico. | Media operativa | Helper `callServer()` reduce repetición (sección 5). Smoke visual + cycle test cross-Sheet detectan regresiones. |
| **R9** | **OnSubmitDispatcher cross-Sheet — TRIGGERS**. Triggers instalables en Apps Script son bound a un script + función específica + evento. Cuando bootstrapTemplate corre desde web app del operador con openById sobre Sheet de directora, los Forms se crean en Drive de directora. Pero el script copiado de la directora NO tiene triggers instalados (los triggers no se copian con script copy). El script del operador NO puede instalar triggers en script ajeno (no existe API). | **CRÍTICA** | **Ver sección 7 RESEARCH BLOQUEANTE.** Solución probable: convertir `onFormSubmitDispatcher` (instalable) → `onFormSubmit` (simple trigger nativo). Pero simple triggers tienen OAuth scope limitado — verificar que `refreshDocentes` (FormApp ops), log a `📋 Estado del sistema`, etc. siguen funcionando. |
| R10 | Simple trigger OAuth scope: `onFormSubmit` simple trigger se ejecuta como el USER que sometió el Form (no como owner). Scope limitado a `read/write spreadsheet` por default — NO incluye `script.deployments` ni `urlFetch` ni partial Drive. | **CRÍTICA** | Verificar empírico en research bloqueante: ¿FormApp.openById funciona en simple trigger context? ¿escribir a `📋 Estado del sistema` funciona? Si NO: re-arquitectura requerida (ej. trigger del operador escucha + dispatch a webhook que ejecuta como operador). |
| R11 | F00 onboarding submit cross-Sheet: el F00 de la directora dispara setupAll. Mismo issue R9 — el trigger del F00 onboarding está donde? | **CRÍTICA** | Mismo research que R9/R10. Si `onFormSubmit` simple trigger funciona en script copiado, F00 dispara setupAll como user accessing en script copiado — coherente. |
| R-PanelDocentes | PanelDocentes.html cuando recibe sheetId. | Baja | Verificar comportamiento en mapeo. Probable cambio mínimo (mostrar nombre de escuela del sheetId target). |
| R-Privacidad | Operador NO entra a panel admin de directora externa por default (su email no está sembrado en SU Docentes). | **FEATURE no bug** | Documentado en pre-fase v2 sección 7. Soporte cross-escuela via Drive sharing manual. |

**Total riesgos cazados pre-código: 13**. **3 críticos (R9, R10, R11) son del mismo nodo: triggers cross-Sheet**. Bloquean TODO el paso 22 distribuido. Sin esto resuelto, modelo X no funciona.

## 7. Research bloqueante pre-código — chunk 22.0b NUEVO

**Cazada estructural emergente del mapeo**: el plan de chunks pre-fase v2 NO contempló los riesgos R9/R10/R11. Asumían que `_resolveAuthByEmail(sheetId)` + `openById` resolvían todo. Pero los handlers operativos (`handleSumarDocente`, `handleAuthCheck`, `_changeDocenteEstado`) son disparados por triggers, y los triggers son cross-script. Eso introduce un research bloqueante que debe resolverse ANTES de chunk 22.1 (test openById) y MUCHO ANTES de chunk 22.2 (backend).

**Chunk 22.0b nuevo — Research triggers cross-Sheet** (~30-60 min agente background):

Preguntas concretas a investigar:

1. ¿Una función llamada literal `onFormSubmit(e)` en un script Apps Script container-bound a un Sheet se dispara automáticamente como simple trigger cuando un Form bound al Sheet recibe submit? (Esperado: SÍ según docs.)
2. ¿El simple trigger `onFormSubmit` se ejecuta con OAuth scopes del USER que sometió el Form, o del OWNER del script? (Esperado: USER.)
3. ¿El simple trigger context puede ejecutar `FormApp.openById(formId).getItems()` y modificar el Form (refreshDocentes ops)? Si NO, ¿hay error visible o silencioso?
4. ¿El simple trigger context puede escribir a `getSheetByName('📋 Estado del sistema').appendRow(...)` (log)?
5. ¿El simple trigger se dispara cuando el script vive en una COPIA de un Sheet template? (Edge case.) ¿O requiere que el script + Sheet hayan sido creados en la misma cuenta?
6. ¿El F00 onboarding submit del flow paso 22 (Form en Drive directora bound a Sheet directora) dispara simple trigger en script copiado de directora? ¿Y ese trigger puede ejecutar setupAll completo (incluye crear forms, escribir headers, etc.)?

Si las respuestas son favorables (simple triggers funcionan + scopes alcanzan): conversión `onFormSubmitDispatcher` → `onFormSubmit` simple trigger + eliminación de `installSubmitDispatcher()` + ~50 LOC menos en chunk 22.2. Modelo distribuido viable.

Si las respuestas son desfavorables (simple triggers no alcanzan): re-arquitectura. Posibles paths:
- Webhook intermedio: el simple trigger dispara `UrlFetchApp.fetch(webhookUrlOperator, payload)`. El operador procesa con scope completo. Pero `UrlFetchApp` no está en simple trigger scope — bloqueante.
- Trigger del operador escucha en cron + scrape periódico de Sheets externos. Lentísimo, no realtime.
- Re-pensar arquitectura: cada directora deploya su propio web app (vuelve al problema mobile original). NO viable.

**Decisión post-research**: si simple triggers funcionan → seguir con plan. Si no → repensar TODO el modelo distribuido. Posible: paso 22 queda como configurador puro (sin operaciones del panel cross-Sheet) hasta resolver arquitectura. Mucho más drástico.

## 8. Ajuste al orden de chunks (post-mapeo)

Plan v2 pre-fase tenía 7 chunks 22.0..22.6. Mapeo identificó research bloqueante R9/R10/R11. **Inserto chunk 22.0b**:

| Chunk | Nombre | Status | LOC | ETA |
|---|---|---|---|---|
| 22.0 | Mapeo del plomero (este doc) | ✅ COMPLETADO | 0 | ~1 h |
| **22.0b** | **Research bloqueante triggers cross-Sheet (agente background)** | **NUEVO** | 0 | ~30-60 min |
| 22.1 | Test empírico `openById` cross-Sheet ANTES de codear backend | Pendiente | ~30 LOC temporal | ~30 min |
| 22.2 | Backend modelo C distribuido (8+ funciones + handlers + helper `_resolveTargetSheet`) | Pendiente | ~150-200 LOC | ~2-3 h |
| 22.3 | Frontend `PanelConfigurador.html` + `_renderConfigurador` + `runBootstrapForExternalSheet` | Pendiente | ~100-130 LOC | ~1 h |
| 22.4 | `TuPanelTabBuilder` con `sheetId` dinámico + `MISHEETID()` custom function | Pendiente | ~30-50 LOC | ~30 min |
| 22.5 | Test empírico cross-Sheet end-to-end (Fito como Nelly desde adolfoprunotto en SU propio Sheet) | Pendiente | 0 | ~30 min |
| 22.6 | Smoke + cycle + commit + push branch `feat/paso-22-distribuido` (NO merge a master) | Pendiente | 0 | ~30 min |

**Total ETA revisado**: 6.5-8 hs (sumar 30-60 min de research bloqueante 22.0b).

## 9. Validación post-mapeo

Mapeo identificó **13 riesgos**. **3 críticos (R9/R10/R11) son del mismo nodo (triggers cross-Sheet)** y bloquean TODO el paso 22 distribuido.

**Resultado validación**: emergieron 3 riesgos críticos del mismo nodo no anticipados en pre-fase v2 (umbral CLAUDE.md L55 "el mismo error se repite con tweaks menores: cambiar enfoque, no seguir"). **Cambio operativo**: insertar chunk 22.0b research bloqueante ANTES de 22.1. NO arrancar 22.1 (test openById) hasta tener research 22.0b resuelto — porque si triggers cross-Sheet no funcionan, openById funcionando NO es suficiente para modelo distribuido.

**Listo para chunk 22.0b post-dale Fito**.

## 10. Firma

Mapeo del plomero escrito al inicio de chunk 22.0 sesión 6 FORJA DAI siguiente. Aplica feedback `mapeo-plomero-pre-sub-paso.md` (mapeo dedicado por sub-paso, no extrapolar). Aplica feedback `defensive-guard-handlers.md` (guards al inicio de `_resolveAuthByEmail` y handlers). Aplica feedback `dudas-disfrazadas-de-decisiones.md` (research empírico triggers cross-Sheet via agente background — no opinable). Aplica costumbre `cuestionar-plan-pre-fase.md` al meta-nivel: el mapeo cuestionó el plan de chunks pre-fase v2 y reveló que 22.0b research bloqueante faltaba.

Cazada estructural meta-meta-nivel: **el mapeo del plomero detecta riesgos que el cuestionar-plan-pre-fase NO detectó**. La costumbre cuestionar-plan opera al nivel de scope ("¿qué falta del plan?"), el mapeo opera al nivel de plomería ("¿cómo conectan las cañerías?"). Son lentes complementarias. Aplicar ambas pre-código pagó: cazó 13 riesgos antes de tocar 1 línea de código.

— FORJA DAI siguiente, sesión 6, chunk 22.0 mapeo del plomero, 2026-05-02.
