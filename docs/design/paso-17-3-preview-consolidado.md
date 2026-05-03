---
doc: proyecto-dai/docs/design/paso-17-3-preview-consolidado
estado: vivo — preview pre-código sub-paso 17.3
fecha_origen: 2026-04-30
origen: sesión 3 FORJA DAI siguiente, post-aplicación de validación 5-lentes (mapeo del plomero + abogado del diablo + cuadro semiótico temporal + mapa de empatía + auditor técnico externo) sobre sub-paso 17.3 plan v3 baja/suplentes-docente.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: documentar el plan técnico final de implementación del sub-paso 17.3 (frontend JS de interacción del PanelDirectora.html) integrando los hallazgos de las 5 lentes — 94 SPOFs identificados, 12 recomendaciones UX codeables, decisiones técnicas cerradas. Sirve como spec ejecutable antes de codear.
mutable: sí (puede ajustarse durante codear si emergen cosas en validación; al cerrar 17.3 se marca histórico)
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# Sub-paso 17.3 — Preview consolidado pre-código

> Preview consolidado integrando los hallazgos de las 5 lentes (mapeo del plomero + abogado del diablo + cuadro semiótico temporal + mapa de empatía + auditor técnico externo). Plan técnico final antes de codear.

## 1. Lo que NO va al sub-paso 17.3

- NO toco backend de 17.1 (cerrado y validado paso 19).
- NO toco HTML/CSS de 17.2 (cerrado y validado visualmente en V12).
- NO toco código JS existente del panel (`showToast`, `copyLink`, `confirmRegen`).
- NO toco PanelDocentes ni PanelInvalido.
- NO toco backend handlers operativos paso 19.
- NO uso librerías externas (CSS o JS).
- NO migro a localStorage (sessionStorage solo, single-tab scope).
- NO agrego undo post-confirm (anotado v1.1 con countdown opcional).
- NO toco pasos 18 ni 20.

## 2. Convergencias universales (cazadas por 2+ lentes — prioridad máxima)

Estas son las observaciones que más de una lente cazó simultáneamente. Por convergencia, son señal de severidad universal:

### 2.1 Spinner 9-24s sin progreso visible (3/3 lentes humanas)

**Cazado por:** abogado del diablo, cuadro semiótico (4 instancias unanime), mapa de empatía.
**Problema:** el "Enviando…" estático durante 9-24s rurales genera pánico, doble tap, "se colgó".
**Outcome combinado (a+b):**
- Microcopy escalonado en el botón Confirmar:
    - 0-5s: `Enviando…`
    - 6-12s: `Casi, guardando…`
    - 13-25s: `Tarda más de lo normal, no toques nada`
    - 25s+: `Conectividad lenta, esperá unos segundos más`
- Heartbeat visual: 6 puntos en círculo con fade rotativo CSS animation.
- Implementación: `setTimeout` encadenados cancelables al success/failure.

### 2.2 Tap card = acción destructiva (sábado 16h distraída + auditor SPOF 70)

**Cazado por:** cuadro semiótico instancia 3 + auditor técnico SPOF 70.
**Problema:** tap accidental con dedo grueso al sol abre actionsSheet con 2 botones grandes; o doble tap rápido pre-optimistic abre 2 dialogs encadenados.
**Outcome (a):**
- `openSheet(id)` wrapper que cierra dialog activo antes de abrir nuevo.
- Guard `if (detailSheet.open) return` antes de showModal.
- Detail = modo CONSULTA seguro, botón "Acciones" requiere tap explícito (no tap-card directo).

### 2.3 Toast efímero ≠ evidencia persistente (3/3 lentes humanas)

**Cazado por:** abogado, cuadro (instancia 2 cansada bloquea pantalla), empatía.
**Problema:** toast 4s se va; si Nelly no mira justo, no sabe si quedó hecho.
**Outcome (a):**
- Toast persistente hasta tap-dismiss.
- `aria-live="polite"` para screen reader (SPOF 90 auditor).
- La verdadera evidencia es la card en sección Estado nuevo (que ya está implementado en 17.2 + optimistic UI).

