---
doc: proyecto-dai/docs/design/paso-22-pre-fase-cuestionar-plan
estado: vivo — pre-fase cuestionar plan paso 22 (revisado v2 post-asesoría sesión 5 + cazada Fito)
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, sub-paso 22.0. Aplicación de la costumbre `cuestionar-plan-pre-fase.md` (catedral/archivo/canon-v1/costumbres/) ANTES del mapeo del plomero, sugerida por sesión 5 (asesor en background) en ajuste #5 asesoría 2026-05-01. Sesión 5 pasó las 4 preguntas literales en segunda asesoría 2026-05-02 (sesión 6 NO leyó el doc fuente — operó con copy-paste literal de sesión 5). Versión v2 post-cazada Fito sobre confusión persona-vs-escuela + tercera asesoría sesión 5 con ajustes operativos (LOC, ETA, chunks, privacidad cross-escuela).
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: cuestionar el scope del paso 22 (web app configuradora) ANTES de mapear el plomero, aplicando las 4 preguntas literales de la costumbre. Producir artefacto pre-fase con SCOPE CONFIRMADO / CORTADO / AGREGADO / RESEARCH NECESARIO + plan de chunks 22.0..22.6 + nota sobre privacidad cross-escuela. Cazar scope creep + omisiones del plan v9 sesión 4 antes de codear.
mutable: sí
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# Paso 22 — Pre-fase cuestionar plan (v2)

> Doc producido en sub-paso 22.0 ANTES del mapeo del plomero. Aplica las 4 preguntas literales de `cuestionar-plan-pre-fase.md`. Versión v2 post-cazada Fito sobre confusión persona-vs-escuela + ajustes operativos de sesión 5 (LOC realista, ETA realista, chunks, privacidad cross-escuela).

## 1. Aclaración fundamental — qué identifica el paso 22 y qué NO

**La cazada estructural del paso 22 NO es sobre identificar a la PERSONA**. Cazada I "todas son pares" del plan v3 sigue 100% vigente intacta: cualquier docente Activa o Licencia que entre al panel admin de su escuela tiene los mismos poderes. NO hay rol "directora" privilegiado. El sistema NO necesita saber QUIÉN entra.

**La cazada es sobre identificar a la ESCUELA**. Cada escuela tiene su SISTEMA INDEPENDIENTE — su propio Sheet con su propio `👥 Docentes`, sus propias secciones, su propia configuración. Cuando una persona entra al panel desde su celular, el sistema necesita saber CUÁL Sheet leer (= cuál escuela). Para eso requiere `sheetId`. Eso NO es identificación de persona, es identificación de tenant.

**Confusión que sesión 6 generó en su primera explicación a Fito**: mezcló "Hola, [nombre]" (saludo decorativo, modelo C trae nombre opcional, no funcional) con "leer el Sheet correcto" (necesidad arquitectónica para multi-escuela). Fito cazó la confusión. Cazada I queda intacta. Lo que hace falta es modelo C distribuido en el sentido de **multi-tenant**, NO multi-rol.

## 2. Big picture del paso 22 (recap)

**Plan original** (paso 22 plan v9, ADICIÓN sesión 4 post-cazada Módulo 0):

- `doGet(e)` en `WebApp.gs` recibe `sheetId` param (~50 LOC).
- HTML página configuración con botón "Configurar mi escuela" + spinner + manejo errores (~80 LOC).
- Modificar `bootstrapTemplate` para escribir link prefab con `=HYPERLINK("https://...exec?sheetId=" & MISHEETID(), "Configurar mi escuela")` en pestaña Arranque (~10 LOC).
- Custom function `MISHEETID()` que devuelve `SpreadsheetApp.getActive().getId()` (~5 LOC).
- Modificar mensaje confirm del F00 a copy específico (~5 LOC).
- Deploy "Execute as user accessing" + "Anyone with Google account".
- Total estimado plan v9: ~150-200 LOC.

