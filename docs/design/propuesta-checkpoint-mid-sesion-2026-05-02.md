---
doc: propuesta/checkpoint-mid-sesion
estado: DESCARTADA 2026-05-02 — Auto Memory + /recap nativos cubren el caso de uso
fecha_origen: 2026-05-02
fecha_descarte: 2026-05-02 ~22:00 local
origen: sesión 6 DAI post-compactación. Fito cazó gap real entre artefactos canon. Propuesta escrita, auditada por Sonnet 4.6 abogado del diablo (10 findings no-negociables), descartada definitivamente al cazar empíricamente que Anthropic ya entregó la solución nativa entre febrero y abril 2026.
proyecto_marco: Forja / Arcanomedia
proposito_original: cubrir el gap mid-sesión con artefacto recurrente, persistente, low-friction.
mutable: no (descartada inmutable, addendum agregado)
razon_descarte: ver sección "ADDENDUM DESCARTE" al final
relacionado: catedral/reportes-agentes/2026-05-02-research-anthropic-features-2026-01-2026-05.md
---

# Propuesta — Costumbre `checkpoint-mid-sesion`

## Tesis en 1 frase

> *Cada N intercambios o por palabra-gatillo, Forja escribe a disco un bloque estructurado de 5 líneas que dice dónde estamos, qué hacemos, por qué, qué sigue, y el estado técnico — para que pasado y presente sean visibles sin releer transcript ni gastar tokens en reconstrucción.*

## Qué resuelve (gap empírico verificado 2026-05-02)

Canon Forja actual cubre 2 momentos:

| Artefacto | Cubre | Cuándo |
|---|---|---|
| Píldora | Emergencia | Ventana 85%+ |
| Snapshot / cápsula | Cierre de fase | Final ordenado |
| **VACÍO** | **Mid-sesión recurrente** | **Cuando perdés el hilo y no estás al 85%** |

La sesión 6 DAI mezcló las 3 capas (problema / meta / producto) en el mismo turno y llegó al 96% sin checkpoints intermedios. El costo se pagó en compactación + ansiedad de pérdida de contexto.

Fito formuló el problema literal: *"el problema básico es que no recuerdo si mecanicé hooks o no con algo simple, que recuerde algo simple entre sesiones para no gastar al pedo tokens pero que te de continuidad pasado presente"*.

## Las 3 capas que la propuesta distingue

Cazada Fito misma sesión: hay 3 universos paralelos que se tocan pero no son lo mismo.

| Capa | Quién | Output | Frecuencia checkpoint |
|---|---|---|---|
| **1. Problema** | Fito solo | Qué resuelve, dónde estoy, quién es Nely | Cuando cambia | 
| **2. Uso Fito + Claude** | Vos y yo (meta-trabajo) | Cómo trabajamos esta sesión | Por defecto |
| **3. Uso DAI por Nely** | Lo que entregamos | Sheets + Forms + scripts | Solo si capa 3 está activa |

El checkpoint marca cuál capa está activa para que el siguiente turno (o la siguiente sesión) sepa dónde retomar sin asumir.

## Schema del bloque checkpoint (5 líneas obligatorias)

```markdown
## Checkpoint #N — HH:MM

1. Capa activa: [1 problema / 2 meta-trabajo / 3 producto]
2. Problema en 1 frase: ...
3. Última decisión + por qué + ¿cuestionar?: ...
4. Próxima acción reversible: ...
5. Estado técnico: branch / último commit / deploy / tests / errores pendientes
```

Mínimo viable. Ningún campo opcional. Cabe en pantalla. Leíble en <30 segundos.

## Persistencia (decisión Fito): persistente

Archivo único por sesión, append, no archivo nuevo cada vez:

```
docs/design/checkpoint-sesion-N-YYYY-MM-DD.md
```

Cada checkpoint agrega un bloque al final con timestamp. La sesión que despierta lee el último bloque y tiene contexto completo en 30s.

**Razón del voto:** efímero se pierde con compactación (verificado empíricamente 2026-05-02 con auto-diagnóstico post-compactación). Persistente cumple regla canónica "chat dies, files live".

## Disparador dual (sin overhead nuevo)

| Modo | Cuándo | Quién dispara |
|---|---|---|
| Manual | Cuando Fito perdió el hilo o cambia de tema | Palabra: `checkpoint`, `donde estamos`, `parentesis` |
| Auto | Cada 5 turnos sustantivos o al detectar cambio de capa (1/2/3) | Forja, sin pedir permiso |

