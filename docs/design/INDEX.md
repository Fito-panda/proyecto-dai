---
doc: INDEX docs/design proyecto-dai
estado: vivo
fecha_origen: 2026-05-02
origen: sesión 6 cierre — moco "arquitectura imaginaria sin leer código real" disparó necesidad de mapa navegable
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: que cualquier sesión Claude (o Fito) pueda orientarse en 2 minutos sobre qué leer según la tarea, sin volver a inventar lo ya escrito
mutable: sí
---

# INDEX — Documentación del proyecto DAI

Mapa navegable de los docs clave. No es inventario exhaustivo: es la brújula. Cada item dice qué hay adentro en una línea. El path completo está al lado para abrir directo.

DAI = Dirección Asistida desde el Interior. Sistema gratuito open source para escuelas rurales argentinas. Cliente: Fito.

---

## LECTURA OBLIGATORIA AL ARRANCAR SESIÓN

Tres docs y nada más para empezar cualquier sesión nueva sobre DAI:

- **Bases inmutables del proyecto** — qué quiere Fito + qué necesitan las escuelas + non-goals + flow real.
  `proyecto-dai/docs/design/dai-bases-fundamentales.md`
- **Briefing pivote sesión 7** — autocontenido. Estado del pivote a modelo centralizado, decisión 2026-05-02.
  `proyecto-dai/docs/design/dai-pivote-centralizado-briefing-sesion-7.md`
- **Este INDEX** — lo que estás leyendo.

Si vas a abrir más después, el resto del mapa está abajo.

---

## Bases inmutables del proyecto

- **Bases fundamentales** — qué quiere Fito, qué necesitan las escuelas, non-goals, flow real del docente.
  `proyecto-dai/docs/design/dai-bases-fundamentales.md`
- **README** — qué es DAI + cómo empezar en 5 minutos.
  `proyecto-dai/README.md`
- **MANIFEST** — inventario de los 10 artefactos del repo público.
  `proyecto-dai/MANIFEST.md`

---

## Pivote centralizado (decisión 2026-05-02) — VIGENTE

Decisión arquitectónica del proyecto: pasar de modelo distribuido (un Sheet por escuela) a modelo centralizado (Web App único del operador para todas las escuelas). Esta sección manda sobre todo lo que aparece como "modelo distribuido" en docs anteriores.

- **Pivote v0** — primer borrador. 5 preguntas Nivel 1 + ADR pendiente.
  `proyecto-dai/docs/design/dai-pivote-centralizado-v0.md`
- **Briefing sesión 7** — autocontenido para entrar limpio a la próxima sesión.
  `proyecto-dai/docs/design/dai-pivote-centralizado-briefing-sesion-7.md`

---

## Docs de diseño originales

Anteriores al pivote. Siguen vigentes en lo que no contradice la decisión 2026-05-02.

- **01 Problema** — qué resuelve DAI + research del landscape.
  `proyecto-dai/docs/design/01-problema.md`
- **02 Non-goals** — qué NO hace DAI.
  `proyecto-dai/docs/design/02-non-goals.md`
- **03 Arquitectura** — arquitectura declarada (D1 container-bound MIT). Pre-pivote.
  `proyecto-dai/docs/design/03-arquitectura.md`
- **04 Landing WordPress** — spec de la landing pública proyectodai.com.
  `proyecto-dai/docs/design/04-landing-wordpress.md`
- **Sheet Template Design** — spec del Sheet template (8 pestañas).
  `proyecto-dai/docs/Sheet-Template-Design.md`
- **Apps Script README** — setup técnico Apps Script.
  `proyecto-dai/apps-script/README.md`

---

## Plan v3 baja-suplentes (modelo distribuido — implementado V24)

Plan ejecutable que llegó a producción con el modelo distribuido. Vigente como historia y como referencia técnica del refactor modelo C.

- **Plan v3 madre** — los 20 pasos del plan baja-sumar-docente.
  `proyecto-dai/docs/design/baja-sumar-docente.md`
- **Mapeo del plomero — refactor modelo C** — sesión 5.
  `proyecto-dai/docs/design/refactor-modelo-c-mapeo.md`
- **Cierre sesión 5** — plan de continuidad post sesión 5.
  `proyecto-dai/docs/design/cierre-sesion-5-plan-continuidad.md`

---

## DESCARTADOS — no usar

Sesión 6 generó docs basados en una arquitectura imaginaria (modelo X SaaS). NO son base válida para nada. Quedan archivados para historia, no para guía.

- **paso 22 pre-fase cuestionar plan** — DESCARTADO. Modelo X SaaS imaginario.
  `proyecto-dai/docs/design/paso-22-pre-fase-cuestionar-plan.md`
- **refactor paso 22 mapeo** — DESCARTADO. Mapeo paso 22 distribuido cross-Sheet.
  `proyecto-dai/docs/design/refactor-paso-22-mapeo.md`
