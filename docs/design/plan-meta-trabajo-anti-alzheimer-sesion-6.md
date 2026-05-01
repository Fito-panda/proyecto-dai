---
doc: proyecto-dai/docs/design/plan-meta-trabajo-anti-alzheimer-sesion-6
estado: vivo — plan ejecutable
fecha_origen: 2026-05-01
origen: paréntesis meta-trabajo sesión 5 FORJA DAI siguiente, post-cazada Fito sobre "Alzheimer post-cierre" + "compulsiones" + "necesidad de micro-reglas casi constantes". Triada DAI aplicada al meta-problema (mapeo + abogado del diablo + 5 lentes). Convergencia 3 agentes externos + 5 costumbres archivadas + 11 frameworks. Hallazgo final: bitacorista-py (de autoría Fito) ya tiene la integración Claude Code lista vía Stop+SessionStart hooks + pattern packs + webhooks.
proyecto_marco: Arcanomedia (cross-proyecto — aplica a DAI/Vexion/Pulpo/Forja)
rango_memoria: proyecto + global (decisiones cubren todo el ecosistema)
proposito: dejar plan operativo concreto + auto-contenido para que sesión 6 ejecute las 11 acciones del paquete anti-Alzheimer/anti-sobre-ingeniería sin reconstruir contexto. Cross-referencia 4 reportes de agentes + 5 costumbres archivadas + bitacorista-py código.
mutable: sí (puede ajustarse al ejecutar)
fecha_elevacion_global: pendiente (algunos elementos elevables a CLAUDE.md global)
reemplaza_a: n/a
---

# Plan meta-trabajo anti-Alzheimer — para sesión 6

## Contexto en 3 líneas

1. Sesión 5 DAI cerró refactor modelo C exitoso PERO al final Claude generó firma "Sesión X cerrada" auto-asumida sin que Fito declarara cierre + olvidó actualizar checklist + snapshot + plan continuidad.
2. Cazada estructural Fito: el problema NO es solo cierre — es **compulsión de cierre auto-asumido + decay atención al protocolo CLAUDE.md durante sesiones largas + falta de micro-reglas casi constantes**.
3. Investigación con triada DAI aplicada (mapeo + abogado + 5 lentes + 3 agentes) reveló que el conocimiento existe (5 costumbres archivadas + 11 frameworks externos + bitacorista-py de autoría Fito) — falta enforcement de invocación.

## Decisiones ya tomadas (NO re-decidir)

1. **Scope hook**: GLOBAL `~/.claude/settings.json` (cross-proyecto Arcanomedia/Vexion/Pulpo/DAI/Forja).
2. **Tipo de hook**: CONTEXTUAL (detección de etapa por heurística), NO tiempo-basado por turnos. Implementación vía bitacorista pattern packs + webhooks.
3. **Paquete**: COMPLETO (memorias + costumbres + hooks + skills externas seleccionadas). Anti-posposición.
4. **Bitacorista v2.9.0** (no v3.0.0 que está en desarrollo). Migración a v3 cuando se publique.
5. **Skill externa primaria**: `prompt-improver` (severity1) — gate pre-tarea complementario.
6. **Skill externa diferida**: `Systematic Debugging` (obra/superpowers) como deuda P2.
7. **Skills externas DESCARTADAS**: 12 (ver reporte agente C).
8. **`consolidate-memory` skill descartado** post-bitacorista (overlap con `get_resumen` auto-query).
9. **`find-skills` (vercel-labs) descartado**: resuelve problema de saturación que es bug Anthropic con queja abierta, no problema operativo.

## Pre-condiciones empíricas a verificar al arrancar sesión 6

- [ ] `git status` proyecto-dai — debe estar limpio en branch `feat/baja-sumar-docente-v3` con último commit `a3d027e`.
- [ ] `git status` CLAUDE-CORE — verificar si commits del cierre formal sesión 5 (snapshot-021 + checklist update + plan continuidad) ya están commiteados o pendientes.
- [ ] Verificar que docs `proyecto-dai/docs/design/refactor-modelo-c-mapeo.md` + `cierre-sesion-5-plan-continuidad.md` + ESTE plan + `snapshot-021-sesion-5-modelo-c-cerrado.md` existen.
- [ ] Confirmar que producción V24 sigue corriendo (curl HEAD sobre URL del web app debe responder 302).

## 4 reportes de agentes (referencia obligatoria)

Cargar al arranque sesión 6:

