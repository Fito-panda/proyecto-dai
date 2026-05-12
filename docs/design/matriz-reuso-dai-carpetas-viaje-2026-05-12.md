---
fecha: 2026-05-12
estado: vivo (revisar al cierre de cada fase de Carpetas Viaje + cuando DAI plan v10 commitee)
proyectos: DAI plan v9 (sobre master, 9 commits) → Carpetas Viaje Res 59 v1 (no commiteado todavía, modo diseño)
tipo: matriz de reuso cross-proyecto
proposito: explicitar qué componentes técnicos / aprendizajes / deudas pasan del proyecto hermano DAI al nuevo sistema Carpetas Viaje, antes de que Forja codee la Fase 1
inputs:
  - landscape-stack-google-apps-script-2026-05-12.md (research previo, validó supuestos arquitectónicos)
  - inventario código real DAI vía agente Explore (29 archivos, 5992 LOC)
  - Plan-Tecnico-Forja-Sistema-Carpetas-Viaje-Res-59-v1.md (17 secciones, 975 líneas, recibido del operador 2026-05-12)
  - commits plan v9 DAI: 87356fa Fase 1, 507f762 Fase 2, 352eb8b R1, 650a2e6 Fase 2.5, 364c49c Fase 3a, ae622fd Fase 3b, 5a53b4b cooperadora invisible
mutable: sí
---

# Matriz de Reuso — DAI plan v9 → Carpetas Viaje Res 59 v1

## 0. Cómo leer esta matriz

Tres capas independientes que sirven en momentos distintos del diseño y la implementación:

- **Capa 1 — Componentes técnicos.** Mapping concreto archivo-por-archivo. Sirve para que Forja sepa qué importar, qué adaptar, qué reescribir cuando arranque a codear.
- **Capa 2 — Antipattern import.** Errores y scope cuts cazados en DAI. Sirve para no tropezar dos veces. Frame "reciclar lo aprendido", no solo "reciclar código".
- **Capa 3 — Deudas técnicas heredables.** Deudas DAI abiertas (D5/D6/D8/D9/D10) que afectan al reuso. Sirve para decidir cuáles se mitigan al adaptar y cuáles se replican como hipoteca.

Veredictos Capa 1 por archivo: **REUSAR tal cual** / **ADAPTAR** (forkear + cambios moderados) / **REIMPLEMENTAR sobre patrón** (la arquitectura DAI sirve pero el código es DAI-specific) / **REIMPLEMENTAR desde cero** (sin candidato DAI).

## 1. Capa 1 — Componentes técnicos

### 1.1 REUSAR tal cual (6 archivos · ~349 LOC · primitivas LOW coupling)

| Archivo DAI | LOC | Por qué reusa limpio |
|---|---|---|
| `services/Logger.gs` | 70 | `SetupLog.info/warn/error/flushTo` — log en memoria + flush a tab Sheet. Genérico por diseño, sin domain DAI. Sirve idéntico para `Log` tab de Carpetas Viaje. |
| `services/IdempotencyService.gs` | 66 | `resolveByRegistryOrSearch` / `findFileByMime` / `findFolder` — patrón dual layer registry + Drive search fallback. Genérico. Crítico para idempotencia de `onFormSubmit` Carpetas Viaje. |
| `services/PropertiesRegistry.gs` | 64 | Wrapper `PropertiesService` con timestamps. Genérico key-value. Mismo uso en Carpetas Viaje (tracking de IDs de carpetas/docs/forms creados). |
| `utils/Guard.gs` | 49 | `assert` / `assertNonEmpty` / `retry` con backoff exponencial. Defensivo puro. DriveApp / FormApp pueden fallar transitoriamente igual en Carpetas Viaje. |
| `utils/Types.gs` | 35 | Enums `FIELD_TYPES` / `PHASES` / `ARTIFACT_STATUS`. Reusar tal cual + sumar nuevos enums Carpetas Viaje (`FOLDER_STATUS` con `vacia` / `parcial` / `completa` / `borrador-generado` / `elevada` / `error`). |
| `builders/SheetBuilder.gs` | 65 | `getOrCreate` con idempotencia + tab management. Genérico. Sirve para Sheet madre Carpetas Viaje. |

**Subtotal: 6 archivos / 349 LOC importados sin modificación.**

### 1.2 ADAPTAR (5 archivos · ~1144 LOC con ajustes moderados)

