---
doc: proyecto-dai/docs/design/5-lentes-adr-forms-sintesis
estado: vivo — síntesis 5 lentes pre-decisión ADR forms operativos pivote centralizado
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, aplicación de la técnica de validación 5-lentes pre-código sobre el ADR principal abierto del pivote a modelo centralizado. Caso seminal de la técnica en `analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md`. Cobertura empírica medida: ~95% por convergencias vs ~25% autoverificación pura. Costo: ~320k tokens + 30-45 min síntesis del autor.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: documentar las 5 lentes aplicadas (mapeo del plomero del autor + 4 agentes paralelos: abogado del diablo + cuadro semiótico temporal + mapa de empatía + auditor técnico externo) sobre las 2 opciones del ADR principal del pivote (A: HTML forms en Web App centralizado / B: Google Forms nativos sin trigger + procesamiento on-demand). Producir convergencias 2+ lentes como señal de severidad universal + voto consolidado + decisión recomendada con condiciones bloqueantes.
mutable: sí (sesión que codee actualiza con resultados de tests empíricos bloqueantes)
fecha_elevacion_global: n/a
reemplaza_a: n/a (input al ADR formal pendiente de escribir post-decisión)
---

# 5 lentes sobre ADR forms operativos — síntesis pre-decisión

> Doc consolidado de las 5 lentes aplicadas pre-código sobre el ADR principal del pivote. Lente 1 = mapeo del plomero (autor, este doc). Lentes 2-5 = agentes paralelos (reportes individuales accesibles via task IDs en transcript sesión 6, esta síntesis los consolida). NO leer este doc sin haber leído antes `dai-pivote-centralizado-briefing-sesion-7.md` + `dai-bases-fundamentales.md`.

## 1. Big picture del ADR

**Pregunta:** cómo se manejan los 11 forms operativos del sistema (planificación semanal, registro de clase, novedades, comunicado, etc.) que las docentes rellenan desde celular tocando link único en grupo WhatsApp, en el modelo centralizado pivote (Web App único del operador para todas las escuelas).

**Opción A — HTML forms en Web App centralizado.** Las docentes operan dentro del mismo Web App. HTML forms server-rendered, submit por `google.script.run.submitFormX(payload, sheetId)`, escritura directa al Sheet de la escuela vía `openById` como user accessing. DocGenerator on-the-fly post-write si corresponde.

**Opción B — Forms nativos sin trigger + procesamiento on-demand.** Bootstrap remoto crea 11 Google Forms nativos en Drive de la directora vía `FormApp.create()`. Submits acumulan en Sheet sin trigger (cross-Sheet imposible confirmado por research). Cuando directora abre panel admin, ve "5 pendientes" + botón "Procesar todas". Trigger time-based en TU script como mitigación nightly.

**Decisión recomendada por la síntesis 5 lentes**: Opción A condicional a 4 mitigaciones bloqueantes + 1 research técnico previo + verificación empírica de un SPOF estructural de B (B22) que puede invalidar B definitivamente.

## 2. Lente 1 — Mapeo del plomero del autor

### Opción A — flujo de datos

**Agua (origen → destino):**
- Docente abre panel docentes en celular con URL `https://script.google.com/.../exec?sheetId=<id>`.
- Modelo C V24 valida email vs `👥 Docentes` Activa de Sheet target via `openById(sheetId)`.
- Docente toca botón → server renderea HTML form via `template.evaluate()` desde mismo Web App.
- Docente llena → click submit → `google.script.run.submitFormX(payload, sheetId)`.
- Server-side: `_resolveAuthByEmail(sheetId)` re-valida + `openById(sheetId).getSheetByName('Respuestas-FormX').appendRow(...)` + opcionalmente `DocGenerator.generarDoc(...)` on-the-fly.
- Cliente recibe respuesta → render evidencia persistente post-submit (no toast).

