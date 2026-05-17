---
doc: proyecto-dai/docs/design/cierre-sesion-3-plan-continuidad
estado: vivo — plan de cierre
fecha_origen: 2026-04-30
origen: sesión 3 FORJA DAI siguiente, post-cierre paso 17 + push de 8 commits a GitHub PR. Fito pidió armar plan usando los mapeos aprendidos en la sesión para evaluar qué cerrar acá vs qué seguir en sesión 4. Auto-evaluación con mapeo del plomero pre-código aplicado a paso 18 y paso 20.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: documentar la decisión de cierre de sesión 3 con análisis comparativo de costo/complejidad/criticidad de los pasos pendientes (18 + 20). Sirve como referencia ejecutable para que la sesión 4 arranque sin re-evaluar lo mismo. Aplica las lecciones aprendidas en sesión 3 sobre mapeo del plomero pre-código + validación 5-lentes.
mutable: sí
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# Cierre sesión 3 + Plan continuidad sesión 4

> Mapeo del plomero pre-código aplicado a los 2 pasos pendientes del plan v3 (18 + 20) para decidir qué cerrar en sesión 3 vs qué dejar para sesión 4. Output: recomendación con razones, según costo, complejidad técnica + redacción, y criticidad para escala 50.000 alumnos / 10.000 docentes.

## 1. Estado al cierre sesión 3

**Plan v3 al 18/20 (90%)** completo y pusheado a GitHub PR.

Pendientes finales:
- Paso 18 — Sección "Mi equipo hoy" + vista detalle.
- Paso 20 — Docs (alinear/crear landing + README + non-goals + arquitectura).

Commits pushed sesión 3 (8 totales):
- proyecto-dai (5): paso 19 ciclo de vida + paso 17.1 backend + paso 17.2 frontend HTML/CSS + paso 17.3 JS + fixes SPOF 95/96/97 + docs design.
- CLAUDE-CORE (3): caso seminal 5-lentes + snapshot-019 + checklist update.

Producción driveproyectodai V15 corriendo. Re-consent OAuth de Nelly hecho una sola vez (LockService scope nuevo). 9 docentes en `👥 Docentes` + TestPanel Robot residual en Bajas (post-Test 8).

**Caso seminal validación 5-lentes pre-código** documentado: 94 SPOFs identificados pre-código, 75 fixeados, 19 aceptados, 3 emergentes en validación post-código (todos fixeados en misma sesión). Cobertura empírica ~97%.

## 2. Lecciones consolidadas en sesión 3

Aplicar en próximas sesiones:

1. **Mapeo del plomero por sub-paso** (no extrapolar global del paso entero). Memoria: `feedback_mapeo-plomero-pre-sub-paso.md`.

2. **Validación 5-lentes pre-código** (combinatoria mapeo del plomero + abogado del diablo + cuadro semiótico temporal + mapa de empatía + auditor técnico externo). Caso seminal: `caso-estudio-validacion-5-lentes-paso-17-3.md`. Costo ~320k tokens compute + ~5 min wait. Cobertura empírica ~97%. Aplicar en sub-pasos grandes (frontend complejo, código que afecta a usuario final no técnico).

3. **Loop de fix con re-listado fresh**. NO inercia de lista vieja. Re-evaluar causalidad cada iteración (Fito cazó esto en sesión 3 cuando la inercia se repetía).

4. **Pre-condiciones empíricas** entre sesiones. Verificar empírico antes de asumir. Memoria existente.

5. **NO patear pelota a otra sesión**. Si hay cuota y contexto, terminar.

6. **Tablas en chat OK** cuando ayudan. System reminders contextuales no son reglas universales sin verificar. Memoria `feedback_tablas-en-chat.md`.

7. **FITO DECIDE diseño/arquitectura/canon. CLAUDE EJECUTA implementación operativa**. No pasar pelota innecesariamente con decisiones técnicas operativas dentro de un plan ya cerrado.

8. **A escala 50k alumnos / 10k docentes** el costo de mapeo + 5-lentes pre-código es trivial vs costo de soporte por bugs en producción.

## 3. Mapeo del plomero pre-código — paso 18

### Aclaración post-lectura del plan v3 §6