**Origen del paso 22**: la directora rural NO puede abrir Apps Script editor desde celular (mobile no muestra menús ni ejecuta scripts asignados). Configuración inicial post-copy del Sheet template requiere ejecutar `bootstrapTemplate` sobre su Drive — el web app público del operador es la única arquitectura realista. Cada escuela tiene su Sheet propio + script container-bound copiado, pero el web app deployment vive en cuenta del operador (porque deployar desde mobile es imposible).

**Plan v3 madre** (`baja-sumar-docente.md`) tenía 20 pasos. El paso 22 NO está ahí. Es ADICIÓN sesión 4 post-cazada Módulo 0. Por eso la pregunta de pre-fase es especialmente relevante: nadie auditó este scope con audit adversarial ni 3-loops como pasó con el plan v3.

## 3. Las 4 preguntas literales aplicadas

### Pregunta 1 — ¿Qué del plan sigue siendo cierto?

Verifico uno por uno post-modelo C:

| # | Entregable plan v9 | ¿Sigue vigente post-modelo C? | Razón |
|---|---|---|---|
| 1 | `doGet(e)` con `sheetId` param | SÍ | Web App único del operador para todas las escuelas. `sheetId` es identifier de tenant (qué escuela), no de auth. Modelo C cambió auth, no targeting. |
| 2 | HTML config con botón + spinner + manejo errores | SÍ | UX necesaria para flow mobile. ~30s espera bootstrap requiere spinner. |
| 3 | `bootstrapTemplate` link prefab con `MISHEETID()` | SÍ | Forma de inyectar `sheetId` dinámico desde el Sheet copiado al link del web app. |
| 4 | Custom function `MISHEETID()` returning `SpreadsheetApp.getActive().getId()` | SÍ | Función trivial necesaria para `=HYPERLINK("...sheetId=" & MISHEETID())`. |
| 5 | Modificar confirm F00 a copy específico | SÍ | Mensaje "esperá 5min, volvé a Tu Panel" sigue aplicando. |
| 6 | Deploy "Execute as user accessing" + "Anyone with Google account" | SÍ | Es la base de modelo C también. NO cambia. |

**Resultado pregunta 1**: el paso 22 plan v9 sigue 100% vigente en su scope original. Nada se cae.

### Pregunta 2 — ¿Qué research técnico es necesario antes de arrancar?

**No validado empírico todavía** (sesión 4 lo asumió por research del agente background, sesión 5 lo dejó como pre-condición pendiente):

- `SpreadsheetApp.openById(sheetIdDirectoraExterna)` desde Web App "execute as user accessing" funciona SIN compartir el Sheet con la cuenta operador. **Crítico** — si falla, paso 22 no funciona y hay que repensar arquitectura completa.

**Validado parcial pero NO suficiente**:

- Chunk C cross-account validó `Session.getActiveUser().getEmail()` — pero ese caso fue Adolfo entrando al Web App del operador y leyendo el Sheet del OPERADOR (driveproyectodai). Validó **cross-account**, NO **cross-Sheet**. Son flujos arquitectónicamente distintos. Sesión 5 reconoce que el snapshot-021 los dejó sonando equivalentes (deuda de honestidad de redacción).

**Test concreto a ejecutar en chunk 22.1** (ANTES de codear backend distribuido):

```
Setup:
- Cuenta externa (ej. adolfoprunotto@gmail.com) crea Sheet vacío en su Drive.
- NO compartir el Sheet con cuenta operador (driveproyectodai).
- Anotar sheetId del Sheet creado.

Función temporal en WebApp.gs (sólo para test, eliminar post-validación):
function _testOpenById(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    return { ok: true, name: ss.getName(), owner: ss.getOwner()?.getEmail() };
  } catch (err) {
    return { ok: false, err: String(err), stack: err.stack };
  }
}

Deploy nueva versión Web App + invocar desde browser logged como cuenta externa:
  https://script.google.com/.../exec?test=openById&sheetId=XXX

Ramas esperadas:
- ok=true + name del Sheet → arquitectura paso 22 viable, seguir a 22.2 backend.
- ok=false con error "No permission" → cuenta operador NO puede abrir Sheet ajeno
  como user accessing → arquitectura paso 22 inválida, repensar TODO.
- ok=false con error de scope → agregar scope `https://www.googleapis.com/auth/spreadsheets`
  al manifest, retest. Si retest pasa: continuar.