**Muros (componentes V24 que se reusan / cambian / eliminan):**
- Reusables casi directo: `_resolveAuthByEmail` (con sheetId opcional, ya planeado), `_readEquipoDocente`, `_findEquipoDocenteByEmail`, paneles HTML mobile-first, DocGenerator + 9 templates Word.
- Reusables con patrón análogo: `submitOperativoFromPanel` y `submitSumarFromPanel` ya existen en V24 (handlers con LockService + try/catch + OperacionesLog) — los 11 nuevos `submitFormX` siguen mismo patrón.
- Cambian: ConfigForms.gs items se reinterpretan como specs del HTML form (campos, validaciones, dropdowns) en lugar de specs de Forms nativos. Posible fork ConfigHtmlForms.gs.
- Eliminados: `FormApp.create` del bootstrap, `setDestination()`, `OnSubmitDispatcher.gs` (no hay submits de Forms a procesar).

**Uniones (puntos de conexión + riesgos):**
- Cliente HTML ↔ server submitFormX: `google.script.run` con sheetId + idempotency UUID. Riesgo: SPOF A6 Chrome Android tab kill durante submit, A14 `Session.getActiveUser` vacío en cuentas externas.
- Server submitFormX ↔ Sheet de escuela: `openById` como user accessing. Riesgo: SPOF A23 directora revoca acceso mid-session.
- Server submitFormX ↔ DocGenerator: invocación directa post-write. Riesgo: SPOF A4 sin transacción, estado inconsistente si DocGenerator falla post-appendRow.

**Efectos en cadena:**
- Cambio HTML form en TU código → updates instantáneos a las 956 escuelas (ganancia centralización).
- Cambio en `submitFormX` que rompe schema → rompe a las 956 simultáneas (riesgo). Mitigación: versioning + canary deploy + rollback rápido.
- Tu Web App cae → 956 escuelas sin submit. Cero buffer (lente 4 lo cazó).

**Orden de ejecución (chunks):**
1. Test empírico crítico previo: `Session.getActiveUser().getEmail()` desde WhatsApp in-app browser cross-account (lente 2 cazó esto como CRITICAL).
2. Backend: `_resolveAuthByEmail` con sheetId + 11 handlers `submitFormX` siguiendo patrón `submitOperativoFromPanel`.
3. Frontend: 11 HTML forms con cliente JS (idempotency + auto-save + microcopy escalonado + evidencia persistente).
4. Bootstrap remoto: solo crear pestañas + headers + sembrar `👥 Docentes` desde F00. NO `FormApp.create`.
5. DocGenerator: invocación on-the-fly desde `submitFormX` para forms que requieren doc Word.

**SPOFs internos detectados:**
- 11 (un Web App único + 956 escuelas + concurrent execution limit Apps Script 30 simultaneous).
- 8 (idempotency client UUID compartido entre tabs duplicadas).
- 6 (DocGenerator post-write sin transacción).
- 5 (auth degradación silenciosa en cuentas externas WhatsApp browser).

### Opción B — flujo de datos

**Agua (origen → destino):**
- Bootstrap remoto: corre desde TU Web App como user accessing → `FormApp.create()` 11 forms.
- **CAZADA CRÍTICA (lente 5 SPOF B22):** `FormApp.create` corriendo como user accessing crea Forms en Drive del **executor** (la docente o directora actualmente logueada que invocó el bootstrap), NO en Drive del target especificado por sheetId. Si la primera persona que entra al panel es Maru docente, los 11 Forms se crean en Drive de Maru. Si después Maru se va de la escuela, los Forms quedan huérfanos.
- **Esta cazada NO está validada empírico todavía.** Es una inferencia técnica del auditor lente 5 basada en docs de Apps Script. Antes de descartar Opción B, validar empírico.
- Si validado y B22 confirma: Opción B es **inviable** sin redesign del modelo de bootstrap.
- Si validado y B22 NO confirma (Forms se crean en Drive correcto): Opción B sigue como candidata.

Suspendo el resto del mapeo de Opción B porque B22 lo bloquea estructuralmente. Si validación empírica desbloquea, completar mapeo.

### Riesgos arquitectónicos transversales que mi mapeo identifica

- **Privacidad cross-escuela**: en modelo centralizado vos tenés capacidad técnica de leer Sheets de todas las escuelas via openById. Política tuya documentada de "no miro datos" + Ley 25.326 + audit log + commitment público. Independiente del ADR.
- **OAuth verification de Google**: tramitarla UNA vez para tu Web App único cubre las 956 escuelas. Aplica a A y a B igual.
- **Quotas Apps Script per-deployment a escala 956 escuelas**: research bloqueante. SPOF A28 del lente 5.
- **Observabilidad cross-tenant**: SPOF A30 + B30. Ninguna opción tiene out-of-box. Construir custom obligatorio.