El plan v3 muestra mockup donde "Mi equipo hoy" es **resumen NUMÉRICO** del equipo (3 counts con íconos) DISTINTO de "Mis docentes" (que ya hicimos en paso 17 como Equipo Docente con cards detalladas).

La **vista detalle** (frase "Ver detalle →") según plan v3 §6 es "tarjetas agrupadas por Estado" — eso YA ESTÁ HECHO en paso 17 (Equipo Docente con `<details>` colapsables). El "Ver detalle →" del paso 18 es **scroll/anchor a la sección Equipo Docente existente**, no implementar otra vista paralela.

→ Paso 18 es pequeño: solo agregar el resumen numérico arriba.

### Lo que NO va al paso 18

- NO toco backend (`ctx.equipo` ya tiene los counts vía `.length`).
- NO toco Equipo Docente (paso 17 cerrado).
- NO toco dialogs ni mutates.
- NO duplico funcionalidad existente.

### 6 dimensiones

**Agua:** counts derivados de `ctx.equipo.activas.length / .licencia.length / .bajas.length`. Server-side render initial + cliente sincroniza post-mutate.

**Muros:** único archivo `PanelDirectora.html`. HTML nueva sección + CSS prefix `.eq-resumen-` + JS scroll handler + sync con `_updateGroupCounts` existente.

**Uniones:** scroll a anchor de Equipo Docente al tap "Ver detalle →". Counts updates post-mutate via extender `_updateGroupCounts()`.

**Efectos:** post-mutate exitoso → cliente actualiza counts en Mi equipo hoy + headers de Equipo Docente → Nelly ve número actualizado al instante.

**Orden:** server-render initial → JS attached on DOMContentLoaded → tap "Ver detalle" → scroll smooth + auto-expand sección Bajas si colapsada.

**SPOFs estimados (5):**
- SPOF 98: counts desync tras mutate si no extiendo `_updateGroupCounts`. Outcome (a) extender la función para incluir la sección resumen.
- SPOF 99: SPOF 98 también aplica a Sumar y Baja exitosos. Cubierto por SPOF 98 fix.
- SPOF 100: "Ver detalle →" debería expandir Bajas si colapsada al click. Outcome (a) scroll + expand programático del `<details>`.
- SPOF 101: alinear texto "este año" del mockup vs "Dadas de baja (N)" actual. Outcome decisión Fito al codear.
- SPOF 102: ¿íconos ✓ ↻ ✗ se entienden sin label? Outcome: usar números grandes + label texto, NO solo iconos.

### Costo

- HTML: ~30 líneas (sección + 3 contadores).
- CSS: ~40 líneas (estilos `.eq-resumen-*`).
- JS: ~15 líneas (scroll handler + extender counts update).
- Total: ~85 líneas.

Tiempo estimado: 30-45 min codeo + 15 min validación visual + 10 min commit + push = **~1 hora**.

Validación 5-lentes pre-código: **NO necesaria** (paso liviano, lectura-solo, defensive, reusa toda infraestructura del 17). Mapeo del plomero solo basta.

## 4. Mapeo del plomero pre-código — paso 20

### Aclaración post-verificación empírica

El plan v3 §15 dice "alinear" 4 docs:
- `docs/design/04-landing-wordpress.md`
- `README.md` (raíz)
- `docs/design/02-non-goals.md`
- `docs/design/03-arquitectura.md`

**Verificación empírica con Glob** (sesión 3): SOLO `README.md` existe en raíz + `docs/Sheet-Template-Design.md` + `apps-script/README.md`. Los otros 3 (`01-problema.md` + `02-non-goals.md` + `03-arquitectura.md` + `04-landing-wordpress.md`) **NO EXISTEN** — el README.md actual los referencia con links rotos.

→ Paso 20 NO es solo "alinear", es **CREAR 4 docs nuevos + actualizar README.md** para reflejar el MVP real (PanelDirectora con token + ciclo gestión de docentes paso 17 + caso seminal 5-lentes que NO está mencionado en README actual).

### Lo que NO va al paso 20

- NO toco código.
- NO toco landing wordpress externa (Fito en WordPress directo, los .md son spec del texto público).
- NO escribo features que no estén en MVP real (anti-promesa).
- NO uso jerga ministerial (Cazada J "Lenguaje de Nely").

