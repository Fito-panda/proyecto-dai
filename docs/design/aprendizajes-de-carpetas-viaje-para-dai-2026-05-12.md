---
fecha: 2026-05-12
estado: vivo (revisar al planificar DAI plan v10)
proyectos: DAI plan v9 ← Carpetas Viaje Res 59 v1
tipo: matriz inversa de aprendizaje — qué retorna de CV a DAI
proposito: canonizar lo aprendido del proyecto hermano para informar mejoras DAI plan v10+
relacionado: docs/design/matriz-reuso-dai-carpetas-viaje-2026-05-12.md (matriz directa DAI→CV)
mutable: sí — actualizar al cierre del piloto AMIJUGANDO 2026
---

# Aprendizajes de Carpetas Viaje Res 59 para DAI plan v10+

> **Matriz inversa** de la Matriz de Reuso DAI→CV. Capa que documenta qué del proyecto hermano (Carpetas Viaje) retorna a DAI como mejora candidata.

## 0. Frame canonizado

**Asimetría recíproca de cazadas** (canon CLAUDE.md global Base 4 de las 5 bases simbióticas 2026-05-03): Carpetas Viaje recibió **~25% del código DAI directo + ~43% como patrón arquitectónico**. Como contrapartida, en el proceso de implementar CV cazamos cosas que DAI tiene como deuda o decisión sub-óptima. Esta es la devolución del taller Forja al hermano mayor.

Cazada Fito 2026-05-12 04:18: **"canonizar lo aprendido para DAI"** = registrar explícito para no olvidar al planear DAI plan v10.

## 1. Mejoras concretas para DAI plan v10

### 1.1 Importar `UtilsDays.gs` como `services/CordobaCalendar.gs`

**Origen:** Carpetas Viaje necesitaba calcular días hábiles para deadlines Res 59 (10/30/45 días). DAI no tiene.

**Contenido:** Feriados nacionales Argentina 2026 (16 fechas) + feriados Córdoba 2026 (San Jerónimo) + vacaciones escolares invierno 2026. API: `isBusinessDay()`, `businessDaysBefore()`, `countBusinessDaysBetween()`, `businessDaysFromToday()`, `calcDeadlineDate()`.

**Aplicación en DAI:**
- Validar plazos de planificaciones cuatrimestrales (e.g. "este IPE vence en X días hábiles").
- Fechas PIE / PMI.
- Si DAI v10 agrega recordatorios de cualquier tipo (planificación pendiente, IPE no entregado), esto es la base.

**Costo:** ~160 LOC. Bajo. Importar tal cual con header de atribución.

### 1.2 Mitigar D5 (form titles snake_case)

**Origen:** Carpetas Viaje aplicó friendly names desde el inicio en `config-forms.gs` siguiendo `title: 'Nombre completo de la escuela'` + `key: 'school_name'`.

**Problema en DAI:** los 14 fields del onboarding Form DAI tienen `title` en snake_case (`school_name`, `academic_year`, etc.). Cazada DAI 2026-04-21 (commit `352eb8b` R1 fix B2): la directora real ve snake_case y se confunde.

**Mitigación:** refactor `ConfigFormOnboarding.gs` agregando friendly `title` + manteniendo `key` snake_case para la lógica interna. Mapeo automático title↔key como en CV `FORM_FIELD_KEY_BY_TITLE`.

**Costo:** ~30 min de refactor + smoke test. Bajo riesgo de regresión.

### 1.3 Mitigar D6 (helpText placeholder emails pegables literal)

**Origen:** Carpetas Viaje usa orientación en prosa, NO placeholders pegables (`helpText: 'Mail al que llegan las notificaciones del sistema'`, no `helpText: 'ej: nombre@ejemplo.com'`).

**Problema DAI:** algunos helpText en `ConfigFormOnboarding.gs` tienen placeholders que el usuario pegó literal en producción (cazada 2026-04-21 Phase 2 capsule).

**Mitigación:** scrub de los 14 helpTexts, reemplazar placeholders por orientación descriptiva.

**Costo:** ~15 min.

### 1.4 Wirear `_validateOnboardingSchemaCoherence` al bootstrap (D8)

**Origen:** Carpetas Viaje `_validateFormInscripcionSchema()` es invocado en `bootstrapEvent()` step 2 antes de tocar el Form. Detecta keys duplicadas, titles duplicados, types inválidos, choices vacías.

**Problema DAI:** la función `_validateOnboardingSchemaCoherence` existe declarada en `ConfigFormOnboarding.gs` pero **no se llama desde ningún flow** (D8 abierta DAI).

**Mitigación:** invocar `_validateOnboardingSchemaCoherence()` al inicio de `bootstrapTemplate()` en DAI. Si throws, abortar bootstrap.

**Costo:** ~5 min.

### 1.5 Helper manual `rebuildRegistry()` en Main.gs (mitigación parcial D9)

**Origen:** Carpetas Viaje agregó `rebuildRegistry()` entry point en `Main.gs` para reconciliar `PropertiesRegistry` después de `Archivo → Crear una copia` (que limpia las Properties pero no los archivos Drive).