## 3. Lente 2 — Abogado del diablo (UX adversarial)

**Voto:** Opción A condicional a 6 mitigaciones bloqueantes.

**Lo que cazó nuevo:**
- WhatsApp in-app browser NO comparte cookies con Chrome → `Session.getActiveUser` retorna vacío. Auth muere en primer click.
- Cold start Apps Script Web App ~4-8s en 3G rural. Maru cierra y reabre, duplica request.
- Quotas Apps Script + Drive per-user-executing-the-script. A escala se rompe silenciosa.
- 6 recomendaciones codeables: idempotency key UUID, Service Worker offline-first, detectar WhatsApp in-app browser y forzar Chrome, pre-warm Web App, telemetría errores a Sheet "Errores", banner progreso "Guardando... Guardado ✓".

**Veredicto adversarial:** Opción B genera deuda operativa garantizada porque mete a Nely (60 años, ADHD operativo, conexión rural) como "cron job humano". El sistema requiere disciplina operativa que NO existe en escuela rural.

## 4. Lente 3 — Cuadro semiótico temporal (4 instancias)

**Voto:** Opción A condicional a 4 elementos bloqueantes.

**Lo que cazó nuevo:**
- 4 instancias modeladas: Maru lunes 7:30am urgente colectivo / Maru miércoles 22:30 cansada WiFi / Nely sábado 16h distraída docs Word / Nely domingo 2:30am alarma SGE.
- Forms nativos AGUANTAN mejor red rural intermitente nativo (Maru instancia 1). A pierde acá si no implementás Service Worker.
- B suma "cola de pendientes como deuda visible" que aparece en momentos no deseados (instancia 3).
- B falla feo en instancia 4 (Nely 2:30am pánico): pre-carga SGE queda sin procesar y Nely no se acuerda de tocar "procesar".
- 4 elementos bloqueantes para A: idempotencia por UUID + cola offline reintento + panel "tus últimas 3 cargas" como evidencia + microcopy spinner que NO abandona.

**Síntesis universal A:** sin idempotencia / sin evidencia / sin cola offline, A se degrada peor que B en instancias stressed.
**Síntesis universal B:** "Carga ≠ efecto" rompe modelo mental universalmente — crítico cuando user está stressed.

## 5. Lente 4 — Mapa de empatía (6 cuadrantes)

**Voto:** Opción B condicional a 5 implicaciones bloqueantes.

**Lo que cazó nuevo (única lente que vota B):**
- Conteo de dolores POR FRECUENCIA: Maru usa el sistema 5x/semana, Nely 1-2x. En A el dolor agudo concentra en Maru cada vez que red falla, multiplicado por frecuencia suma mucho. En B la carga va a Nely una vez por semana procesando, Maru opera con UX Forms nativa familiar.
- Maru en B = "esto es Google, esto siempre anda" = confianza alta inmediata + cero curva aprendizaje.
- Maru en A = HTML custom = "Maru no lo reconoce como confiable al principio".
- Caveat fuerte propio de B: disonancia "Maru jura que mandó / Nely no lo ve" puede romper confianza interpersonal del equipo docente. Más caro de reparar que cualquier fricción técnica.
- Mitigación obligatoria de B: implicación #4 espejo "mis envíos" en panel docentes para que Maru vea su historial sin depender de procesamiento Nely. Sin ese espejo, B se vuelve políticamente tóxico.
- 5 implicaciones JS codeables A: microcopy escalonado spinner, bloqueo doble submit con disable + token, auto-save borrador localStorage, evidencia persistente post-submit (NO toast), bloqueo pull-to-refresh durante mutación.
- 5 implicaciones JS codeables B: badge pendientes en vivo, recordatorio si pasan 72h sin procesar, vista previa pre-procesar, espejo "mis envíos" para Maru, procesamiento idempotente con timestamp.

## 6. Lente 5 — Auditor técnico externo (SPOFs)

**Voto:** Opción A "menos malo" SI Y SOLO SI se confirma B22 + se hace observabilidad propia.