| Archivo DAI | LOC | Adaptación necesaria |
|---|---|---|
| `builders/FormBuilder.gs` | 262 | Generic form item building + `choicesFromList` mecánica. ADAPTAR ligero: el Form de inscripción visitantes (§4.1 Plan Técnico, 22 campos) es schema distinto pero la maquinaria es idéntica. Reusar al 80%. |
| `builders/FolderBuilder.gs` | 92 | `ensureParentFolder` / `ensureYearFolder` / `buildTree`. Adaptar `CFG.PARENT_FOLDER_NAME` (DAI tiene "Escuela", Carpetas Viaje necesita estructura `[Raíz Evento]/carpetas-de-viaje/[Escuela]/[A-F]`). Patrón recursivo intacto. |
| `builders/DocGenerator.gs` | 292 | `generate` con `{{slug}}` placeholders, `_slugify`, `_normalizeResponseData`, `_extractResponseData`. Validado producción DAI F05 (20 placeholders, 0 missing). **Reusar el motor casi tal cual.** El cambio es solo el origen del payload (campos del Form Carpetas Viaje vs DAI). D10 (CHECKBOX_GRID/GRID_SCALE no soportados) sigue siendo limitación heredable — los 22 campos del Form §4.1 Plan Técnico no los usan, safe. |
| `builders/FormOnboardingBuilder.gs` | 399 | Patrón `createAndLink` + recovery post-crash (Drive search por título reusa orphan Forms) + retry loop con flush+sleep+regex fallback para `setDestination` timing. **Patrón crítico, validado producción DAI Fase 2.** ADAPTAR: cambiar schema 14 preguntas DAI → 22 preguntas Form inscripción visitantes. Resolver D5 (friendly names) y D6 (helpText sin placeholders) al adaptar — NO replicar bugs. |
| `services/EmailService.gs` | 152 | Scaffold dormido DAI. ADAPTAR pesado: wirear con mail templates en `_config/templates_mail.gdoc` (§6 Plan Técnico, 8 templates), agregar `GmailApp.createDraft` para flujo elevación a inspección (decisión §5.4: draft + revisión humana, no envío directo). El scaffold vale como punto de partida del módulo, no como código importable. |

**Subtotal: 5 archivos / 1144 LOC adaptados con cambios moderados.**

### 1.3 REIMPLEMENTAR sobre patrón DAI (9 archivos · ~2562 LOC · arquitectura sirve, código DAI-specific)

Los patrones arquitectónicos de estos archivos son la referencia, pero el código es DAI-specific y no se importa.

| Archivo DAI (patrón) | LOC | Equivalente Carpetas Viaje |
|---|---|---|
| `config/ConfigRoot.gs` (CFG lazy via Proxy, lee Sheet config) | 200 | `config.gs` — leer Tab `Config` de Sheet madre con `event_name`, `event_date`, `deadline_business_days`, etc. (§4.2 + §9 Plan Técnico). Reusar pattern Proxy. |
| `config/ConfigForms.gs` (FORMS_CFG array) | 508 | No aplica directo. Carpetas Viaje tiene 1 Form de inscripción, no 11. La declaratividad del schema sí. |
| `config/ConfigFolders.gs` (árbol carpetas dinámico) | 120 | Árbol `[Raíz]/carpetas-de-viaje/[Escuela]/[A/B/C/D/F]` + `_config/plantillas/` + `_consolidado/`. Reusar pattern tree-builder. |
| `config/ConfigDocTemplates.gs` (registry plantilla→Form) | 148 | `DOC_TEMPLATES` para 14-15 plantillas Anexo II (§8 Plan Técnico). Reusar pattern registry. |
| `config/ConfigFormOnboarding.gs` (schema 14 fields) | 217 | Schema 22 campos del Form §4.1. Reusar pattern + `_validateOnboardingSchemaCoherence` (resolver D8 wireando el validador). |
| `builders/ConfigSheetBuilder.gs` (8 tabs canónicas DAI) | 211 | 3 tabs Carpetas Viaje: `Config`, `Visitantes`, `Log` (§4.2 Plan Técnico). Reusar pattern schema-driven. |
| `builders/DocTemplateBuilder.gs` (9 Doc templates DAI) | 416 | 14-15 plantillas Anexo II: A-nota-elevación, B-fundamentación-pedagógica, B-cronograma, B-ruta-sanitaria, C-planilla-alumnos, C-autorizaciones, D-planilla-docentes, F-checklist-transporte, etc. Reusar pattern factory `_buildTemplateXxx`. |
| `builders/ListasMaestrasBuilder.gs` (listas DAI: docentes/alumnos/secciones/espacios) | 156 | Probablemente NO se necesita en Carpetas Viaje v1 (cada escuela visitante carga sus propios datos en su carpeta, no hay dropdowns compartidos). Confirmar al diseñar el Form §4.1 — si necesita dropdown "Zona de inspección" con valores fijos, reusar pattern. |
| `orchestration/SetupOrchestrator.gs` (orden setup DAI) | 240 | `setupVisitor` (post-onFormSubmit): crear carpeta visitante → 5 subcarpetas A/B/C/D/F → copiar plantillas → compartir editores → escribir IDs → log. Reusar pattern orchestrator pero secuencia distinta. |