**Problema DAI:** D9 abierta. `IdempotencyService` ya tiene fallback search-by-name (DAI). Pero no hay un entry point manual para forzar reconciliación post-clonado. La primera corrida post-copia funciona vía search pero puede ser lenta.

**Mitigación:** copiar el patrón de `Main.rebuildRegistry()` de CV a DAI. Llama `PropertiesRegistry.wipe()` + corre un sub-bootstrap que re-registra carpetas conocidas. UI confirm previo.

**Costo:** ~30 min.

### 1.6 Form NO usar `setDestination` (decisión opinable)

**Origen:** Carpetas Viaje optó por **NO usar `setDestination`** (que crea Tab nueva "Form Responses N"). En su lugar, `onFormSubmit` trigger source=FORM + handler lee `e.response.getItemResponses()` y escribe directo a la Tab canónica.

**Comparación con DAI:** DAI Fase 2 usa `setDestination` + renombra Tab a `_respuestas_config` + hide. Funciona pero agrega complejidad (timing del setDestination + retry loop con flush+sleep+regex fallback).

**Aplicación a DAI v10:** **opinable.** Si DAI rediseña el flow del Form de onboarding (improbable, está validado en producción), considerar el patrón CV — más simple, sin Tab duplicada, sin retry loops.

**Costo:** alto si se aplica (refactor + re-test producción). Bajo retorno si DAI funciona bien hoy.

**Recomendación:** NO aplicar a DAI v10 a menos que aparezca un bug en `setDestination`.

### 1.7 Tests dentro de `src/tests/` (clasp v3 convention)

**Origen:** Carpetas Viaje usa clasp v3 con `rootDir: src`. Tests fuera de `rootDir` no se suben al Apps Script remoto. CV los puso en `src/tests/SmokeTests.gs`.

**Aplicación DAI:** si DAI usa clasp v2 actualmente (tests en `apps-script/tests/`), al migrar a v3 (recomendado en algún momento) hay que mover a `src/tests/` o expandir rootDir.

**Costo:** ~10 min de migración cuando se decida actualizar clasp.

### 1.8 `Forms.setPublished` API nueva 2026 (radar)

**Origen:** Landscape research 2026-05-12 detectó `Forms.setPublished()` como release 2026.

**Aplicación DAI:** útil si DAI v10 quiere "cerrar planificación al fin de cuatrimestre" — `setPublished(false)` deshabilita el Form temporalmente sin tocar lógica de panel ni borrar el Form.

**Costo:** opcional, feature nueva.

## 2. Lo que NO se importa (intencional)

- **Plantillas con scaffold mínimo** (approach CV): DAI tiene contenido institucional rico en sus 9 plantillas formales — eso vale, no degradar.
- **Multi-tenant**: no aplica a ninguno de los dos sistemas (decisión cerrada).
- **Web App + paneles HTML**: DAI tiene PanelDirectora + PanelDocentes. Carpetas Viaje optó por dashboard = Sheet madre directa. Cada sistema con su modelo correcto para su dominio.
- **Phase filter**: DAI lo necesita (fases pedagógica/institucional/comunicación/admin). CV no lo necesita (1 Form único). No es aprendizaje cross.

## 3. Plan operativo sugerido para DAI plan v10

Si DAI v10 se planifica, integrar como Fase 0 de v10 las mitigaciones bajas (1.2, 1.3, 1.4 = ~50 min total). Las medianas (1.1, 1.5 = ~3.5h) como Fase 1 de v10. La opcional (1.6) sólo si surge bug.

**Costo estimado total importaciones bajas+medianas:** ~4 horas.

## 4. Validación de la matriz inversa post-piloto

Cuando AMIJUGANDO 2026 corra en producción real (~10-jun-2026 tentativo), validar empírico:
- ¿Las decisiones de Carpetas Viaje sostuvieron el peso del piloto?
- ¿Surgieron problemas que retroactivamente cambian estos aprendizajes?
- ¿Aparecieron nuevos aprendizajes no listados acá?

Re-snapshot post-piloto.

## 5. Hilos abiertos cross-proyecto

- **Re-sync periódico:** si DAI v10 implementa estas mejoras, evaluar si CV puede a su vez beneficiarse de cambios DAI v10 (e.g. mejor manejo de `setDestination` si DAI lo refina).
- **Calendario Argentina/Córdoba 2027:** cuando salga el oficial, actualizar `UtilsDays.gs` en CV + (si se importó) en DAI.
- **Skill de cross-vendor delegate:** ninguno de los dos proyectos lo usó en esta sesión. Bandwidth Forja fue suficiente. Si emerge sistema más complejo, considerar delegate a DeepSeek/Qwen.

---

*Forja Claude Code — proyecto-dai worktree `claude/jovial-aryabhata-2cf2b9` — 2026-05-12 04:30. Output de la sesión Carpetas Viaje canonizado para retroalimentar DAI.*