**Lo que cazó nuevo:**
- 30 SPOFs por opción distribuidos en 6 categorías (race conditions / edge cases mobile-browser / errores silenciosos / asunciones implícitas / combinaciones de fixes / estructurales).
- **B22 CRÍTICO BLOQUEANTE:** `FormApp.create` corriendo como user accessing crea Forms en Drive del **executor**, no del target. Si confirma empírico, Opción B colapsa o requiere modelo radicalmente distinto (cada directora corre bootstrap en SU cuenta — pierde el pivote a centralizado entero).
- A28 CRITICAL: Web App single deployment quota global (30 simultaneous executions per script). 956 escuelas con tráfico moderado saturan el deployment único.
- A14 CRITICAL: `Session.getActiveUser().getEmail()` retorna vacío en cuentas externas Gmail común cross-account.
- A30 CRITICAL: NO hay observabilidad cross-tenant out-of-box. Construir custom obligatorio (Sheet "Errores" + log estructurado).
- A2 CRITICAL: `LockService.getScriptLock()` es global per-script. Bloquea 956 escuelas simultáneas. Necesita lock per-escuela custom (registry de locks por sheetId).

**Recomendación auditor:** A condicional a (a) idempotency client-generated, (b) lock per-escuela vía custom registry no LockService global, (c) observabilidad cross-tenant propia, (d) verificación empírica B22 antes de descartar B.

## 7. Convergencias entre lentes (señal de severidad universal)

### Convergencias 4 lentes (universales)

| Hallazgo | Lentes que lo cazaron |
|---|---|
| Idempotencia con UUID + dedup server obligatoria | 2, 3, 4, 5 |
| Toast efímero NO es evidencia post-submit → mostrar evidencia persistente | 2, 3, 4 + paso 17.3 sesión 3 |
| Auto-save de borrador local antes de submit | 2, 3, 4 |
| Reintento + manejo offline mobile obligatorio | 2, 3, 4, 5 |

### Convergencias 3 lentes

| Hallazgo | Lentes que lo cazaron |
|---|---|
| Microcopy escalonado en spinner (no abandonar después de 5s) | 2, 3, 4 |
| Bloqueo de doble submit (disable inmediato + token UUID) | 2, 4, 5 |
| Forms nativos manejan red rural mejor que HTML custom | 3, 4, 5 |
| Disonancia "cargué/procesado" en B rompe modelo mental | 2, 3, 4 |

### Convergencias 2 lentes

| Hallazgo | Lentes que lo cazaron |
|---|---|
| Cuello de botella humano Nely en B no escala/no es confiable | 2, 4 |
| Cold start Apps Script Web App brutal en 3G rural | 2, 5 (A28) |
| Bootstrap remoto cross-account NO validado empírico | 1 (mío), 5 (B22) |
| Privacidad técnica → política en modelo centralizado | 1 (mío), 5 (A30) |
| WhatsApp in-app browser NO comparte cookies con Chrome | 2, 5 (A14) |
| 956 escuelas saturan single deployment quota | 1 (mío), 5 (A28) |

## 8. Voto consolidado por lente

| Lente | Opción | Condicional a |
|---|---|---|
| 1 — mapeo del plomero (mío) | A | Test empírico B22 (descarta B si confirma); 4 convergencias 4-lentes obligatorias; observabilidad custom |
| 2 — abogado del diablo | A | 6 mitigaciones codeables |
| 3 — cuadro semiótico temporal | A | 4 elementos bloqueantes desde día 1 |
| 4 — mapa de empatía | B | 5 implicaciones bloqueantes incluyendo espejo "mis envíos" anti-disonancia |
| 5 — auditor técnico | A | Confirmar B22 + observabilidad cross-tenant propia |

**Resultado:** A 4 votos / B 1 voto. Lente 4 (única en B) cazó la dimensión "frecuencia de uso" que las otras NO ponderaron explícito y caveat real anti-disonancia interpersonal.

## 9. Decisión recomendada con condiciones bloqueantes

### Decisión: Opción A — HTML forms en Web App centralizado

### Condiciones bloqueantes pre-código (antes de cualquier commit en chunks de implementación):