**Subtotal patrón: 9 archivos / 2216 LOC de referencia arquitectónica.**

Plus 3 archivos más sin LOC count exacto pero patrón reusable:
- `orchestration/TemplateBootstrapper.gs` (97) → `bootstrapEvent` para Carpetas Viaje.
- `orchestration/FormalFormsTriggerManager.gs` (321) → `TriggerManager` Carpetas Viaje (onFormSubmit inscripción + time-based 15min drive-watcher + daily reminders).
- `Main.gs` (221) → entry points específicos Carpetas Viaje.

**Subtotal Capa 1.3 ampliado: 12 archivos.**

### 1.4 REIMPLEMENTAR desde cero (sin candidato DAI)

| Componente Carpetas Viaje (§3.3 + §5 Plan Técnico) | Por qué no hay candidato DAI |
|---|---|
| `drive-watcher.gs` (time-based 15min: cuenta archivos por subcarpeta + escala status `vacia → parcial → completa`) | DAI no tiene polling continuo del Drive. Forms se llenan vía submit, no se monitorea contenido de carpetas. |
| `reminders.gs` (daily trigger 09:00: calcula días hábiles a deadline + envía recordatorios 5d/3d/1d/0d) | DAI no tiene deadlines. Plazos Res 59 son novedad de Carpetas Viaje. |
| `consolidator.gs` (genera ZIP de A/B/C/D/F + portada PDF + `GmailApp.createDraft` con destinatario inspección) | DAI no consolida ni eleva a autoridad externa. Único nuevo flujo significativo. |
| `utils-days.gs` (días hábiles + feriados nacionales + feriados provinciales Córdoba + calendario escolar) | DAI no calcula días hábiles. Logic nueva. |
| `validation.gs` (reglas mínimas por subcarpeta A/B/C/D/F + warnings de coherencia) | DAI no valida contenido de subcarpetas. Logic nueva. |
| `utils-permissions.gs` (manejo de permisos Drive: editor/comentador/lector por rol) | DAI hace compartir inline en `SetupOrchestrator.gs` step 6.5 sin abstraer. Mejor abstracción explícita en Carpetas Viaje. |

**Subtotal: 6 archivos desde cero.**

### 1.5 NO APLICA (DAI tiene, Carpetas Viaje no necesita)

- `services/PhaseFilter.gs` (67 LOC) — Carpetas Viaje no tiene fases pedagogica/institucional/comunicacion. Descartar.
- `builders/TuPanelTabBuilder.gs` (171 LOC) — DAI lo usa para tab con URLs públicas de paneles. En Carpetas Viaje el dashboard es la propia Tab `Visitantes` de la Sheet madre (no hay panel público separado, anfitriona ve el dashboard en el Sheet directamente). Probablemente NO se necesita un equivalente. Confirmar al diseñar UX.
- `webapp/WebApp.gs` + `PanelDirectora.html` + `PanelDocentes.html` (666 LOC combinados) — DAI tiene Web App con paneles públicos para directora + docentes. **Carpetas Viaje según el Plan Técnico actual NO tiene Web App** — el dashboard es la Sheet madre + menú custom (§5.4). Si en algún momento Carpetas Viaje quisiera un panel para visitantes (e.g. cada escuela ve solo su carpeta en HTML mobile), reusar pattern MVC router + HTML responsive de DAI. Por ahora: NO.
- `tests/SmokeTests.gs` (368 LOC) — Tests DAI-specific. Reusar pattern test harness, no el código.

## 2. Capa 2 — Antipattern import

Errores cazados en DAI plan v9 que Carpetas Viaje hereda como aprendizaje. Frame "no tropezar dos veces con las mismas piedras".

### 2.1 KITCHEN SINK antipattern (Fase 3b DAI · 2026-04-22)

DAI descartó en Fase 3b: PDF generator, email flow, programmatic `deployWebApps`. Razón: "nobody asked", "KITCHEN SINK antipattern".

**Aplica a Carpetas Viaje:** §14 del Plan Técnico ya lista "fuera de alcance v1" (validación de contenido, firma digital, integración SGE, multi-tenant, etc.). Respetar estricto. Si surgen features durante la implementación, registrar en §15 como "idea futura v2", no agregar al scope v1.