1. `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-auditor-externo-alzheimer-post-cierre.md` — Attention Residue + Completion Bias + WHO Surgical Checklist + Aviación + DoD + Stop hook nativo Claude Code.
2. `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-frameworks-pre-diseno-anti-sobreingenieria.md` — 11 frameworks (Torres / Cagan / Christensen / Wake / Adzic / Nygard / Toyoda-Ohno / Gothelf / Klein / Brown / Nielsen + YAGNI) + 5 preguntas Nivel 1 universales.
3. `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-destilacion-preguntas-nivel-1-desde-DAI.md` — 13 preguntas Nivel 1 retrospectivas + 5 categorías estructurales (mapean 1:1 con dimensiones safety net Fito).
4. `CLAUDE-CORE/catedral/reportes-agentes/2026-05-01-compilacion-skills-existentes-meta-problema.md` — 20 skills evaluadas + 5 candidatas + 12 descartadas + cobertura por nivel + alerta sobre-ingeniería.

## Plan ejecutable — 11 acciones en orden

### Acción 1 — Rescatar 5 costumbres archivadas al path vivo (5 min)

```bash
cd "C:/Users/adolp/Desktop/CLAUDE-CORE"
git mv catedral/archivo/canon-v1/costumbres/landscape-research-pre-diseno.md catedral/costumbres/
git mv catedral/archivo/canon-v1/costumbres/auto-consulta-catedral.md catedral/costumbres/
git mv catedral/archivo/canon-v1/costumbres/entrevista-descubrimiento.md catedral/costumbres/
git mv catedral/archivo/canon-v1/costumbres/cuestionar-plan-pre-fase.md catedral/costumbres/
git mv catedral/archivo/canon-v1/costumbres/aporte-critico-al-brief.md catedral/costumbres/
```

Después actualizar `catedral/costumbres/INDEX.md`: mover las 5 de "50 archivadas" a "preservadas en path vivo" (ya van a ser 23 preservadas, no 18).

**Done cuando**: `ls catedral/costumbres/` lista las 5 + INDEX actualizado.

### Acción 2 — Elevar `landscape-research-pre-diseno` a `~/.claude/CLAUDE.md` global (5 min)

Agregar sección al final de `~/.claude/CLAUDE.md`:

```markdown
## Operacionalización R0 (sé sabio, no inteligente)

Antes de diseñar producto/feature/fase nueva: 20-30 min de research afuera + adentro vía agente. Bug declarado por Fito 19-abr-2026: "Cometo mucho el error de empezar a inventar y capaz ya se inventó". Ver `catedral/costumbres/landscape-research-pre-diseno.md` + `auto-consulta-catedral.md`.
```

**Done cuando**: CLAUDE.md global tiene la sección agregada + commit.

### Acción 3 — Crear `preguntas-nivel-1-pre-fase.md` (30 min)

Path: `catedral/costumbres/preguntas-nivel-1-pre-fase.md`.

Contenido base (destilación 13 preguntas DAI agente B + 5 universales agente A):

**5 categorías estructurales** (1:1 con dimensiones safety net Fito):
1. **Usuario real**: ¿Quién es? Limitaciones técnicas/contextuales/cognitivas? Job real (JTBD)?
2. **Scope mínimo**: ¿Qué necesita REALMENTE el problema? Anti-MVP-bias / anti-kitchen-sink. ¿Qué NO se hace?
3. **Continuidad estructural**: ¿Quién sostiene si el operador primario desaparece? Anti-SPOF (Cazada H DAI).
4. **Validación de supuestos**: ¿Qué hipótesis testeamos y cómo sabremos que falla? Pre-mortem 5 min.
5. **Tools disponibles**: ¿Alguien YA resolvió esto? Investigar afuera (frameworks) + adentro (catedral) + skills/plugins existentes ANTES de inventar.

5 preguntas top (mayor ROI evitando errores DAI):
- Q3: ¿La auth necesita ser fuerte (login + roles) o confianza humana alcanza?
- Q1: ¿El usuario primario es individual o equipo distribuido (anti-SPOF)?
- Q2: ¿Cuál es el canal natural del usuario (mobile/desktop/email/Sheet/etc)?
- Q5: ¿Qué del plan original sigue vigente? (cuestionar-plan-pre-fase)
- Q6: ¿Hay features que nadie pidió (KITCHEN SINK candidato)?

Frontmatter canónico + casos seminales DAI documentados + cross-references al reporte agente B.

**Done cuando**: archivo existe + frontmatter completo + 5 categorías + 5 preguntas top + INDEX.md actualizado.

### Acción 4 — Expandir `feedback_no-ofrecer-pausa.md` con forma encubierta (10 min)

Path: `~/.claude/projects/C--Users-adolp-Desktop-proyecto-dai/memory/feedback_no-ofrecer-pausa.md`.

Agregar sección "FORMA ENCUBIERTA cazada sesión 5 2026-05-01":