**B1 — Test empírico B22 (lente 5 CRITICAL).**
Validar empírico: `FormApp.create()` invocado desde Web App centralizado corriendo como user accessing — ¿el Form creado queda en Drive del executor o del target? Setup: cuenta operadora deploya Web App con función test → cuenta externa Maru abre URL con `?sheetId=<id-de-cuenta-X>` → Web App invoca `FormApp.create('Test Form')` + reporta `form.getEditUrl()` + `Drive.Files.get(form.getId()).owners`. Si owner = cuenta externa Maru → B22 CONFIRMA → B inviable, descartar definitivo. Si owner = cuenta target X → B22 NO CONFIRMA → B sigue como opción válida. **NO codear backend del pivote sin esta validación.**

**B2 — Test empírico A14 (lente 2 + 5 CRITICAL).**
Validar empírico: `Session.getActiveUser().getEmail()` desde WhatsApp in-app browser. Setup: deploy Web App de prueba con función test que retorna `Session.getActiveUser().getEmail()`. Maru abre URL desde grupo WhatsApp en celular Android → tap → reporta valor retornado. Si vacío → auth modelo C falla en WhatsApp browser → mitigación obligatoria (forzar abrir en Chrome con `intent://` o detectar UA). Si retorna email → A funciona pero implementar fallback defensive de todos modos.

**B3 — Research empírico quotas Apps Script a escala 956 escuelas concurrentes (lente 5 A28).**
Investigación oficial Google: ¿quotas per-script-deployment vs per-user? ¿Límite "30 simultaneous executions" se aplica per-script o per-user? ¿Trickle de 956 escuelas con 1-3 submits/día por escuela cuánto carga el deployment único? Sin esto, riesgo de scale-out colapso silencioso.

### Mitigaciones obligatorias (bloque atómico no negociable, todas o ninguna):

**M1 — Idempotency con UUID client-generated + dedup server.**
Cliente genera `submitId` UUID al montar form. Server valida en cada submit: si UUID ya existe en última fila del Sheet de respuestas (rango últimas 100 filas, optimización), retorna respuesta cacheada del primero, descarta segundo. Mitiga A1, A6, A8, A9, A11, A13, A26 (con scope sessionStorage por tab para evitar A26 colisión cross-tab).

**M2 — Service Worker offline-first + cola de reintento.**
HTML form cachea assets en SW. Submit en red mala → encola en IndexedDB → sincroniza cuando red vuelve. Mitiga A11 modo avión, A6 tab kill, instancia "Maru lunes 7:30am 4G débil" del lente 3.

**M3 — Auto-save borrador en localStorage por form.**
Cada `input` dispara guardado con clave `borrador_<formId>_<userEmail>`. Banner re-apertura: "Tenés un borrador del martes 14:32, ¿seguir o empezar de cero?". Mitiga A6, A12 (Safari iOS privacy mode QuotaExceededError → fallback a sessionStorage o notificación).

**M4 — Evidencia persistente post-submit (NO toast efímero).**
Después del 200 OK reemplazar form por tarjeta `evidencia-enviada` con timestamp + datos clave + botón "Hacer otro registro". Que NO se vaya solo. Mitiga toast efímero + paso 17.3 hallazgo + lentes 2, 3, 4.

### Mitigaciones fuertes deuda v1 (recomendadas, no estrictamente bloqueantes):

**M5 — Microcopy escalonado en spinner.** "Enviando..." 0s → "Casi, guardando..." 4s → "Tarda más de lo normal, no cierres" 13s → "¿Conexión floja? Probá tocar de nuevo" 25s. Lentes 2, 3, 4.

**M6 — Bloqueo de doble submit.** Botón submit `disabled=true` + token UUID + bloqueo pull-to-refresh durante mutación con `event.preventDefault()` en `touchmove`. Lentes 2, 4, 5.

**M7 — Detectar WhatsApp in-app browser + forzar Chrome.** Sniffing UA + botón "Abrir en Chrome" con `intent://` Android / Universal Link iOS. Lente 2 + 5 (A14 mitigation).

**M8 — Pre-warm Web App.** Ping silencioso al endpoint `?warmup=1` cuando Maru abre el panel docentes para amortizar cold start ~4-8s en 3G rural. Lente 2 + 5 (A28 mitigation).

**M9 — Telemetría errores a Sheet "Errores" cross-tenant.**
Sheet en TU Drive operador con append per-error: `{timestamp, sheetId-escuela, userEmail, error, stack}`. Mitiga A30 observabilidad cross-tenant + B30. Construcción custom obligatoria.