**Cazada cross-proyecto:** la genericidad arquitectónica del sistema (configurable por evento via Tab Config) NO es kitchen sink — es higiene básica. La línea está en features que nadie pidió.

### 2.2 Cooperadora descartada por roles múltiples (2026-04-26)

DAI descartó cooperadora porque el modelo "1 directora ve todo" no soportaba presidente/tesorero (roles múltiples).

**Aplica a Carpetas Viaje:** chequear que el modelo de roles del sistema (anfitriona / visitantes / inspección) no rompa el supuesto. Hoy en el Plan Técnico:
- Anfitriona: `host_school_director_email` (Nely) — editor de todo.
- Visitantes: `director_email` + `teacher_email` — editor de su carpeta.
- Visitantes secundarios: `school_email` — comentador.
- Inspección: solo recibe mail con ZIP adjunto (no acceso Drive).

**Veredicto:** modelo simple, sin roles múltiples acumulables. OK. Si surge necesidad de "acompañante no docente con rol propio en el sistema" (más allá del campo de datos), revisar antes de implementar.

### 2.3 Programmatic deploy descartado (validado por landscape research 2026-05-12)

DAI Fase 3b descartó `deployWebApps()` programático "no usable API as of April 2026". Landscape research validó: sigue inaccesible para cuenta Gmail personal sin GCP configurado al 12-may-2026.

**Aplica a Carpetas Viaje:** NO automatizar deploy del Web App (si Carpetas Viaje eventualmente agrega Web App). Si lo agrega, owner `dev.bmlacumbrecita@gmail.com` ejecuta deploy manual una vez.

### 2.4 R1 repair fixes (B1 / B2 / B3 · 2026-04-21 commit `352eb8b`)

DAI cazó en piloto end-to-end 3 bugs funcionales:
- B1: `section_count` ignorado, siempre 3 secciones hardcoded.
- B2: 11 de 14 fields del onboarding eran NOOP (solo 3 llegaban al código via CFG).
- B3 (= D7): `PhaseFilter` ignoraba `cooperadora_activa`.

**Aplica a Carpetas Viaje como aprendizaje preventivo:** cualquier flag del Form de inscripción (`event_scope`, `deadline_business_days`, `transport_type`, `management_type`) tiene que llegar al código vía CFG completo, no parcial. Cuando se diseñe `config.gs` para Carpetas Viaje, declarar TODOS los 22 campos del Form §4.1 + 18 campos de la Tab Config §4.2 como `CFG.field_name` lectura directa, no asumir que "lo importante son 3".

### 2.5 Onboarding Form titles snake_case → friendly names

DAI tiene D5 abierta: form titles snake_case confunden a directoras reales. Al adaptar `FormOnboardingBuilder` para Carpetas Viaje, definir friendly names desde el inicio.

Mapeo sugerido (preliminar, refinar al diseñar):
- Sin `school_name` → "Nombre completo de la escuela visitante"
- Sin `cue` → "CUE de la escuela"
- Sin `transport_type` → "¿Viajan con transporte propio o público?"
- Etc.

## 3. Capa 3 — Deudas técnicas heredables (D5-D10)

Deudas DAI abiertas que afectan reuso. Decisión por cada una: REPLICAR (heredar como hipoteca), MITIGAR (resolver al adaptar), o NO APLICA.

| ID | Descripción DAI | Decisión Carpetas Viaje |
|---|---|---|
| D5 | Form titles en snake_case | **MITIGAR** al adaptar `FormOnboardingBuilder` — friendly names desde inicio (ver §2.5 arriba). |
| D6 | `helpText` con placeholder emails que usuarios pegan literal | **MITIGAR** al adaptar — helpText sin placeholders, usar ejemplos genéricos como "ej: maria.lopez@ejemplo.com" o dejar vacío. |
| D7 | `PhaseFilter` no respetaba `cooperadora_activa` | **RESUELTO en R1 DAI** (`352eb8b`). NO APLICA a Carpetas Viaje (no usa PhaseFilter). |
| D8 | `_validateOnboardingSchemaCoherence` declarado pero no auto-run | **MITIGAR** al adaptar — wirear en flujo bootstrap Carpetas Viaje (e.g. `Config.dry_run = true` invoca validador, o `bootstrapEvent` lo corre antes de crear Form). |
| D9 | `PropertiesRegistry` NO sobrevive `File → Make a copy` | **BLOCKER potencial heredable.** §9 Plan Técnico dice "Cómo clona otra escuela" (paso 4: "Re-crear los triggers" sin mencionar registry rebuild). Si Carpetas Viaje se clona por otra anfitriona, hereda exactamente el mismo problema. **Mitigación posible:** `IdempotencyService.gs` (LOW coupling, REUSAR) tiene fallback de búsqueda por nombre que funciona aún sin registry. Documentar en §9 que post-clonado la primera corrida puede ser lenta pero correcta. Considerar `rebuildRegistry()` helper como entry point manual en `Main.gs`. |
| D10 | `CHECKBOX_GRID` / `GRID_SCALE` shapes no soportados por `_normalizeResponseData` | **NO APLICA hoy** — los 22 campos del Form Carpetas Viaje §4.1 NO usan grid types (Texto / Email / Número / Lista / Checkbox individual). Safe sin mitigar. Anotar para vigilar si Form crece. |