```markdown
**Patrones-síntoma a detectar y BLOQUEAR**:
- Firma "— Sesión X cerrada (...) timestamp" auto-generada sin que Fito declare cierre.
- Tablas de métricas redondas (LOC + commits + tiempos) post-push exitoso.
- Bullet list "qué sigue" / "para próxima sesión" / "roadmap" sin pedido.
- Emoji 🎉 / 🚀 / ✅ celebratorios.
- Ofrecer `/schedule` o "agente background a 2 semanas" disfrazado de servicio.

**Por qué la forma encubierta**: feedback_no-ofrecer-pausa.md original cubrió la forma directa ("¿pausamos?"). Pero el patrón también ocurre en formato "cierre profesional con métricas + roadmap" que parece útil pero ES auto-cierre disfrazado.

**Hermana de**: `feedback_gaslighting-ia.md` + `feedback_dudas-disfrazadas-de-decisiones.md` — todas son del ecosistema "evitar trabajo difícil al final con apariencia de criterio".
```

**Done cuando**: edit aplicado + memoria recargada en próxima sesión.

### Acción 5 — Sumar AUTO-CIERRE BIAS al catálogo 7 sesgos (10 min)

Path: `catedral/archivo/canon-v1/costumbres/arquitectura-forja-activable-y-sesgos-claude.md`.

Agregar fila a la tabla "Los 7 sesgos" (R16 dice "catalog grows"):

```markdown
| 8 | **AUTO-CIERRE BIAS** | Generar firma "Sesión X cerrada" + tabla métricas + roadmap "próxima sesión" + emoji 🎉 sin que Fito declare cierre | ¿Fito declaró cierre explícito o yo lo asumí? Si asumido, NO firmar cierre. |
```

Caso seminal: documentado en snapshot-021 sesión 5 2026-05-01.

**Done cuando**: tabla actualizada con fila #8 + CLAUDE.md global espejo si aplica.

### Acción 6 — Actualizar `auto-audit-violaciones-criticas.md` con #8 + #9 (10 min)

Path: `catedral/archivo/canon-v1/costumbres/auto-audit-violaciones-criticas.md`.

Agregar a la lista de violaciones críticas:

```markdown
### 8. Firma de cierre auto-asumida sin dale Fito

Generar "— Sesión X cerrada" + métricas + roadmap "próxima sesión" sin que Fito haya declarado cierre. Caso seminal: snapshot-021 sesión 5 DAI 2026-05-01.

### 9. Protocolo de cierre operativo no completado post-push

Push exitoso a remoto sin actualizar checklist-pendientes.md correspondiente + sin escribir snapshot inmutable + sin escribir plan continuidad. Viola CLAUDE.md global L42 + costumbre `checklist-pendientes-por-proyecto.md`. Caso seminal: snapshot-021 sesión 5 DAI 2026-05-01.
```

**Done cuando**: lista de 9 violaciones (era 7) + commit.

### Acción 7 — Instalar bitacorista v2.9.0 (5 min)

```bash
pip install bitacorista[search]
# o sin search vector:
pip install bitacorista
```

Verificar: `bitacorista --version` debe responder `2.9.0`.

**Done cuando**: comando responde versión 2.9.0.

### Acción 8 — Configurar hooks bitacorista en `~/.claude/` (20 min)

Pasos:
1. Crear directorio `~/.claude/hooks/` si no existe.
2. Copiar `examples/claude_code_hook.py` del repo bitacorista-py → `~/.claude/hooks/bitacorista_hook.py`.
3. Copiar `bitacorista_startup.py` (si existe en repo, sino crearlo según README) → `~/.claude/hooks/bitacorista_startup.py`.
4. Editar `~/.claude/settings.json` agregando bloque hooks:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/hooks/bitacorista_startup.py",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/hooks/bitacorista_hook.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

5. Crear DB sesión: `bitacorista init --patterns dev` desde working directory donde se quiera la `.db`.
6. Reiniciar Claude Code → hooks activan en próxima sesión.

**Done cuando**: hooks configurados + bitacorista init OK + test en próxima sesión muestra eventos detectados.

### Acción 9 — Crear pattern pack custom `forja.py` (40 min)

Path: en repo bitacorista-py (clonar / forkear) → `bitacorista/patterns/forja.py`.

Patterns para detectar:
- AUTO-CIERRE: regex que matchea "Sesión \d+ cerrada" + variantes ("— Sesión \w+ cerrada al cierre", "Cierre Sesión \d+", etc).
- CIERRE-FECHA-AUTO: regex de timestamp tipo "(\d{4}-\d{2}-\d{2})\s+\d{1,2}:\d{2}" en últimas 5 líneas de output.
- EMOJI-CELEBRATORIO: regex "[🎉🚀✅]{1,}" cuando aparece en patrón "[bold] (commit|push|sesión)".
- ROADMAP-SIN-PEDIDO: regex "(para|próxima)\s+sesión" + "(qué sigue|next steps|roadmap)".
- METRICAS-AUTO-ASUMIDAS: tabla con LOC + commits + duración inmediatamente post-push exitoso.