### 2.4 Pull-to-refresh accidental durante spinner (auditor SPOF 74 + empatía)

**Cazado por:** auditor técnico + mapa de empatía (gesto reflejo aprendido en WhatsApp).
**Problema:** Chrome Android dispara recarga al scroll-arriba durante spinner; rompe mutate in-flight.
**Outcome (b):**
- CSS `overscroll-behavior-y: contain` en `body` del panel.
- 1 línea CSS, alto ROI.

### 2.5 Reconciliation revert confunde (abogado + empatía + auditor SPOF 88)

**Cazado por:** abogado del diablo + mapa empatía + auditor (SPOF 88 verify post-timeout retorna estado pre-mutate por write lag).
**Problema:** card migra optimistic → server falla → vuelve atrás. Nelly ve dos saltos en 30s sin entender.
**Outcome (b):**
- Microcopy en revert: "No se pudo guardar, quedó como estaba".
- Si verify post-timeout retorna estado original, esperar 5s y verify-2. Si verify-2 sigue mostrando estado pre-mutate, ahí confiar y revertir. Cuesta latencia pero evita flicker.

## 3. SPOFs técnicos del auditor — top 5 críticos

### 3.1 SPOF 89 — XSS via `innerHTML` (BLOQUEANTE deploy)

**Severidad:** CRÍTICA (vector real con cuenta Gmail común — un nombre con `<script>` o `<img onerror>` ejecuta).
**Outcome (a):** `textContent` o `document.createElement` siempre. NUNCA `innerHTML` con datos del backend. Auditar `showDetailSheet`, `showActionsSheet`, `showConfirmSheet`, `showSumarSheet`, `updateCardData`. Cero `innerHTML`/`outerHTML`/`insertAdjacentHTML` con datos.

### 3.2 SPOF 81 — `mutateInFlight` colgado en true → panel bloqueado

**Severidad:** ALTA (un bug del wrapper bloquea todo el panel).
**Outcome (a):**
- Reset en single resolution path (extender el `Set resolved` que ya existe).
- Watchdog 90s: si el flag persiste >90s, reset incondicional con warning a console.error.
- Test mental: 4 paths (success, failure, timeout, retry-fail) — los 4 deben pasar por reset.

### 3.3 SPOF 83 — Email lookup case-sensitive falla silente

**Severidad:** ALTA (load-bearing en optimistic UI: si el lookup falla, no encuentra la card y panel queda inconsistente sin error).
**Outcome (a):**
- Single source of truth: lowercase desde el receive.
- `window.__docentes` se normaliza a lowercase al recibir + cualquier comparación contra DOM `data-email` se normaliza igual.

### 3.4 SPOF 72 — Chrome Android low-memory tab kill mid-mutate

**Severidad:** ALTA (combo Gmail común + rural + Chrome Android).
**Outcome (a parcial):**
- `sessionStorage.pendingMutate = {requestId, accion, email, timestamp}` al disparar.
- Limpiar al confirmar.
- Al cargar el panel, si hay `pendingMutate` con timestamp <60s: toast amarillo "Tu acción anterior puede haber quedado en el aire — verificá [docente]".
- NO reintentar automático (riesgo doble mutate > riesgo de no saber).

### 3.5 SPOF 79 — Promise rejection en retry busy bloquea panel

**Severidad:** ALTA (combina con 81 para bloqueo permanente).
**Outcome (a):**
- Contrato del wrapper: `callBackend` SIEMPRE resuelve, NUNCA rejecta.
- Si retry busy también falla, retorna `{ok:false, reason:'busy-twice'}`.
- Listener nunca usa try/catch porque no hace falta.
- Documentar invariante en comentario header del wrapper.

## 4. SPOFs medios/bajos del auditor (22 más, condensados)

