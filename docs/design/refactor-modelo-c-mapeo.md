---
doc: proyecto-dai/docs/design/refactor-modelo-c-mapeo
estado: vivo — mapeo del plomero pre-refactor
fecha_origen: 2026-05-01
origen: sesión 5 FORJA DAI siguiente, Chunk 0 del refactor modelo C. Mapeo dedicado pre-código (lección 1 + 8: mapeo del plomero por sub-paso, no extrapolar global).
proyecto_marco: Arcanomedia/DAI
proposito: mapear con detalle archivos a tocar + cambios concretos + riesgos identificados + orden operativo del refactor modelo C (eliminar tokens en URL, identificar por Session.getActiveUser().getEmail()) ANTES de tocar código. Validación post-mapeo: si emergen 3+ SPOFs nuevos, re-mirar mapeo del plan continuidad.
mutable: sí (puede ajustarse durante chunks)
---

# Refactor modelo C — mapeo del plomero pre-código

## 1. Big picture

**Hoy** (modelo viejo con tokens): `doGet(?role=admin&token=UUID)` → `TokenService.validate()` busca token en `👥 Docentes` col 10 → si match Activa/Licencia → render PanelDirectora. URLs personalizadas por docente listadas en pestaña `🚀 Tu Panel` del Sheet.

**Modelo C**: `doGet(?role=admin)` SIN token → `Session.getActiveUser().getEmail()` → match contra `👥 Docentes` Activa (whitelist) → render PanelDirectora. Una URL única para toda la escuela. Pestaña `🚀 Tu Panel` desaparece. Botones "📱 Compartir link" + "🖨 Imprimir QR" en panel.

**Ahorro neto estimado**: -413 LOC (TokenService 165 + TuPanelTabBuilder 228 + 80 refs limpias) + 50 LOC botones nuevos = **-363 LOC netos**.

## 2. Archivos a tocar

| # | Archivo | Cambio | Chunk | LOC |
|---|---|---|---|---|
| 1 | `apps-script/appsscript.json` | + `oauthScopes` con `userinfo.email` (Apps Script ya no auto-detecta scopes cuando declarás array) | A | +5 |
| 2 | `apps-script/src/webapp/WebApp.gs` `doGet` L192-239 | Refactor con Session.getActiveUser primero, fallback ?token= durante test | B+D | +60 / -55 |
| 3 | `apps-script/src/webapp/WebApp.gs` `submitOperativoFromPanel` L633-796 | Eliminar bloque `TokenService.invalidate(tokenViejo)` L710 + L719-728 + var tokenViejo + opción `cfg.invalidateToken` | F | -25 |
| 4 | `apps-script/src/services/TokenService.gs` | DELETE archivo entero | E | -165 |
| 5 | `apps-script/src/orchestration/OnSubmitDispatcher.gs` `handleSumarDocente` L100-266 | Eliminar `token = TokenService.generate()` L172-181 + último elem appendRow `token`→`''` L196 + bloque urlAdmin L246-256 + log urlAdmin | F | -25 |
| 6 | `apps-script/src/orchestration/OnSubmitDispatcher.gs` `_changeDocenteEstado` L349-470 | Eliminar `tokenAnterior` lectura L397 + bloque `TokenService.invalidate` L405-415 + opt `invalidateToken` | F | -20 |
| 7 | `apps-script/src/orchestration/OnSubmitDispatcher.gs` `handleDarDeBaja` L508-522 | Sacar opción `invalidateToken: true` (col 10 ya no tiene tokens) | F | -3 |
| 8 | `apps-script/src/orchestration/SetupOrchestrator.gs` `_seedDocentesFromOnboarding` L289 + L318 | `TokenService.generate()` → `''` (col 10 vacía deprecated, NO migración destructiva) | F | -2 |
| 9 | `apps-script/src/orchestration/SetupOrchestrator.gs` `setup` L116-122 | Eliminar paso 6.7 `TuPanelTabBuilder.ensure` | G | -7 |
| 10 | `apps-script/src/Main.gs` `regenerateTuPanelTab` L246-254 | DELETE función entera | G | -9 |
| 11 | `apps-script/src/builders/TuPanelTabBuilder.gs` | DELETE archivo entero | G | -228 |
| 12 | `apps-script/src/webapp/PanelDirectora.html` sección QR L697-710 | + botón "📱 Compartir link" + botón "🖨 Imprimir QR" + JS handlers + CSS @media print | G | +50 |
| 13 | `apps-script/tests/SmokeTests.gs` `_cleanupCicloTest` L713 + L754-756 | Eliminar invocación `TokenService.invalidate` + comment | F | -5 |