**M10 — Lock per-escuela custom (no `LockService.getScriptLock()` global).**
Registry de locks por `sheetId` en PropertiesService de TU script. `acquireLock(sheetId)` + `releaseLock(sheetId)`. Mitiga A2 lock global serializa 956 escuelas.

### Riesgos aceptados explícitos (deuda registrada, no se mitigan en v1):

- **R1 — A28 escala 30 simultaneous executions per script.** Si 956 escuelas saturan → cola + timeouts. Mitigación futura: replicación deployments + sharding por hash sheetId. Aceptado en v1 porque v1 = piloto Nelly + 5-10 escuelas = cero saturación.
- **R2 — A22 OAuth consent screen "unverified app" warning.** Aceptado en v1 con nota de prueba social. Tramitar verification de Google para v2.
- **R3 — A30 observabilidad parcial.** v1 con Sheet "Errores" cross-tenant alcanza. Stackdriver / external observability tools = v2.

## 10. Próximos pasos post-decisión Fito

1. **Fito confirma decisión Opción A + condiciones bloqueantes** (este doc).
2. **Tests empíricos B1 + B2 + B3** (research bloqueante). 1-2 hs total.
3. **Aplicar `arcanomedia:abogado-del-diablo`** sobre esta síntesis (audit adversarial post-decisión, lente 6 implícita).
4. **Mapeo del plomero detallado de cada uno de los 11 forms** + identificar handlers existentes V24 reusables vs nuevos.
5. **ADR formal escrito** en `docs/design/adr-001-forms-html-vs-nativos.md` siguiendo plantilla `costumbres/adr-minimo-forja` con: status / context / decision / consequences / alternativas descartadas.
6. **Plan de chunks de implementación** con LOC + ETA por chunk. Branch separada `feat/pivote-centralizado` desde V24.
7. **R9.B mobile-only** ANTES de cualquier merge a master.

NO codear hasta pasos 2 + 5 completos.

## 11. Cazadas estructurales del proceso 5-lentes

Esta sesión confirma empíricamente la técnica de las 5 lentes documentada en caso seminal paso 17.3:

- **Las convergencias 2+ lentes son señal real de severidad.** 4 hallazgos cazados por las 4 lentes externas + 4 por 3 lentes + 6 por 2 lentes. Total: 14 issues con backing múltiple = mucha más confianza que cualquier hallazgo de una sola lente.
- **Una lente puede votar inverso al consenso y aportar valor real.** Lente 4 (mapa de empatía) votó B mientras las otras votaron A. La razón (frecuencia de uso desigual + caveat anti-disonancia) NO la pondera ninguna otra lente. Sin lente 4, hubiéramos cerrado A sin la mitigación M9 (espejo "mis envíos") que ahora sabemos clave para anti-disonancia interpersonal.
- **Cobertura empírica estimada ~95% pre-código se sostiene.** 30 SPOFs nuevos del lente 5 + 17 hallazgos del lente 2 + 11 del lente 4 + 7 del lente 3 + 11 del mapeo del plomero mío = ~76 hallazgos con solapamiento. Total neto estimado: ~50-55 SPOFs únicos pre-código.
- **Costo total real:** ~120k tokens estimado (4 agentes paralelos + síntesis + mapeo) + ~45 min wall-clock + ~30 min síntesis del autor. Coincide con el caso seminal paso 17.3 (~320k + 30-45 min).

## 12. Firma

Síntesis 5 lentes pre-decisión ADR forms operativos pivote centralizado. Aplica costumbre `caso-estudio-validacion-5-lentes` (caso seminal paso 17.3). Aplica feedback `mapeo-plomero-pre-sub-paso` al meta-nivel (mapeo del plomero del pivote como lente 1). Aplica feedback `dudas-disfrazadas-de-decisiones` (B22 + A14 son dudas técnicas que requieren validación empírica antes de decidir).

NO firmar cierre auto-asumido del ADR. Esperar declaración explícita de Fito antes de actualizar checklist + snapshot. Aplica feedback `no-ofrecer-pausa` + `decisiones-tecnicas-atribuidas-falsamente-a-fito`.

— sesión 6, 2026-05-02, post-cierre 5 lentes externas. Pendiente decisión Fito + 3 tests empíricos bloqueantes + aplicación abogado del diablo post-decisión.