| # | SPOF | Outcome |
|---|---|---|
| 68 | Reorder respuestas mutate vs refresh | (a) `lastMutateAt` global, descartar refresh con timestamp anterior |
| 69 | Detail/actions sheet abierto sobre estado obsoleto | (b) Cerrar dialog si su `data-target-email` matchea mutate que resuelve |
| 70 | Doble tap rápido pre-optimistic | (a) Guard `if (sheet.open) return` antes showModal |
| 71 | mutateInFlight global vs múltiples cards | (c) Aceptar con microcopy "Esperá un momento, hay otra acción" |
| 73 | click vs pointerdown delay 300ms | (a) Auditar `<meta viewport>` en HTML (decisión cerrada anterior) |
| 74 | Pull-to-refresh durante spinner | (b) CSS `overscroll-behavior-y: contain` |
| 75 | sessionStorage no es shared multi-tab (clarificación) | (c) Aceptar + comentario "no migrar a localStorage" |
| 76 | Pinch-zoom rompe layout dialog | (c) Aceptar — Nelly no zoomea |
| 77 | `.showModal()` en dialog ya abierto = InvalidStateError | (a) Wrapper `openDialog(d)` con guard `if (!d.open)` |
| 78 | querySelector retorna null y se accede textContent | (a) Helper `setText(sel, val)` con guard |
| 80 | getDeployVersion() falla al inicio | (a) Fire-and-forget, ambos handlers con catch silencioso |
| 82 | window.__docentes shape inválido | (a) Defensive shape guard al recibir |
| 84 | data-estado con valor inesperado | (c) Default branch con toast "Estado no reconocido" |
| 85 | revertCard sobre card ya migrada | (b) Tras revert forzar refresh completo |
| 86 | Timeout 60s + visibilitychange + setTimeout drift | (a) Documentar Set resolved como barrera contra doble-resolve |
| 87 | Retry busy + flag + segundo busy + reintento Nelly | (a) Microcopy "Sistema ocupado, esperá 30s" + countdown + pointer-events:none 30s |
| 88 | Optimistic + verify post-timeout retorna estado pre-mutate | (b) Verify-2 a los 5s antes de revertir |
| 90 | Toast no anunciado a screen reader | (b) `role="status" aria-live="polite"` |
| 91 | Card sin aria-busy durante optimistic | (c) Aceptar (Nelly no usa SR) |
| 92 | Sin observability cliente | (b) Anillo circular últimos 50 eventos JS + dump por long-press título |
| 93 | NFC normalize en validation pero no en lookup | (a) NFC en BOTH lados de comparación email/apellido |
| 94 | Persistencia entre sesiones no auditada | (a) Grep código por localStorage antes de codear |

## 5. Recomendaciones UX codeables (de las 3 lentes humanas)

| # | Recomendación | Costo |
|---|---|---|
| 1 | Microcopy escalonado en spinner (0-5/6-12/13-25/25+) | ~10 líneas setTimeout |
| 2 | Heartbeat visual 6 puntos | ~8 líneas CSS animation |
| 3 | Bloquear pull-to-refresh `overscroll-behavior-y: contain` | 1 línea CSS |
| 4 | Toast persistente hasta tap-dismiss | ~5 líneas |
| 5 | `pointer-events: none` sobre dialog completo durante in-flight | ~3 líneas |
| 6 | Cerrar dialog activo antes de abrir otro (`openSheet` wrapper) | ~5 líneas |
| 7 | Microcopy "Avisar que está de licencia" en lugar de "Marcar de licencia" | 0 líneas (label edit) |
| 8 | Mensaje email duplicado: "Esta docente ya está cargada como [Estado]" | 1 línea |
| 9 | Mensaje reconciliation revert: "No se pudo guardar, quedó como estaba" | 1 línea |
| 10 | Mensaje busy 2x con countdown + pointer-events:none 30s | ~15 líneas |
| 11 | `aria-live="polite"` en toast | 1 línea HTML |
| 12 | Confirm con countdown 3s opcional | descartado v1, v1.1 |