## 4. Métricas

| Métrica | Valor |
|---|---|
| Total código DAI | 29 archivos / 5992 LOC |
| REUSAR tal cual | 6 archivos / 349 LOC (5.8%) |
| ADAPTAR | 5 archivos / 1144 LOC (19.1%) |
| Patrón reusable (reimplementar sobre referencia) | 12 archivos / ~2562 LOC (42.8%) |
| Sin candidato DAI (desde cero) | 6 archivos Carpetas Viaje |
| NO APLICA | 4 archivos / 1272 LOC (descartados) |

**Lectura:** del esqueleto técnico DAI, **~25% del código (REUSAR + ADAPTAR) se reaprovecha directamente**. Plus **~43% sirve como referencia arquitectónica**. Total impacto de DAI en Carpetas Viaje: ~68% del trabajo arquitectónico ya está hecho. Lo nuevo es dominio Res 59 + 6 archivos de funcionalidades específicas (drive-watcher, reminders, consolidator, utils-days, validation, utils-permissions).

Estimación previa del agente "21-31 horas" para Carpetas Viaje queda calibrada: con esta matriz disponible, **el límite inferior baja** (no se reimplementan primitivas) y **el reuso reduce superficie de bugs nuevos**.

## 5. Próximo paso recomendado

Antes de codear cualquier línea de Carpetas Viaje:

1. **Esperar JI 12-mayo-2026 (mañana)** para confirmar destino AMIJUGANDO 2026 + listado definitivo de escuelas visitantes + mail inspectora + posibles novedades Res 59 (Hallazgo 5 del landscape).
2. **Volver al Plan Técnico Carpetas Viaje y agregar §X "Matriz de Reuso DAI"** referenciando este doc. La otra IA (Claude.ai web que produjo v1) puede incorporar Capa 1 directo al §3.3 (Estructura de archivos) con anotaciones REUSAR/ADAPTAR/REIMPLEMENTAR.
3. **Decidir worktree** para Carpetas Viaje. Recomendación previa: worktree nuevo separado del mismo repo DAI (ver Cazada 4 del exchange con la otra IA 2026-05-12). Permite reuso limpio de los 6 archivos LOW coupling.
4. **Arrancar Fase 1 del Plan Técnico** (esqueleto: cuenta institucional + carpeta raíz Drive + Sheet madre 3 tabs + Apps Script vacío vinculado) solo después de (1)-(3).

## 6. Hilos abiertos cross-proyecto

- **Hallazgo 5 landscape pendiente verificación humana** — Daiana o Nely consulta al Ministerio si hay reglamentaciones complementarias a Res 59/2026 publicadas 29-abr a 12-may.
- **D9 PropertiesRegistry no sobrevive copy** — afecta cualquier sistema Apps Script clonable. Si DAI plan v10 lo resuelve, Carpetas Viaje hereda fix.
- **Carpetas Viaje podría retroalimentar DAI** — `utils-days.gs` (días hábiles + calendario escolar Córdoba) que hoy se reimplementa desde cero podría ser útil eventualmente en DAI (e.g. validar plazos de planificaciones, fechas de PIE). Si Carpetas Viaje lo desarrolla limpio y genérico, queda candidato a `services/CordobaCalendar.gs` en DAI v10.
- **Possible mejora bonus del landscape:** `Forms.setPublished` (release 2026, no usado por DAI todavía) — útil para publicar/despublicar Form de inscripción Carpetas Viaje al arrancar/cerrar inscripciones. También útil para DAI plan v10 si se decide cerrar planificación al fin de cuatrimestre.

---

*Forja Claude Code — proyecto-dai worktree `claude/jovial-aryabhata-2cf2b9` — 2026-05-12 02:09. Basado en landscape research 2026-05-12 + inventario código real DAI vía agente Explore.*