- **chunk 22.0b research bloqueante cierre** — DESCARTADO. Research sobre arquitectura imaginaria.
  `proyecto-dai/docs/design/chunk-22.0b-research-bloqueante-cierre.md`

---

## Manuales de distribución informal

Para usuarios finales (directivas / docentes). Viven fuera de proyecto-dai.

- **INDEX manuales** — sub-índice de los manuales.
  `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/manuales-distribucion-informal/INDEX.md`
- Módulos 0 a 3 (setup / WhatsApp / uso diario / troubleshooting) + checklist Opción A + datos ficticios + leeme. Todos en la misma carpeta del INDEX de manuales.

---

## Historial — snapshots de sesión DAI

Cierres densos por sesión. Útil cuando hace falta reconstruir qué pasó.

- **snapshot-020** — cierre sesión 4.
- **snapshot-021** — cierre sesión 5 modelo C.
- **snapshot-022** — cazada tool blindness escala mayor (sesión 6 moco).

Carpeta: `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/`

---

## Emergentes — cazadas estructurales

Log vivo de patrones detectados en el proyecto.

- **emergentes.md** — cazadas A-K + 11 cazadas técnicas Apps Script + meta-patrones.
  `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/emergentes.md`

---

## Checklist-pendientes

Pendientes vivos + decisiones arquitectónicas declaradas. Lectura rápida al cerrar sesión.

- `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/checklist-pendientes.md`

---

## Reportes de agentes 2026-05-01

Sesión 5 los dejó preparados. Sesión 6 los ignoró por elegir Camino B. Siguen vigentes para diseño.

- **Frameworks pre-diseño anti-sobreingeniería** — 11 frameworks externos + 5 preguntas Nivel 1 universales + 3 costumbres canonizables.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-frameworks-pre-diseno-anti-sobreingenieria.md`
- **Compilación skills existentes meta-problema** — 20 skills evaluadas.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-compilacion-skills-existentes-meta-problema.md`
- **Destilación preguntas Nivel 1 desde DAI** — 13 preguntas Nivel 1 específicas DAI con ROI medido.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-destilacion-preguntas-nivel-1-desde-DAI.md`
- **Auditor externo alzheimer post-cierre** — 7 patrones para protección post-cierre.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-auditor-externo-alzheimer-post-cierre.md`

---

## Reportes técnicos Apps Script — auditorías adversariales 2026-04-27

Para tocar código Apps Script. Cegueras conocidas y modelo conceptual del plan.

- **Verificación cegueras Apps Script** — CT1/CT2/CT3 (límite 20 triggers + setRequireLogin + tokens URL).
  `CLAUDE-CORE/catedral/reportes-agentes/2026-04-27-verificacion-cegueras-apps-script.md`
- **Abogado del diablo modelo baja-suplentes** — Loop 1.5 modelo conceptual.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-04-27-abogado-del-diablo-sobre-modelo-baja-suplentes-dai.md`
- **Abogado del diablo Loop 3 plan A v2** — Loop 3 plan ejecutable.
  `CLAUDE-CORE/catedral/reportes-agentes/2026-04-27-abogado-del-diablo-loop3-plan-a-v2.md`

---

## Técnica de validación 5 lentes

Caso seminal: aplicación de 5 lentes pre-código.

- `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md`

---

## Memoria persistente proyecto-dai

Path: `~/.claude/projects/C--Users-adolp-Desktop-proyecto-dai/memory/`

`MEMORY.md` indexa los 11 feedback files: pre-condiciones-empíricas / defensive-guard / voz-precursora / tablas / mapeo-plomero / gaslighting-ia / dudas-disfrazadas / no-ofrecer-pausa / tool-blindness / decisiones-tecnicas-atribuidas-falsamente-a-fito / project-daiana.

---

## Costumbres

- **INDEX costumbres** — 18 preservadas + 50 archivadas.
  `CLAUDE-CORE/catedral/costumbres/INDEX.md`
- Las costumbres relevantes para DAI están listadas en el briefing pivote sesión 7, sección 8.

---

## Cómo usar este INDEX

- **Arrancar sesión nueva DAI**: leer bases fundamentales + briefing pivote sesión 7. Nada más antes de hablar.
- **Si vas a tocar código**: sumar manuales de distribución informal + emergentes + reportes técnicos Apps Script 2026-04-27.
- **Si vas a diseñar**: sumar reportes de agentes 2026-05-01 (los 4) y la técnica de 5 lentes.
- **Si Fito menciona algo del modelo distribuido viejo**: ir a "Plan v3 baja-suplentes". Es la implementación que llegó a V24.
- **Si encontrás un doc descartado y no estás seguro**: chequear sección DESCARTADOS antes de tomar nada de ahí como base.
- **Si este INDEX queda viejo**: actualizarlo, no apilarle parches. Lo nuevo reemplaza a lo viejo.