### 6 dimensiones

**Agua:** docs vacíos / inexistentes / outdated → docs alineados con el MVP implementado en sesiones 2 y 3.

**Muros:** 5 archivos:
- `docs/design/01-problema.md` — CREAR.
- `docs/design/02-non-goals.md` — CREAR.
- `docs/design/03-arquitectura.md` — CREAR.
- `docs/design/04-landing-wordpress.md` — CREAR.
- `README.md` — ACTUALIZAR.

**Uniones:**
- README ↔ los 4 docs (links cruzados, hoy rotos).
- 04-landing-wordpress ↔ proyectodai.com (texto que Fito copia/pega a la landing externa).
- 03-arquitectura ↔ código real (TokenService, LockService, paneles separados Directora vs Docentes, validación 5-lentes como costumbre del taller).

**Efectos:** README + landing actualizadas → primera impresión de directoras reales y mantenedores. A escala 10k docentes la landing es la entrada al producto. Mal escrito = pérdida masiva de conversión.

**Orden:** primero `01-problema` (define el por qué), luego `02-non-goals` (delimita scope), luego `03-arquitectura` (cómo), luego `04-landing-wordpress` (texto público), luego actualizar `README.md` como overview consolidado con links cruzados verificados.

**SPOFs estimados (6):**
- SPOF 103: anti-promesa. Documentos prometen features que NO están en MVP (cooperadora cerrada, rotación tokens v1.1, Mi equipo hoy si no se hizo). Outcome (a) verificar contra código real antes de cada claim.
- SPOF 104: jerga ministerial / técnica. Outcome (a) aplicar Cazada J "Lenguaje de Nely no Ministerio". Tono criollo, ejemplos concretos.
- SPOF 105: arquitectura outdated por cambios sesión 2 y 3 (TokenService, paneles separados, validación 5-lentes, secciones colapsables, etc.). Outcome (a) reflejar real, no v9 viejo.
- SPOF 106: cross-refs rotas. Outcome (a) verificar con grep + abrir links.
- SPOF 107: non-goals incompletos (no lista todos los items v1.1 backlog). Outcome (a) pull explícito desde checklist `Pendientes para producción`.
- SPOF 108: 04-landing-wordpress es **texto público crítico**. Si la landing es jerga, escala 10k docentes pierde la mayoría. Outcome (a) aplicar 5-lentes con foco UX humano (3 lentes humanas + 2 técnicas) ANTES de redactar.

### Costo

- 01-problema: ~150 líneas.
- 02-non-goals: ~200 líneas.
- 03-arquitectura: ~400 líneas (decisiones técnicas + caso seminal 5-lentes).
- 04-landing-wordpress: ~250 líneas (texto público + estructura del sitio).
- README update: ~50 líneas modificadas.
- Total: ~1.000 líneas redacción.

Tiempo estimado: 3-5 hs redacción + 1 h revisión con Fito + 30 min commits + push = **~5-6 hs**.

Validación 5-lentes pre-código: **SÍ necesaria** para `04-landing-wordpress.md` (alto impacto público, jerga matters, escala 10k docentes). Mapeo del plomero solo para los otros 4 docs internos.

## 5. Análisis comparativo paso 18 vs paso 20

| Criterio | Paso 18 | Paso 20 |
|---|---|---|
| Costo tiempo | ~1 h | ~5-6 hs |
| Líneas | ~85 | ~1.000 |
| Complejidad técnica | Baja | Media |
| Complejidad redacción | Nula | Alta |
| SPOFs estimados | 5 | 6 |
| Riesgo emergente | Bajo | Medio |
| Necesita 5-lentes | No | Sí (al menos 04-landing) |
| Necesita Fito presente | Bajo | Alto |
| Bloqueante para MVP | Bajo | Medio |
| Crítico para escala 10k docentes | Bajo | Alto |
| Reversibilidad | Alta | Alta (solo docs) |

## 6. Decisión recomendada

**Cerrar sesión 3 acá.** Plan v3 18/20 cerrado limpio. Caso seminal documentado. Todos los commits pusheados.