```

### Pregunta 3 — ¿Qué features del plan nadie pidió realmente?

Reviso candidatos KITCHEN SINK:

- "Manejo errores" en HTML — necesario, NO es feature opcional. NO cortar.
- "Spinner ~30s" — UX necesaria por friction conocido del runtime (bootstrap es lento). NO cortar.
- "Warning amarillo OAuth" — NO es feature, es friction inherente del runtime. NO se puede cortar (Google Cloud Verification es decisión deliberadamente diferida 4-8 semanas trámite).

**Resultado pregunta 3**: NO encuentro KITCHEN SINK en el paso 22 plan v9. Razón estructural: el paso 22 ya fue minimal por diseño — research del agente background sesión 4 cazó alternativas elegantes (menú custom, botones embebidos, triggers automáticos) y descartó las que fallan en mobile. Lo que quedó es el mínimo viable.

**Aclaración honesta**: el paso 22 NO pasó audit adversarial ni 3-loops como sí pasó el plan v3 madre. La afirmación "ya es minimal" descansa sobre research del agente background sesión 4, NO sobre crítica adversarial. Si Fito quiere segundo audit antes de codear, vale considerarlo. Como NO se identificó KITCHEN SINK candidato concreto, NO recomiendo audit adicional de oficio.

### Pregunta 4 — ¿Qué entregables sobraron y cuáles faltan?

Sesión 5 esbozó: *"el copy del Sheet template post-bootstrap regenera la pestaña 📱 Cómo entrar con la URL nueva del web app de la directora, o queda con la URL del operador?"*

Análisis honesto: la pregunta de sesión 5 abrió una **cazada estructural mayor** que el plan v9 paso 22 NO contempló.

**El problema descomprimido**:

El paso 22 plan v9 trata SOLAMENTE configuración inicial (bootstrap del Sheet copiado de la directora). NO trata uso continuo post-bootstrap (panel admin desde mobile en el día a día) cuando el Sheet de cada escuela es independiente del Sheet del operador.

**Reconstrucción del flujo continuo post-bootstrap**:

Tras paso 22, la directora tiene su Sheet bootstrappeado con pestañas creadas. Pestaña `📱 Cómo entrar` (renombrada en chunk G sesión 5) tiene URL admin + URL panel docentes. ¿A dónde apunta esa URL admin?

Tres arquitecturas posibles:

| Opción | Descripción | Viabilidad |
|---|---|---|
| **A** | Cada directora tiene SU PROPIO Web App deployado en su Apps Script project copiado. La pestaña `📱 Cómo entrar` muestra esa URL personal. | **NO viable** — deploy de Web App requiere Apps Script editor → imposible mobile. Contradice la razón misma del paso 22. |
| **B** | Todas las escuelas usan el MISMO Web App del operador. La pestaña `📱 Cómo entrar` muestra `<URL operador>/exec?role=admin&sheetId=<MISHEETID>`. Modelo C debe expandirse para usar `openById(sheetId)` cuando hay param. | **Viable** — pero requiere modificar `_resolveAuthByEmail` y muchas otras funciones del backend + cliente JS. Scope agregado real. |
| **C** | `deployWebApps()` programático que se ejecuta en bootstrap. | **NO viable** — está en lista "Lo que NO se hace" línea 367 checklist (no existe API usable al 2026-04). |

**Solo B es viable**. Pero B implica scope agregado NO contemplado en paso 22 plan v9.

**Reconfirmación con Fito post-cazada confusión persona-vs-escuela**: cada escuela es SISTEMA INDEPENDIENTE en datos (su Sheet, su `👥 Docentes`, su F00), pero TODAS comparten el web app deployment del operador (porque deploy desde mobile es imposible). Esto NO es centralización de datos, es centralización del runtime web app. Multi-tenant en el sentido SaaS estándar — separación lógica por `sheetId`.

## 4. Funciones afectadas — lista expandida (asesoramiento sesión 5)

Sesión 5 (segunda asesoría) cazó que la primera estimación de sesión 6 (~80-120 LOC) era optimista. La lista honesta de funciones que tocan el Sheet de Docentes y por ende necesitan `sheetId`:

**Backend (Apps Script .gs):**

1. `_resolveAuthByEmail` (WebApp.gs) — auth con `sheetId` opcional.
2. `_readEquipoDocente` (WebApp.gs) — carga inicial del panel admin.
3. `submitOperativoFromPanel` (WebApp.gs) — Marcar/Volvió/Baja desde panel.
4. `submitSumarFromPanel` (WebApp.gs) — Sumar desde panel.
5. `getEquipoDocenteForPanel` (WebApp.gs) — query del listado.
6. `_findEquipoDocenteByEmail` (WebApp.gs) — lookup por email.
7. `handleSumarDocente` (OnSubmitDispatcher.gs) — handler Form operativo Sumar.
8. `handleAuthCheck` (OnSubmitDispatcher.gs) — handler de los 11 forms docentes.
9. `_changeDocenteEstado` (OnSubmitDispatcher.gs) — handler genérico Marcar/Volvió/Baja.

**Frontend (HTML + JS):**

10. `PanelDirectora.html` cliente JS — toda llamada `google.script.run.X(args)` debe pasar `sheetId` en cada call (alternativa: server lo guarda en Session/Properties stateful — más frágil, descarto).

**Posible (verificar en mapeo del plomero chunk 22.0):**

11. `PanelDocentes.html` (path sin role) — verificar si necesita `sheetId` para mostrar info correcta de la escuela.

**LOC estimadas honesta** (sesión 5 calibró): ~+200-280 LOC adicionales, no ~+80-120. Sesión 6 fue optimista en primera estimación.

**Total revisado paso 22**: ~150-200 LOC plan v9 + ~200-280 LOC scope agregado modelo distribuido = **350-480 LOC totales**.

## 5. Artefacto de salida pre-fase

### SCOPE CONFIRMADO

(Plan v9 original que sigue vigente post-cuestionar.)

- `doGet(e)` en WebApp.gs con `sheetId` param para flow configurador.
- HTML página configuración con botón + spinner + manejo errores (separado: `PanelConfigurador.html`).
- Modificar `bootstrapTemplate` para escribir link prefab con `MISHEETID()`.
- Custom function `MISHEETID()`.
- Modificar copy confirm F00.
- Deploy "Execute as user accessing" + "Anyone with Google account".

### SCOPE CORTADO

(Nada del plan v9 paso 22 se descarta tras cuestionar.) Razón: no se identificó KITCHEN SINK candidato.

### SCOPE AGREGADO

(NO contemplado en plan v9 paso 22, emergió de pregunta 4 + asesoramiento sesión 5.)

**A — Modelo C distribuido para uso continuo cross-Sheet (multi-tenant):**

- `_resolveAuthByEmail` modificado para aceptar `sheetId` opcional.
- 6 funciones backend del WebApp.gs propagan `sheetId` al Sheet target.
- 3 handlers OnSubmitDispatcher.gs propagan `sheetId` (con cuidado: dispatcher recibe `e` del Form trigger, NO del web app — verificar en mapeo cómo se inyecta).
- `TuPanelTabBuilder.gs` construye URLs admin + panel docentes con `&sheetId=<MISHEETID()>` dinámico.
- Cliente JS de `PanelDirectora.html` propaga `sheetId` en cada `google.script.run.X(args)`.
- Posible mod `PanelDocentes.html` para leer `sheetId` (verificar mapeo).
- Test empírico cross-Sheet: docente externa entra a SU panel con su `sheetId` y ejecuta Sumar/Licencia/Baja sobre SU `👥 Docentes`.

LOC estimadas: **~200-280 LOC**.

### RESEARCH NECESARIO

(A ejecutar en chunk 22.1 ANTES de codear backend distribuido — bloqueante de TODO el paso 22.)

1. **Test `_testOpenById` cross-Sheet**: detalle en sección 3 (Pregunta 2) arriba.
2. **Verificar comportamiento `PanelDocentes.html`** (path sin role) cuando `sheetId` está presente: ¿necesita leerlo? ¿afecta render?
3. **Verificar idempotencia de `bootstrapTemplate` ejecutado por user accessing externa**: ¿escribe a la pestaña Arranque correctamente? ¿el link prefab con `MISHEETID()` resuelve dinámico o lo necesita escribir como fórmula literal?
4. **Verificar comportamiento `OnSubmitDispatcher` cuando el Form pertenece a un Sheet que NO es el del script bound**: cómo el trigger sabe a qué Sheet escribir respuestas. Crítico para handlers operativos.

## 6. Plan de chunks 22.0 .. 22.6 (asesoramiento sesión 5)

Mismo patrón que el refactor modelo C (sesión 5: chunks A..H). Branch separada del refactor anterior.

```
Branch: feat/paso-22-distribuido (nueva, fork de feat/baja-sumar-docente-v3)
Merge: solo cuando 22.6 pase (no merge intermedio).
ETA total honesta: 6-7 hs activas.
```

| Chunk | Nombre | Output | LOC | ETA |
|---|---|---|---|---|
| 22.0 | Mapeo plomero + 4 preguntas + pre-fase | Este doc + `refactor-paso-22-mapeo.md` a disco | 0 | ~1 h |
| 22.1 | Test empírico `openById` cross-Sheet ANTES de codear | Función temporal `_testOpenById` deployada + ramas validadas | ~30 LOC temporal | ~30 min |
| 22.2 | Backend modelo C distribuido (8+ funciones) | `_resolveAuthByEmail` + 6 funciones WebApp + 3 handlers OnSubmit + tests unitarios | ~150-200 LOC | ~2-3 h |
| 22.3 | Frontend `PanelConfigurador.html` + `doGet` configurador | HTML separado + integración doGet | ~100-130 LOC | ~1 h |
| 22.4 | `TuPanelTabBuilder` con `sheetId` dinámico | URLs admin + panel docentes con `&sheetId=<MISHEETID()>` | ~30-50 LOC | ~30 min |
| 22.5 | Test empírico cross-Sheet end-to-end | Fito como Nelly desde adolfoprunotto con SU propio Sheet bootstrappeado, ejecuta operación Sumar/Licencia/Baja | 0 | ~30 min |
| 22.6 | Smoke + cycle + commit + push | 14/14 PASS + 4/4 PASS + commits limpios + PR push | 0 | ~30 min |

**Por qué chunkificar**: protege contra Alzheimer post-cierre + ventana saturada (cazada estructural sesión 5). Cada chunk cierra con commit + smoke + cycle. Si la ventana satura en 22.4, sesión 7 retoma desde commit limpio sin perder contexto.

**Recomendación sesión 5 explícita**: NO arrancar 22.2 (primer chunk de código) hasta tener mapeo del plomero + test 22.1 pasado + plan de chunks confirmado por Fito con LOC + ETA realistas por chunk.

## 7. Privacidad cross-escuela (omisión que sesión 6 NO consideró)

Detalle arquitectónico que sesión 5 cazó y sesión 6 había omitido:

**El bootstrap inicial** siembra `cfg.director_email` y `teacher_emails` desde el F00 onboarding completado por la directora EN SU Sheet. Su email queda sembrado en `👥 Docentes` de SU Sheet. **El Sheet de la directora externa NO contiene el email del operador** (driveproyectodai).

**Implicancia operativa**:

- El operador (Fito desde driveproyectodai o cuenta personal) NO puede entrar al panel admin de la directora externa por default. Modelo C distribuido leería `👥 Docentes` del Sheet de la directora, NO encontraría el email del operador, le daría "acceso no disponible".
- **Esto es FEATURE, NO bug**: privacidad. La directora rural NO quiere que el operador vea su data operativa de la escuela (docentes, secciones, alumnos) sin invitación explícita.

**Implicancia para soporte**:

- Si el operador necesita ver el panel admin de una escuela para soporte (debugging, ayuda en setup, etc.), requiere mecanismo SEPARADO al web app:
  - Opción 1: la directora comparte su Sheet directamente con el operador via Drive sharing (manual, deliberado).
  - Opción 2: la directora le da acceso a su `👥 Docentes` agregándolo manualmente como docente Activa (entonces SÍ entra al panel via web app con su email + `sheetId` de la escuela).
- Ambas requieren ACCIÓN EXPLÍCITA de la directora — preserva privacidad.

**Decisión arquitectónica explícita** (a documentar en checklist post-paso-22):
- El web app del operador NO da acceso automático al operador a paneles de escuelas externas.
- Soporte cross-escuela requiere mecanismo manual (Drive sharing o agregar como docente).
- Esta decisión NO se revisa en paso 22 — queda como feature de privacidad. Si en uso real con Nelly emerge fricción de soporte, considerar mecanismo opcional v2.

## 8. Cazada estructural emergente — meta-nivel

**Aplicar la costumbre `cuestionar-plan-pre-fase.md` cazó scope agregado real**. Sin esta lente, sub-paso 22.0 hubiera ido directo al mapeo del plomero del scope original (~150-200 LOC), implementado, validado parcial, y la cazada estructural del modelo distribuido hubiera emergido en R9 cuando la cuarta corrida (cambio incremental cross-account) fallara — costo de hacer y deshacer.

**Caso seminal alineado con el de la costumbre**: DAI Fase 3b 2026-04-22 cortó ~500 LOC scope creep aplicando las 4 preguntas. Acá el efecto fue **inverso pero del mismo valor**: no cortó scope, **reveló scope omitido** (~200-280 LOC) que el plan v9 sesión 4 NO había cazado.

Demuestra que la costumbre opera en ambas direcciones: cuestionar pre-fase no es solo "cortar lo que sobra", también es "cazar lo que falta".

**Cazada secundaria sobre la primera estimación de sesión 6**: la sesión 6 estimó +80-120 LOC en primera versión. Sesión 5 cazó la sub-estimación: el modelo distribuido toca ~10 funciones backend + cliente JS + HTML, no solo `_resolveAuthByEmail`. Calibración honesta requiere mapear todas las funciones que tocan el Sheet target ANTES de estimar, no extrapolar de UNA función al total. Aplica feedback `mapeo-plomero-pre-sub-paso.md` al meta-nivel: estimar requiere mapeo previo, no extrapolación.

## 9. Próximo paso (post-dale Fito)

1. Fito da dale al plan revisado v2: ~350-480 LOC totales, 6-7 hs ETA, 7 chunks 22.0..22.6, branch separada `feat/paso-22-distribuido`, privacidad cross-escuela como feature.
2. Sesión 6 escribe `refactor-paso-22-mapeo.md` (mapeo del plomero detallado del scope total) — completa chunk 22.0.
3. Sesión 6 reporta a Fito plan de chunks con LOC + ETA por chunk antes de arrancar 22.1.
4. Fito da dale a 22.1 → sesión 6 deploya función temporal `_testOpenById` cross-Sheet.
5. Si test pasa → 22.2 backend distribuido. Si falla → diagnóstico antes de avanzar (NO arrancar 22.2 con base no validada — aplica feedback `pre-condiciones-empiricas.md`).

## 10. Firma

Pre-fase v2 escrito al inicio de sub-paso 22.0 sesión 6 FORJA DAI siguiente. Aplica costumbre `cuestionar-plan-pre-fase.md` (4 preguntas literales pasadas por sesión 5 vía Fito) + ajustes operativos sesión 5 (LOC realista +200-280, ETA realista 6-7 hs, plan de 7 chunks, privacidad cross-escuela) + cazada Fito sobre confusión persona-vs-escuela (Cazada I intacta, lo que se identifica es escuela vía sheetId, no persona). Aplica feedback `mapeo-plomero-pre-sub-paso.md` (mapeo dedicado al sub-paso, no extrapolar). Aplica feedback `dudas-disfrazadas-de-decisiones.md` (research empírico `openById` cross-Sheet a hacer ANTES de codear, no después). Aplica feedback `gaslighting-ia.md` (sesión 6 reconoce sub-estimación inicial honestamente, no minimiza).

— FORJA DAI siguiente, sesión 6, sub-paso 22.0 pre-fase v2, 2026-05-02.