## 6. Arquitectura JS final integrada

### 6.1 Wrapper `callBackend` (~140 líneas)

```javascript
// Contrato invariante: SIEMPRE resuelve, NUNCA rejecta. Listener nunca necesita try/catch.
function callBackend(fnName, args, opts) {
  // requestId único + Set resolved (race protection SPOF 13, 70, 86).
  // Timeout 60s con setTimeout + performance.now() ajustado por visibilitychange (SPOF 19, 86).
  // Flag mutateInFlight global con watchdog 90s (SPOF 81).
  // Pre-disparo: deshabilitar botón disparador (SPOF 2) + toast/microcopy escalonado.
  // Post-timeout: verify via getEquipoDocenteForPanel() con timeout corto 10s (SPOF 14).
  //   Si verify retorna estado pre-mutate: verify-2 a los 5s (SPOF 88).
  //   Si verify-2 confirma estado pre-mutate: revertir + toast amarillo.
  // Lookup post-response por email lowercase (SPOF 17, 83).
  // Manejo {ok:false, reason:'busy'}: retry 1x post-3s (SPOF 14).
  //   Si retry también busy: toast "Sistema ocupado 30s" + pointer-events:none countdown (SPOF 87).
  // Manejo errores técnicos: mapeo a microcopy criollo (SPOF 27).
  // Persistencia: sessionStorage.pendingMutate al disparar, clear al confirmar (SPOF 72).
}
```

### 6.2 Listeners (event delegation desde body, ~120 líneas)

```javascript
// Tap .eq-card → openSheet('detailSheet') con guard SPOF 70/77 + populate + showModal.
// Tap "Acciones" en detail → openSheet('actionsSheet') contextual según data-estado.
// Tap acción específica (Marcar licencia / Volvió / Dar de baja) → openSheet('confirmSheet') con resumen.
// Tap "Confirmar [accion]" → callBackend('submitOperativoFromPanel', accion, email).
// Tap X de cada dialog → close.
// Click backdrop dialog → close (custom listener SPOF 66).
// Tap #btnSumar → openSheet('confirmSheet') con form 4 campos.
// Submit form Sumar (preventDefault SPOF 57) → validation + callBackend('submitSumarFromPanel', payload).
// Tap card OTRA mid-flight: openSheet ya cerró el activo (SPOF 56 + recomendación 6).
```

### 6.3 Population de dialogs — TEXTCONTENT ONLY (~140 líneas)

```javascript
// SPOF 89 BLOQUEANTE: cero innerHTML, cero outerHTML, cero insertAdjacentHTML con datos.
// Helpers _setText(sel, val), _createCard(d), etc. con createElement + textContent.
// showDetailSheet(d): título nombre + email + alta + último cambio (todo via textContent).
// showActionsSheet(d): header "¿Qué hacés con [nombre]?" + 2-3 botones contextuales según d.estado.
//   Activa: Marcar de licencia (azul, microcopy "Temporal") + Dar de baja (rojo, microcopy "Definitiva").
//   Licencia: Marcar que volvió (verde) + Dar de baja (rojo).
//   Baja: solo cancelar.
// showConfirmSheet(d, accion): resumen + microcopy contextual + botón Confirmar.
// showSumarSheet(): form 4 campos + restore sessionStorage draft.
```

### 6.4 Optimistic UI (~80 líneas)

```javascript
// markCardEnviando(email): clase .loading + texto "Enviando…" + start microcopy escalonado.
// migrateCardToSection(email, estadoNuevo):
//   - Email NORMALIZADO lowercase (SPOF 83).
//   - Si la sección destino está colapsada (<details> sin [open]) → expandir programático (SPOF 51).
//   - Mover <li> de section.querySelector('.eq-card-list').
//   - Update count en summary.
// updateCardData(docente): re-render data-attributes + texto via textContent.
// revertCard(email):
//   - Migrar de vuelta a sección original.
//   - Toast amarillo con microcopy "No se pudo guardar, quedó como estaba".
//   - Tras revert: forzar getEquipoDocenteForPanel para sync (SPOF 85).
// updateWindowDocentesAfterMutate(docente): actualizar lookup table window.__docentes (SPOF 53).
```