Pack `forja.py` se carga vía `bitacorista init --patterns dev,forja` (combinable con dev).

**Done cuando**: pack `forja.py` creado + tests unitarios pass + integrable con `--patterns forja`.

### Acción 10 — Configurar webhook bitacorista para reminders (15 min)

```bash
bitacorista init --patterns dev,forja --webhook 'python ~/.claude/hooks/bitacorista_webhook_reminder.py'
```

Crear `~/.claude/hooks/bitacorista_webhook_reminder.py`:
- Recibe JSON en stdin con tipo evento detectado.
- Si tipo == "AUTO-CIERRE" o relacionado → escribir mensaje a stderr que Claude pueda leer en próximo turno: *"AUTO-CIERRE detectado. Esperá declaración explícita de Fito antes de firmar cierre."*
- Si tipo == "POST-PUSH" → mensaje: *"Post-push detectado. Pre-condición protocolo cierre: ¿checklist actualizado? ¿snapshot escrito? ¿plan continuidad?"*

**Done cuando**: webhook funciona end-to-end (test manual triggereando un patrón).

### Acción 11 — Bajar `prompt-improver` (severity1) (10 min)

Buscar repo en GitHub o marketplace skills. Instalar según README del proyecto (probablemente `git clone` + symlink en `~/.claude/skills/`).

Habilitar y observar disparo en próximas tareas inicio brief.

**Done cuando**: skill cargado + visible en lista de skills disponibles + observación pasiva primera semana.

## Acciones diferidas (deuda P2)

- **Skill `Systematic Debugging`** (obra/superpowers): bajar y evaluar como base Nivel 2. Próxima sesión que toque debugging complejo.
- **Adaptar rúbrica Humanízalo** como referencia para Arcanomedia (UX writing, voz Escuela Precursora). NO instalar como skill.
- **Migración bitacorista v2.9.0 → v3.0.0** cuando v3 se publique como Claude Code plugin oficial.
- **Validar `preguntas-nivel-1-pre-fase`** aplicándolo al paso 22 DAI (web app configuradora). Sugerencia agente B.

## Roadmap producto DAI (capa A — sigue vigente del cierre-sesion-5-plan-continuidad)

NO confundir con meta-trabajo (capa B). Producto DAI sigue su roadmap:

```
1. Web app configuradora (paso 22 nuevo, ~2-3 hs)
2. R9.A — 4 corridas operador (mínima/completa/error/incremental)
3. Demo "Fito como Nelly" desde adolfoprunotto@gmail.com
4. R9.B corridas restantes
5. Paso 20 docs (4 docs + README + Módulo 0 video)
6. Acciones manuales pendientes Chunk E (re-bootstrap plantilla pública / col 10 Token cleanup)
```

Ver detalle: `proyecto-dai/docs/design/cierre-sesion-5-plan-continuidad.md` sección 2.

## Decisión apertura sesión 6

3 caminos posibles para arrancar (Fito decide al despertar):

- **Camino A**: Ejecutar las 11 acciones meta-trabajo PRIMERO (~2:40 hs), después seguir con producto DAI.
- **Camino B**: Avanzar producto DAI (web app configuradora paso 22), meta-trabajo después.
- **Camino C**: Híbrido — acciones rápidas 1-7 (1 hora) AHORA + 8-11 (1:40 hs) en otra sesión + producto DAI en paralelo.

Mi voto al cierre sesión 5: **Camino A** — el meta-trabajo es enforcement que protege TODO lo que viene después. Sin enforcement, los próximos chunks DAI van a tener el mismo Alzheimer.

PERO: decisión de Fito al despertar sesión 6. Este plan respeta cualquier camino que elija.

## Cross-references obligatorios para próxima sesión

Lectura mínima al arranque sesión 6 (post-despertar-de-forja):

1. Este plan (`plan-meta-trabajo-anti-alzheimer-sesion-6.md`).
2. `cierre-sesion-5-plan-continuidad.md` (roadmap producto DAI).
3. `snapshot-021-sesion-5-modelo-c-cerrado.md` (cierre + cazadas).
4. Los 4 reportes de agentes (`catedral/reportes-agentes/2026-05-01-*.md`).
5. CLAUDE.md global (siempre).
6. Memorias `~/.claude/projects/.../memory/` (siempre).

## Firma

Plan escrito durante paréntesis post-cierre sesión 5 con ventana al 81%, anti-ejecución-en-ventana-saturada. Aplica costumbre `pildora-rescate-inter-sesion`. Próxima sesión arranca con todo el contexto cargado sin reconstrucción.

— FORJA DAI siguiente, sesión 5 paréntesis meta-trabajo, 2026-05-01.