**NO se tocan**:
- `apps-script/src/builders/ConfigSheetBuilder.gs` schema `👥 Docentes` (10 cols mantienen, col 10 queda vacía deprecated — sin migración destructiva).
- `apps-script/src/services/EmailService.gs` (activo latente, deuda v2 a ajustar `adminUrl` cuando se reactive).
- `apps-script/src/webapp/PanelDocentes.html` (sigue Anyone-with-link sin auth).
- Forms operativos (Sumar/Licencia/Volvió/Baja) ni dispatcher table.

## 3. Cambio detallado de `doGet` (Chunk B + D)

**Chunk B** (aditivo — mantiene branch token para fallback test C):

```javascript
function doGet(e) {
  const params = (e && e.parameter) || {};
  const role = params.role || '';
  const isAdmin = role === 'admin';

  // Default sin role: PanelDocentes público (sin cambios).
  if (!isAdmin) {
    const template = HtmlService.createTemplateFromFile('src/webapp/PanelDocentes');
    template.ctx = WebApp._getContext(false);
    return template.evaluate()
      .setTitle('DAI — Escuela')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Admin: Modelo C (Session.getActiveUser) primero. Si email vacío Y hay
  // ?token= → fallback al modelo viejo durante test empírico V23 (Chunk B).
  // En Chunk D se elimina el fallback completo.
  let auth = _resolveAuthByEmail();
  if (!auth.authorized && params.token) {
    // FALLBACK TEMPORAL durante Chunk B+C (eliminar en Chunk D)
    const token = String(params.token).trim();
    auth = TokenService.validate(token);
    auth._fallbackPath = 'token';
  }

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
  template.ctx = WebApp._getContext(true);
  template.ctx.tokenAuth = auth;
  template.ctx.greetingName = auth.docente.nombre || auth.docente.apellido
    || template.ctx.directorName || template.ctx.schoolName;
  return template.evaluate()
    .setTitle('DAI — Panel Directora')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * _resolveAuthByEmail — Modelo C (sesión 5 2026-05-01).
 * Identifica al usuario por su login Google + matchea contra 👥 Docentes Activa.
 * Cazada I plan v3 "solo registradas operan" — la directora también está
 * sembrada en 👥 Docentes (SetupOrchestrator._seedDocentesFromOnboarding).
 *
 * Retorna shape compatible con TokenService.validate:
 *   { authorized, docente: {apellido, nombre, email, estado} | null, reason }
 */
function _resolveAuthByEmail() {
  let userEmail = '';
  try {
    userEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  } catch (err) {
    return { authorized: false, docente: null, reason: 'session-error' };
  }
  if (!userEmail) {
    return { authorized: false, docente: null, reason: 'email-empty' };
  }

  const ss = TemplateResolver.resolve('👥 Docentes');
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
    // Activa Y Licencia autorizadas (mismo criterio que TokenService.validate).
    return { authorized: true, docente: docente, reason: null };
  }
  return { authorized: false, docente: null, reason: 'email-not-in-docentes' };
}
```

**Chunk D** (post-test C empírico): eliminar el bloque `if (!auth.authorized && params.token)` + import de TokenService. Quedar solo Session.getActiveUser path.

## 4. Botones nuevos PanelDirectora (Chunk G)

**Ubicación**: extender sección QR existente `<? if (ctx.panelDocentesQrUrl) { ?>` L697-710 (NO crear sección paralela — Cazada R7 del mapeo).

**HTML aditivo**:
```html
<div class="qr-actions" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
  <button class="btn primary" onclick="compartirLinkPanel()">📱 Compartir link del panel</button>
  <button class="btn secondary" onclick="imprimirQR()">🖨 Imprimir QR para sala docentes</button>
</div>
```

**JS**:
- `compartirLinkPanel()` → `navigator.share({title, text, url})` con fallback a `navigator.clipboard.writeText(url)` + toast "Link copiado, pegalo en WhatsApp". URL pre-armada con texto: *"Hola, entrá al sistema con tu mail de la escuela: [URL única del web app admin]"*.
- `imprimirQR()` → `window.print()`. CSS `@media print` que muestra solo el QR + texto "Panel docentes — escaneá con tu celular" en página completa, oculta el resto del panel.