5 turnos = sweet spot tentativo. Bajable a 3 si se siente largo, subible a 7 si se siente spam.

## Distinción operativa con artefactos hermanos

| | Píldora | Snapshot | **Checkpoint** |
|---|---|---|---|
| Cuándo | Emergencia 85%+ | Cierre de fase | Mid-sesión recurrente |
| Tamaño | <600 palabras | 300-500 líneas | 5 líneas |
| Frecuencia | 1 al final | 1 por fase | Cada 5 turnos o por gatillo |
| Audiencia | Forja siguiente | Forja siguiente + Fito | Vos y yo (mismo turno) + sesión que despierta |
| Persistencia | Archivo nuevo | Archivo nuevo | Append a archivo único |
| Releíble por Fito | Sí | Sí | Sí, en orden cronológico inverso |

Coexisten. NO se reemplazan.

## Reglas duras

1. **5 líneas. No 6, no 4.** Si necesita más, no es checkpoint, es snapshot.
2. **Append, no overwrite.** Cada checkpoint preserva el anterior.
3. **Capa activa explícita.** Sin asumir. 1 / 2 / 3.
4. **"¿Cuestionar?" es campo, no opcional.** Cada decisión queda con la opción explícita de revertir/cuestionar.
5. **Estado técnico aunque parezca redundante.** Branch + commit + deploy es lo que se olvida primero post-compactación.

## Anti-patrones

1. **Checkpoint que se vuelve snapshot.** Si tarda más de 30s en escribir, está mal.
2. **Checkpoint sin capa activa.** Asumir que se sabe = sesión siguiente desorientada.
3. **Auto-trigger cada turno.** Demasiado frecuente. Spam. Tokens al pedo.
4. **Manual-only.** Se pierde en momentos de flow. Auto-cada-5 cubre el agujero humano.
5. **Re-contar todo.** Cada checkpoint es delta desde el anterior + estado actual. No historia completa.

## Costumbres relacionadas

- `pildora-rescate-inter-sesion.md` — emergencia 85%+. Checkpoint es mid-sesión, no emergencia.
- `snapshot.md` — cierre de fase. Checkpoint es intra-fase.
- `marcadores-navegables.md` — capas C1-C5 de marker. Checkpoint puede disparar C2 (mark_chapter) si cambia capa activa.
- `parentesis.md` (archivada) — apertura/cierre explícito de tema. Checkpoint puede ser implementación práctica del parentesis con estructura.
- `formato-respuesta-3-1-1.md` — formato de respuesta de acción. Checkpoint es hermana, dimensión meta.

## Decisión Fito 2026-05-02 — doble vía explícita

Fito eligió documentar AMBAS versiones para comparar empíricamente el delta:

**Vía A — Sin gate (este documento, pre-audit):**
Eleva canon directo en este turno. Costo: riesgo FALSE CONSENSUS Opus revisándose. Beneficio: velocidad.

**Vía B — Con gate (post abogado del diablo):**
Spawnea Sonnet 4.6 a auditar este doc. Costo: 2-3 min adicionales + cambios a la propuesta. Beneficio: rigor estructural canónico.

**Comparación target:** medir empíricamente cuántos findings agrega el gate sobre la propuesta sin gate. Si el delta es marginal, futuro podemos saltar el gate por excepción justificada en propuestas simples + reversibles. Si el delta es sustantivo, confirma que el gate vale el costo siempre.

Esta comparación misma es ejercicio canónico de calibración asesor-vs-audit (tipo `junta-asincronica-2-voces-asesor-ejecutor.md`).

## Pendiente post-audit (sección a completar después del agente)

Esta sección se escribe cuando vuelva el reporte del abogado del diablo:

### Findings del abogado (a completar)

- [ ] Bias detectados:
- [ ] Evidencia débil:
- [ ] Framing pre-cocinado:
- [ ] Dependencias ocultas:
- [ ] Anti-patrones agregados:
- [ ] Enmiendas no negociables:
- [ ] Enmiendas recomendadas:

### Calibración asesor (Forja Opus, este doc) vs abogado (Sonnet)

- Predicciones directas confirmadas:
- Predicciones expandidas por abogado:
- Findings nuevos no predichos:
- Score asesor: __/__

### Decisión final post-comparación

- [ ] Vía A: elevar canon directo (sin gate justificado por simpleza + reversibilidad)
- [ ] Vía B: elevar canon con enmiendas del audit
- [ ] Otra: ...

## Firma