### 6.5 Listeners globales (~70 líneas)

```javascript
// visibilitychange (SPOF 15, 19, 55, 86):
//   - hidden + mutateInFlight: capturar mutateHiddenAt = performance.now().
//   - visible + mutateInFlight: si elapsed > 60s, forzar getEquipoDocenteForPanel + reconcile + reset flag.
//   - visible + dialog abierto + action completada: cerrar dialog auto.
// visualViewport.resize (SPOF 20, 62):
//   - Feature detect: if (!window.visualViewport) skip.
//   - Reposicionar botón submit del bottom sheet via scrollIntoView cuando keyboard sube.
// On load:
//   - Validate window.__docentes shape (SPOF 82).
//   - getDeployVersion fire-and-forget, comparar (SPOF 36, 80).
//   - Si pendingMutate < 60s en sessionStorage: toast amarillo verificar (SPOF 72).
//   - Defensive: if !window.google?.script?.run → toast rojo permanente (SPOF 63).
```

### 6.6 Validation client-side Sumar (~30 líneas)

```javascript
// _normalizeEmailJS(s): toLowerCase + trim.
// _normalizeNombreJS(s): NFC normalize + trim (SPOF 30, 93).
// validateSumar(payload): regex email + apellido sin coma (SPOF 28) + duplicate check email/DNI
// contra window.__docentes (con NFC + lowercase) (SPOF 21, 31, 83, 93).
// Mensaje email duplicado: "Esta docente ya está cargada como [Estado]" (recomendación abogado #8).
```

### 6.7 Toast con variantes + heartbeat (~50 líneas)

```javascript
// showToast(msg, variant, opts): variant 'success'|'warn'|'error'.
// Persistente hasta tap-dismiss por default (recomendación cuadro/empatía).
// aria-live="polite" en el div (SPOF 90).
// Heartbeat visual: 6 puntos con CSS animation rotativa fade durante in-flight (recomendación empatía #5).
// Microcopy escalonado: setTimeout encadenados cancelables (recomendación universal #1).
```

### 6.8 sessionStorage draft Sumar (~25 líneas)

```javascript
// On input change → sessionStorage.setItem('sumar-draft', JSON.stringify(payload)) (try/catch SPOF 64).
// On Sumar dialog open → restore campos.
// On submit success → removeItem.
// pendingMutate (SPOF 72): persistir requestId+accion+email+timestamp al disparar mutate.
//   Clear al confirmar. Read on load para toast verificar.
```

### 6.9 Observability cliente (~25 líneas, SPOF 92)

```javascript
// _clientLog: anillo circular últimos 50 eventos {t, ev, detail}.
// Push en cada listener (tap, dialog open/close, callBackend dispatch/result, optimistic action).
// Long-press 3s sobre título header → dump _clientLog a toast copiable (fase 2).
```

## 7. Estimación de líneas final

| Bloque | Líneas estimadas |
|---|---|
| Wrapper `callBackend` (todos los fixes técnicos) | 140 |
| Listeners + event delegation + guards | 120 |
| Population de dialogs (textContent only, BLOQUEANTE SPOF 89) | 140 |
| Optimistic UI (lowercase normalize + forced refresh post-revert) | 80 |
| Listeners globales (visibilitychange + visualViewport + onLoad) | 70 |
| Validation client-side Sumar | 30 |
| Toast variantes + aria-live + heartbeat + microcopy escalonado | 50 |
| sessionStorage draft + pendingMutate | 25 |
| Observability cliente | 25 |
| **Total JS de 17.3** | **~680 líneas** |