## 5. Riesgos / SPOFs identificados en este mapeo

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | OAuth re-consent obligatorio al agregar scope. Warning amarillo "no verificada" reaparece para Fito en Apps Script editor + en web app. | Documentado en plan continuidad. Cazada Módulo 0 prevé warning. |
| R2 | `Session.getActiveUser()` retorna vacío sin scope manifest (cuenta Gmail común externa). | Scope userinfo.email en manifest (Chunk A) + defensive guard `email-empty` con render PanelInvalido. |
| R3 | Rama `?token=` mantiene durante Chunk B+C — colisión paths. | Prioridad explícita: Session.getActiveUser primero, token solo si email vacío Y param token existe. Chunk D elimina fallback. |
| R4 | `runCicloVidaTest` en SmokeTests.gs invoca `TokenService.invalidate` — antes de Chunk E (delete TokenService) hay que limpiar. | Chunk F incluye SmokeTests.gs. Orden enforced: F antes de E. **AJUSTE AL ORDEN ORIGINAL: F antes de E**. |
| R5 | EmailService activo latente refs `adminUrl` con token. | NO toca refactor (decisión sesión 4: latente sin invocación). Deuda v2 documentada cuando se reactive. |
| R6 | Schema `👥 Docentes` col 10 con tokens existentes en producción. | Mantener schema 10 cols, col 10 queda vacía/legacy. NO migración destructiva. ConfigSheetBuilder no se toca. |
| R7 | Botón "Abrir panel de prueba" L709 ya existe en sección QR. | Extender sección, NO crear paralela. Confirmado en grep. |
| R8 | Cache `webapp-url:teacher` en Properties — usado por handleSumarDocente para construir adminUrl. | Limpiar el bloque urlAdmin de handleSumarDocente (Chunk F). Cache queda obsoleto pero no rompe (lectura defensiva). |
| R9 | `cfg.director_email` redundante con `👥 Docentes` Activa (directora está sembrada ahí). | Lógica simplificada: solo chequear contra `👥 Docentes` Activa. director_email del cfg sigue usándose para greeting/datos pero NO para auth. |
| R10 | PanelDocentes (sin role) sigue Anyone-with-link sin auth. | NO tocar — sigue público vía URL única + QR pegado en sala. |
| R11 | Test C Fito-como-Nelly desde Gmail común sin Workspace — caso NO documentado por agente background. | Riesgo residual reconocido. Defensive guard `email-empty` cubre el caso "scope no funciona". Si falla → diagnóstico antes de Chunk D. |

**Total SPOFs cazados pre-código: 11**. Coincide con plan continuidad sesión 4 (3 condiciones del verdict + 8 SPOFs internos del refactor). NO emergen 3+ nuevos del orden original — mapeo del plan continuidad sigue válido.

## 6. Ajuste al orden de chunks (post-mapeo)

**Chunk F** (limpiar refs col 10 Token) **DEBE EJECUTARSE ANTES DE Chunk E** (delete TokenService.gs). Razón: SmokeTests + handlers todavía referencian TokenService cuando se eliminan, romperían `runSmokeTests` antes de Chunk E si E va primero.

**Orden corregido**:
```
0. Mapeo a disco (este doc)
A. Manifest scope + smoke + clasp push V23
B. doGet refactor con Session.getActiveUser + fallback ?token= temporal + smoke
C. Test empírico V23 Fito-como-Nelly Android Chrome
D. Eliminar branch ?token= del doGet + smoke
F. Limpiar refs col 10 Token en handlers + SmokeTests + smoke (movido antes de E)
E. DELETE TokenService.gs + smoke (queda 0 refs)
G. DELETE TuPanelTabBuilder.gs + SetupOrchestrator paso 6.7 + Main.regenerateTuPanelTab + botones HTML/JS PanelDirectora
H. Smoke 14/14 + runCicloVidaTest 4/4 final + push GitHub
```

## 7. Validación post-mapeo

Mapeo identificó 11 SPOFs (esperado 10±2 según plan continuidad). NO emergen 3+ nuevos → mapeo del plan continuidad válido. Cambio operativo: orden F antes de E (R4).

**Listo para arrancar Chunk A**.

## 8. Firma

Mapeo del plomero escrito al inicio de Chunk 0 sesión 5 FORJA DAI siguiente. Aplica feedback `mapeo-plomero-pre-sub-paso.md` (mapeo dedicado por sub-paso, no extrapolar global). Aplica feedback `defensive-guard-handlers.md` (guards al inicio de _resolveAuthByEmail).

— FORJA DAI siguiente, sesión 5, 2026-05-01.
