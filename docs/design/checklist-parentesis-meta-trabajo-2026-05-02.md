---
doc: checklist/parentesis-meta-trabajo-2026-05-02
estado: vivo — actualizar al cerrar cada item
fecha_origen: 2026-05-02
proposito: checklist persistente del paréntesis meta-trabajo dentro de sesión 6 DAI post-compactación. Sobrevive compactación. TodoWrite es vista en vivo, este archivo es fuente de verdad.
mutable: sí
relacionado: snapshot-parentesis-cazada-concurrencia-y-ceguera-cli-2026-05-02.md
---

# Checklist paréntesis meta-trabajo 2026-05-02

> Orden por dependencia, no cronología. Una a la vez. Marcar `[x]` al completar.

## Bloque A — Verificación empírica del entorno

- [ ] **A1.** Verificar git proyecto-dai + docs nuevos sesión paralela (concurrencia inter-sesión).
- [ ] **A2.** Verificar `Forja-Backup-Daily` corrió 03:00 AM (valida Task Scheduler para tasks Daily aunque AtLogOn esté roto).

## Bloque B — Updates de docs (UX antes de housekeeping)

- [ ] **B1.** Sumar 3 cazadas UI al `CLAUDE-CORE/MACHETE-FITO.md`:
  - Links relativos al cwd (no globales).
  - Tool `request_directory` para expandir acceso.
  - Session folder boundary de Claude Code UI.
- [ ] **B2.** Actualizar `CLAUDE-CORE/catedral/reportes-agentes/INDEX.md` con entrada `2026-05-02-research-anthropic-features-2026-01-2026-05.md` (sub-categoría Research).

## Bloque C — Decisión analítica

- [ ] **C1.** Decisión bitacorista-py: archivar formal vs reformular como capa que enriquece Auto Memory. Requiere Read del repo + análisis de overlap con Memory tool API + Auto Memory.

## Bloque D — DAI con dale Fito explícito por bloque

> Per snapshot-022 §6 de la otra sesión paralela. Orden operativo→reflexivo→cierre.

- [ ] **D1.** Reversión técnica paso 22 imaginario (espera dale "dale revierte"):
  - `clasp undeploy AKfycbwS15tnUE3mteXlJeYYCPcoyOwYc26ziSO7yI-vzRCYgshKoDCONqWwHeLA9mA7ysDh`
  - `git checkout apps-script/src/webapp/WebApp.gs`
  - `git branch -D feat/paso-22-distribuido`
  - Crear `docs/design/descartados/` y mover 3 docs paso 22 imaginario:
    - `paso-22-pre-fase-cuestionar-plan.md`
    - `refactor-paso-22-mapeo.md`
    - `chunk-22.0b-research-bloqueante-cierre.md`
- [ ] **D2.** Memoria DAI `feedback_verificar-codigo-real-antes-de-disenar.md` (espera dale "dale memoria"). Plantilla en snapshot-022 §9.
- [ ] **D3.** Snapshot-023 cierre sesión 6 DAI (espera dale "dale snapshot-023"). Referencia D1 + D2. Cadena: 022 → 023.
- [ ] **D4.** Commit + push de TODO el paréntesis meta + reversión DAI (espera dale "dale commitea" + "dale pushea").

## NO incluido en este checklist (resolución requiere otra sesión / hardware / acción manual)

- Probar `/recap` y `/memory` empírico — Fito tipea en CLI.
- Bug Task Scheduler debug — sesión catedral-bunker próxima.
- Plan Jarvis Fito PARTE 1 reformulación con Auto Memory — sesión catedral-bunker próxima.
- Beelink Linux + systemd — hardware futuro.
- `~/.claude/CLAUDE.md` global update — safety rail, requiere consulta + dale separado.
- Decisión cuenta Anthropic Vexion (con socios Ramiro/Federico/Norberto) — Fito decide.

## Cierre del paréntesis

Cuando todos los Bloques A-D estén `[x]`, el paréntesis cierra. Próxima sesión arranca con:
- `MACHETE-FITO.md` actualizado.
- `INDEX.md` reportes-agentes actualizado.
- Decisión bitacorista resuelta.
- DAI reversado + memoria + snapshot-023.
- Todo commiteado.

— Forja Opus 4.7 [1m] sesión 6 DAI post-compactación, 2026-05-02 ~22:00 local.