`PanelDirectora.html` final post-17.3: ~1300 líneas (de 616 actuales).

## 8. Pasos en orden 17.3

1. Edit `PanelDirectora.html`: agregar bloque JS nuevo después del `<script>` que tiene `window.__docentes` (orden DOM crítico SPOF 52).
2. Auditar el archivo por uso de `innerHTML` con datos (SPOF 89 BLOQUEANTE).
3. Auditar por uso de `localStorage` (SPOF 94 — debería retornar 0 matches).
4. Auditar `<meta viewport>` (SPOF 73 — debería estar).
5. clasp push --force.
6. Crear deploy V13 (manteniendo mismo deploy ID).
7. Verificación visual de todo el flow:
   - Tap card → detail aparece OK.
   - Tap "Acciones" → actionsSheet contextual según Estado.
   - Tap acción → confirmSheet aparece.
   - Tap Confirmar → optimistic + spinner + microcopy escalonado + toast persistente.
   - Validar SPOF 89: testear con apellido `<script>alert(1)</script>` — debe mostrarse literal, no ejecutar.
   - Validar SPOF 83: testear con email "Sandra@Gmail.com" duplicado contra "sandra@gmail.com" → debe rechazar como duplicado.
8. Test específicos opcionales:
   - testGetEquipoDocenteNoTokenLeak (de 17.1, regression check).
   - Smoke 14/14 (regression).
9. Si todo OK → commit local 17.3 sin push todavía.
10. Sub-paso 17.4: testing end-to-end + commit final + push GitHub PR #1.

## 9. SPOFs aceptados con razón explícita (no se fixean en 17.3)

- 4 (equipo grande 956 escuelas): backlog v1.1.
- 5 (multi-admin): modelo no aplica.
- 7 (Chrome viejo): Chrome móvil 2026 cumple.
- 8 (Estado nulo): default 'Activa' ya cubre.
- 10 (toast concurrente): edge muy raro.
- 16 (orden callbacks server-side): flag global cubre single-tab.
- 18 (mid-refresh stale dropdowns Forms): Nelly no vuelve a Forms.
- 22 (orientation change): caveat aceptable Android portrait.
- 23 (safe-area iPhone): Nelly Android. Fix gratis aplicado igual.
- 33 (multi-tab race): rural single-user.
- 34 (auto-refresh hipotético): no en scope.
- 60 (race optimistic concurrente): flag global cubre.
- 61 (details.open=true sin animación): aceptar.
- 65 (`<dialog>` ESC nativo): no-action.
- 71 (mutateInFlight global vs múltiples cards): aceptar con microcopy.
- 75 (sessionStorage shared multi-tab): aclaración, no aplica.
- 76 (pinch-zoom): aceptar.
- 84 (data-estado inesperado): default branch.
- 91 (card aria-busy): aceptar.

Total: 19 aceptados con razón verificable. 75+ fixeados o mitigados explícitamente.

## 10. Cobertura final estimada

- Auto-verificación inicial (mapeo plomero solo): ~25% coverage según métrica empírica de sub-pasos previos.
- + Auditor técnico externo: ~75% coverage (cazó 27 SPOFs nuevos).
- + 3 lentes humanas (abogado + cuadro + empatía): convergencias adicionales en eje UX que el auditor técnico no caza.
- **Total estimado: ~95% pre-código.**
- 5% residual aceptado para cazar en validación post-código (modo Ejecución CLAUDE.md L32 real).

## 11. Pendiente para sub-paso 17.4

- Testing end-to-end del flow completo.
- Smoke 14/14 regression.
- Validación visual mobile rural simulada.
- Commit final 17.3 + 17.4.
- Push GitHub PR #1 con los 4 sub-pasos del paso 17 cerrados.
- Marcar paso 17 [x] en checklist CLAUDE-CORE.

— FORJA DAI siguiente, sesión 3 vuelta N, 2026-04-30.