**Sesión 4 arranca con paso 20** (docs primero porque crítico para escala 10k docentes, requiere Fito presente para decisiones de redacción).

**Sesión 5 (o final de sesión 4 si alcanza tiempo): paso 18** (cierre liviano, después que docs estén bien).

### Razones

1. Paso 20 es crítico para escala. Landing y README son la primera impresión de directoras reales. Mal escrito = pérdida de conversión a escala 10k docentes.
2. Paso 20 requiere decisiones de Fito (microcopy, tono, ejemplos) → mejor sesión fresh con Fito presente y descansado.
3. Paso 18 es nice-to-have UX. Cerrarlo después de docs no rompe nada.
4. El mapeo de paso 20 reveló que NO es solo "alinear" sino "crear 4 docs + actualizar README" — scope mayor que el plan v3 sugería. Mejor sesión dedicada.
5. Sesión 3 cierra con cuota disponible (~79% contexto restante al armar este plan) para que sesión 4 arranque fresh.
6. Aplicar L1 + L2 + L3 + L8 de las lecciones consolidadas: cuando un paso es grande y crítico, mapeo + 5-lentes pre-código vale la pena. Sesión dedicada le da el tiempo correcto.

### Alternativa: si Fito al volver prefiere paso 18 ahora

Si Fito prefiere cerrar paso 18 en sesión 3 antes de paso 20, también es válido:
- Plan v3 cierra al 19/20 (95%) en sesión 3.
- Sesión 4 solo tiene paso 20 (focus único 5-6 hs).

Trade-off: paso 18 después de larga sesión 3 puede arrastrar fatiga cognitiva. Aceptable porque es liviano.

Mi voto sigue siendo cerrar acá, pero respeto la llamada de Fito al volver.

## 7. Decisiones técnicas pre-cerradas para sesión 4

(Para que sesión 4 NO tenga que decidir lo mismo de cero.)

**Paso 18 cuando se haga:**
- Posición sección: entre "Estado de tu configuración" y "Equipo Docente".
- Mostrar números grandes + label texto, NO solo emojis (Cazada J — claridad sobre estética).
- "Ver detalle →" hace smooth scroll a Equipo Docente y expande Bajas si colapsada.
- Counts auto-update post-mutate via extender `_updateGroupCounts()`.
- NO 5-lentes (mapeo solo basta — paso liviano).

**Paso 20 cuando se haga:**
- Tono: criollo argentino rural, NO jerga ministerial (Cazada J).
- Aplicar 5-lentes a `04-landing-wordpress.md` ANTES de redactar (alta criticidad UX público).
- Mapeo del plomero a los 4 docs internos (01 + 02 + 03 + README update).
- Verificar empírico contra código real (anti-promesa, evitar SPOF 103).
- Cross-refs verificadas con grep al final.
- Caso seminal validación 5-lentes mencionado en `03-arquitectura.md` como costumbre del taller (caso N=1 hasta sesión 4).

## 8. Lecciones que aplicar en sesión 4

Las 8 lecciones consolidadas en sección 2 de este doc. Especialmente:
- L7: FITO DECIDE diseño/redacción de docs. Yo propongo drafts.
- L8: A escala, mapeo + 5-lentes pre-código son triviales en costo vs beneficio.
- L1+L2 combinadas: para paso 20, mapeo del plomero por archivo + 5-lentes para 04-landing-wordpress.

## 9. Referencias cruzadas

- Caso seminal 5-lentes: [`analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md`](../../../catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md).
- Snapshot completo sesión 3: [`analisis-patrones-dai/snapshot-019-sesion-3-paso-17-validacion-5-lentes.md`](../../../catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-019-sesion-3-paso-17-validacion-5-lentes.md).
- Plan técnico paso 17.3: `paso-17-3-preview-consolidado.md`.
- Mapeo plomero fixes 17.3: `paso-17-3-fix-spof-96-97-mapeo.md`.
- Prompt continuidad sesión 4: [`prompt-sesion-4-arranque.md`](../../../catedral/proyectos-anexos/dai-escuelas-rurales/prompt-sesion-4-arranque.md).

— FORJA DAI siguiente, sesión 3 cierre, 2026-04-30.