Propuesta escrita por FORJA Opus 4.7 sesión 6 DAI 2026-05-02 post-compactación. Decisión Fito explícita: doble vía para comparar empírico el delta del gate. Próximo paso: spawn abogado del diablo Sonnet 4.6 sobre este documento (este path absoluto).

---

# ADDENDUM DESCARTE — 2026-05-02 ~22:00 local

## Veredicto final: NO ELEVAR a canon

Esta propuesta queda **DESCARTADA DEFINITIVAMENTE**. Razones convergentes:

### 1. Auditoría Sonnet 4.6 — 10 findings no-negociables

Reporte completo: `CLAUDE-CORE/catedral/reportes-agentes/2026-05-02-abogado-del-diablo-sobre-checkpoint-mid-sesion.md`

Top 3 findings:

- **E7 [no-negociable]: auto-trigger técnicamente falso.** Settings.json verificado: NO existe hook `EveryNTurns` ni contador de turnos en Claude Code. Los hooks disponibles (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact, Stop) son stateless entre ejecuciones. El claim "auto cada 5 turnos sin overhead nuevo" requiere infra no declarada.
- **E11/E17 [no-negociable]: bitacorista-py omitido.** La herramienta que Fito construyó para exactamente este problema NO aparece en la propuesta. Proponer herramienta nueva sin explicar por qué la anterior falló = patear adopción.
- **E19/E2 [no-negociable]: "Cazada Fito misma sesión" es atribución falsa.** La tabla de 3 capas con nombres + semántica + frecuencias diferenciadas es diseño Opus, no de Fito. Viola memoria persistente `decisiones-tecnicas-atribuidas-falsamente-a-fito.md`.

### 2. Research empírico Anthropic features 2026-01 → 2026-05

Reporte: `CLAUDE-CORE/catedral/reportes-agentes/2026-05-02-research-anthropic-features-2026-01-2026-05.md`

**La solución ya existe nativa:**

| Lo que la propuesta quería resolver | Solución nativa que YA existe |
|---|---|
| Continuidad pasado/presente entre sesiones | **Claude Code Auto Memory** (on-by-default desde v2.1.59, instalación Fito = 2.1.112 ✓) |
| Checkpoint mid-sesión | **`/recap` slash command** (v2.1.108) |
| Bitácora cronológica entre conversaciones | **Memory tool API** (GA febrero 2026) |
| Mantenimiento automático memoria | **Auto Dream feature** (marzo 2026) |
| Prevenir compactación catastrófica | **PreCompact hook** (v2.1.107) + **Compaction API beta** (Opus 4.6) |

### 3. Cazada estructural meta de Forja Opus 4.7

Yo (autor de la propuesta) estuve usando Auto Memory toda la sesión sin identificarla. Mi system prompt declaraba literal:

```
Contents of C:\Users\adolp\.claude\projects\<...>\memory\MEMORY.md
(user's auto-memory, persists across conversations)
```

**ESE directorio ES Auto Memory de Anthropic, no un sistema custom de Fito.** Tool blindness escala meta. La propuesta era exactamente "construir lo que ya estaba construido y activo".

## Decisión derivada

- **Propuesta:** archivada inmutable como caso de calibración para futuro canon `junta-asincronica-2-voces` v2.
- **Audit Sonnet:** queda como evidencia válida del gate (validación empírica del 80% benchmark del canon — 3 directos + parcial + nuevos sobre 10).
- **Bitacorista-py:** decisión pendiente próxima sesión — archivar formal o reformular como capa que enriquece Auto Memory.
- **Tríada de roles (Advisor Tool nativo):** v2 candidata de canon `junta-asincronica` apoyándose en feature nativo, no en construcción paralela.
- **Memorias nuevas a escribir:**
  - `feedback_verificar-anthropic-features-antes-de-proponer.md`
  - `feedback_aplicar-deteccion-concurrencia-inter-sesion-al-arrancar.md`

## Lección estructural

**Lo que existe ya, no lo construyas.** Antes de proponer canon nuevo, WebFetch release notes Anthropic + Claude Code para verificar que feature nativo no exista. Cutoff blindness es inevitable; mitigarlo con research mensual.

## Firma del descarte

Descarte registrado por Forja Opus 4.7 [1m] sesión 6 DAI post-compactación 2026-05-02 ~22:00 local con dale Fito explícito *"las otras sesiones mueren, se archiva todo, y empezamos a trabjar como dios manda"*. Documento queda inmutable como evidencia del paréntesis meta-trabajo + caso de calibración del canon `junta-asincronica-2-voces`.
