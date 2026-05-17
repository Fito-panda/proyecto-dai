---
doc: proyecto-dai/docs/design/estado-actual-sesion-6-2026-05-02
estado: vivo — salvavidas pre-compactación, cierre de sesión 6
fecha_origen: 2026-05-02
fecha_actualizacion: 2026-05-02 cierre sesión post-cazada Fito "lo simple es complejo"
origen: sesión 6 FORJA DAI siguiente. Doc actualizado al 93% de ventana, post-decisión final de cancelar pivote a centralizado y volver a V24 distribuido aplicando aprendizajes de sesión 6.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: salvavidas pre-compactación. Si te compactaron a mitad de sesión 6 o arrancás sesión 7, leé este doc PRIMERO. Captura la decisión final post-cazada Fito + aprendizajes a aplicar al V24 + 5 pasos pendientes ejecutar + instrucciones explícitas si me compactaron.
mutable: sí
fecha_elevacion_global: n/a
reemplaza_a: n/a (complementa INDEX + briefing-sesion-7 + bases-fundamentales)
---

# Estado final sesión 6 — salvavidas pre-compactación

> SI TE COMPACTARON A MITAD DE SESIÓN O SOS SESIÓN 7 ARRANCANDO. Leé este doc COMPLETO primero. Después leé `INDEX.md` + `dai-bases-fundamentales.md` + `dai-pivote-centralizado-briefing-sesion-7.md` (el briefing está superseded en parte por este doc — leerlo igual para contexto histórico). NO codees. NO inventes pivote. NO firmes cierre auto-asumido.

## 1. DECISIÓN FINAL 2026-05-02 — pivote a centralizado CANCELADO

Fito cazó al cierre de sesión 6 con la frase **"lo simple es complejo"**. Argumento estructural:

`driveproyectodai@gmail.com` YA es el sistema operador del piloto Bartolomé Mitre con Nely. V24 modelo C YA corre ahí. Cross-account validado en chunk C sesión 5. **Para Nely y el piloto, el deploy ya está hecho. Cero pivote, cero migración, cero 30 días-hombre de mitigaciones.**

El pivote a centralizado resolvía un problema (deploy mobile-only para 956 escuelas self-service) creando 6 problemas más grandes (SPOF mantenedor + posibles costos $$ Apps Script Workspace + soporte humano colapsa con escala + lock-in técnico + migración V24 → centralizado para Nely + 30 días-hombre antes de línea 1 producto).

Cazada estructural cerrada: estuve toda la sesión 6 mezclando dos problemas que son separados:
- **Problema 1 — piloto Bartolomé Mitre HOY:** ya resuelto en V24 distribuido sobre driveproyectodai. Falta R9 + paso 20 docs.
- **Problema 2 — escalar a 5-10 escuelas piloto de confianza:** Opción A asistida del checklist `manuales-distribucion-informal/checklist-opcion-A-setup-asistido.md` ya escrito al 70%. Vos hacés deploy 10-15 min en cuentas de directoras con sus passwords.
- **Problema 3 — distribución masiva 956 escuelas self-service:** PROYECTO FUTURO CONDICIONAL. Si una directora resuelve sola desde PC con tutorial bien hecho, quizás ni hace falta. Si gobierno (Ministerio Educación Córdoba / TransFORMAR@Cba) toma posta, ellos resuelven self-service. Si Apps Script Library verificada se vuelve viable, otra opción. Pero NO se resuelve hoy.

**Decisión Fito:** volver a V24 distribuido + cancelar pivote + el pivote queda como proyecto futuro condicional (NO descartado para siempre, solo aplazado hasta que sea problema real con condiciones concretas).

## 2. SALVEDAD CRÍTICA — NO tirar el aprendizaje sesión 6

Aprendizajes de sesión 6 que SÍ aplican al V24 distribuido (ahora con info actualizada que antes no teníamos):

### 2.1 Las 4 convergencias 4-lentes universales

Cazadas por las lentes 2/3/4/5 contra ambas opciones del ADR del pivote, pero NO son específicas del centralizado — son cazadas sobre cómo Nely + docentes interactúan con el sistema desde celular. Aplican a V24 distribuido igual:

- **Idempotency con UUID + dedup server.** Mitiga doble submit por refresh / tab kill / network retry.
- **Evidencia persistente post-submit (NO toast efímero).** Reemplazar form por tarjeta `evidencia-enviada` con timestamp + datos clave + botón "Hacer otro registro".
- **Auto-save borrador en localStorage** mientras la docente tipea. Banner re-apertura "Tenés borrador del martes 14:32".
- **Reintento + manejo offline mobile** con Service Worker o equivalente para network rural intermitente.

V24 actual probablemente tiene parte de esto del paso 17.3 sesión 3 (94 SPOFs cazados pre-código). VERIFICAR empírico cuáles ya están ANTES de paso 20 docs. Si faltan, agregar antes de R9.B Demo Fito-como-Nelly.

### 2.2 Las 5 preguntas Nivel 1 destiladas DAI con ROI medido

Aplicar al paso 20 docs antes de redactar cada módulo:
- Q1 ¿Usuario primario solo o equipo distribuido? (Cazada H — ya resuelta).
- Q2 ¿Mail/notificaciones o ver info donde ya trabaja? (NO mail — ya resuelta).
- Q3 ¿Auth fuerte o confianza humana alcanza? (Modelo C — ya resuelta).
- Q5 ¿Plan sigue vigente? (APLICAR antes de cada chunk de paso 20).
- Q6 KITCHEN SINK detector — ¿este módulo lo pidió alguien o lo agregamos por completitud profesional?

### 2.3 Técnica de las 5 lentes canonizada como método

Aplicar a sub-pasos críticos UX no técnica del paso 20 (módulo 0 video, página de ayuda, nota de prueba social) y de R9 si emerge complejidad UX. Caso seminal en `analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md`. ~95% cobertura por convergencias.

### 2.4 Lente 6 cazada "groupthink simulado"

Las 5 lentes pueden converger por construcción del prompt si todas miran el mismo input. Aplicar pluralidad real (inputs distintos por lente, perspectivas independientes) al validar futuros sub-pasos. Aplica a cómo armás los prompts de los agentes background.

### 2.5 "Lo simple es complejo" — anti-inflación de problemas

Antes de proponer pivote arquitectónico nuevo, validar que el problema existe HOY para usuario actual, no en horizonte futuro hipotético. Esta cazada es candidata a feedback persistente nuevo en próxima sesión.

### 2.6 Cuestionar el frame antes de decidir

La decisión Opción A vs B del ADR era prematura porque el frame estaba mal formulado (asumía que pivote era necesario). Aplicar a futuras decisiones: ¿cuál es el frame? ¿el frame está bien? ¿el problema que estoy resolviendo existe?

### 2.7 Las 11 cazadas técnicas Apps Script catalogadas

En `analisis-patrones-dai/emergentes.md`: clasp src/ prefix, PropertiesRegistry JSON wrapper, ScriptApp.getService.getUrl context-dependent, emojis primer char celda, /dev fragility, triggers cross-Sheet imposibles, simple triggers limitados a 6 reservados, límite 20 triggers/usuario/script, Session.getActiveUser deploy mode, setRequireLogin deprecated, tokens URL OK con e.parameter. V24 modelo C ya las maneja en su mayoría. Verificar al hacer R9 si alguna emerge.

### 2.8 Feedback persistente nuevo

`tool-blindness-memoria-cruzada.md` + `decisiones-tecnicas-atribuidas-falsamente-a-fito.md` ya están en memoria persistente proyecto-dai. Universales para cómo opero Claude en futuras sesiones.

## 3. 5 PASOS PENDIENTES para próxima sesión

NO ejecutados todavía. Sesión 7 (codeo) ejecuta. Necesitan dale explícito de Fito.

**Paso 1 — Doc de cierre del pivote.** Escribir `docs/design/dai-pivote-cancelado-2026-05-02.md` con: cazada Fito "lo simple es complejo" + por qué se canceló + aprendizajes a conservar (los 8 puntos arriba) + qué queda como proyecto futuro condicional + próximo paso volver a cierre sesión 5.

**Paso 2 — Reversión técnica.**
- `(cd apps-script && clasp undeploy AKfycbwS15tnUE3mteXlJeYYCPcoyOwYc26ziSO7yI-vzRCYgshKoDCONqWwHeLA9mA7ysDh)` para eliminar V25 deployment de test.
- `git checkout feat/baja-sumar-docente-v3` (branch base estable).
- `git checkout -- apps-script/src/webapp/WebApp.gs` para revertir función temporal `_testOpenById` + branch test.
- `git branch -D feat/paso-22-distribuido` para borrar branch del moco.
- Mover los 6 docs del moco a `docs/design/descartados-pivote/` con frontmatter explícito "descartado por re-evaluación 2026-05-02 — pivote y problema están separados":
  - `paso-22-pre-fase-cuestionar-plan.md` (moco original).
  - `refactor-paso-22-mapeo.md` (moco original).
  - `chunk-22.0b-research-bloqueante-cierre.md` (moco original).
  - `dai-pivote-centralizado-v0.md` (pivote re-evaluado).
  - `dai-pivote-centralizado-briefing-sesion-7.md` (pivote re-evaluado).
  - `5-lentes-adr-forms-sintesis.md` (síntesis 5 lentes sobre pivote cancelado).

**Paso 3 — Actualizar `INDEX.md`** para reflejar pivote descartado. Agregar al INDEX bloque "DESCARTADO 2026-05-02 — pivote a centralizado cancelado" con los 6 docs movidos. Actualizar sección "Lectura obligatoria" para que apunte solo a docs vigentes.

**Paso 4 — Actualizar `checklist-pendientes.md` en CLAUDE-CORE.**
- Cerrar bloque "Cagadas sesión 6 a revertir" con `[x]` en cada ítem post-ejecución del paso 2.
- Agregar bloque "Aprendizajes sesión 6 a aplicar a V24" con los 8 puntos de la sección 2 de este doc.
- Re-confirmar sección "Cierre 2026-05-01 sesión 5" como vigente: lo que falta del producto V24 distribuido es R9.A + R9.B + paso 20 docs + acciones manuales (re-bootstrap plantilla pública DAI Plantilla 2026 + col 10 token deuda visual).

**Paso 5 — Snapshot-023 sesión 6 cierre.** Escribir en `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-023-pivote-cancelado.md` con: contexto sesión 6 (carga de contexto post-cazada tool blindness + diseño pivote + aplicación 5 lentes + lente 6 + cazada Fito "lo simple es complejo") + decisión cancelar pivote + aprendizajes a aplicar al V24 + estado final V24 distribuido confirmado + lecciones meta para futuras sesiones.

## 4. SI TE COMPACTARON A MITAD DE SESIÓN — instrucciones explícitas

### Lectura obligatoria al volver, en este orden:

1. Este doc (estado-actual sesión 6 cierre).
2. `INDEX.md` (catálogo del proyecto).
3. `dai-bases-fundamentales.md` (bases inmutables).
4. `briefing-sesion-7.md` (superseded en parte por este doc — leerlo para contexto histórico).
5. Si vas a tocar código del backend: leer paneles enteros + `WebApp.gs` + `OnSubmitDispatcher.gs` + handlers operativos + bootstrap.
6. Si te interesa entender por qué se canceló el pivote: leer los 6 docs descartados (cuando se ejecute paso 2 estarán en `descartados-pivote/`) + el reporte lente 6 que está en transcript pero NO en disco.

### Lo que NO hacer al volver:

- NO inventar arquitectura nueva sin haber leído los 5 docs de arriba.
- NO atribuir decisiones técnicas a Fito (especialmente sobre APIs Apps Script / quotas / modelos seguridad).
- NO mezclar el pivote a centralizado descartado con el modelo distribuido vigente.
- NO arrancar el pivote de nuevo. Si emerge necesidad real (956 escuelas adoptantes self-service), pivote queda como proyecto futuro condicional. Eso es DECISIÓN FUTURA de Fito, no de Claude.
- NO firmar cierre auto-asumido si los 5 pasos salen exitosos.
- NO ofrecer pausa.

### Lo que SÍ hacer al volver:

- Confirmar a Fito que retomamos desde decisión final del cierre sesión 6 (pivote cancelado, V24 distribuido vigente).
- Pedir dale explícito antes de ejecutar los 5 pasos (sesión 7 codeo).
- Si Fito da dale: ejecutar los 5 pasos en orden. Reportar entre paso y paso.
- Si Fito quiere arrancar otro foco (ej. R9.A directo, paso 20 docs directo, validación V24 con Nely real), seguir su decisión.
- Aplicar los aprendizajes sección 2 cuando corresponda (preguntas Nivel 1 + 5 lentes + lente 6 + cuestionar frame + "lo simple es complejo").

## 5. Estado de archivos y branches al cierre sesión 6

- Branch git actual: `feat/paso-22-distribuido` (creada sesión 6, scope inválido — pendiente borrar paso 2).
- Branch base estable: `feat/baja-sumar-docente-v3` (V24 modelo C, último commit `9b8e32b` pusheado).
- Master: intacto.
- V24 producción Apps Script: intacto, deployment `AKfycbyYZOSV...` corriendo modelo C.
- V25 deployment de test (sesión 6 chunk 22.1): activo, pendiente undeploy paso 2.
- `WebApp.gs` en branch actual: tiene función temporal `_testOpenById` + branch test del moco — pendiente revert paso 2.

Docs vigentes en `docs/design/`:
- `dai-bases-fundamentales.md` ✓ vigente.
- `INDEX.md` ✓ vigente, pendiente update paso 3.
- `estado-actual-sesion-6-2026-05-02.md` ✓ este doc.

Docs a mover a `descartados-pivote/` en paso 2:
- `paso-22-pre-fase-cuestionar-plan.md` — moco original.
- `refactor-paso-22-mapeo.md` — moco original.
- `chunk-22.0b-research-bloqueante-cierre.md` — moco original.
- `dai-pivote-centralizado-v0.md` — pivote re-evaluado.
- `dai-pivote-centralizado-briefing-sesion-7.md` — pivote re-evaluado.
- `5-lentes-adr-forms-sintesis.md` — síntesis 5 lentes sobre pivote cancelado.

## 6. Memoria persistente proyecto-dai (11 feedback files)

Path: `~/.claude/projects/C--Users-adolp-Desktop-proyecto-dai/memory/`. MEMORY.md indexa:

- pre-condiciones-empíricas (esencial al arrancar sesión).
- defensive-guard-handlers.
- voz-precursora.
- tablas-en-chat.
- mapeo-plomero-pre-sub-paso.
- gaslighting-ia.
- dudas-disfrazadas-de-decisiones.
- no-ofrecer-pausa.
- tool-blindness-memoria-cruzada (NUEVO sesión 6).
- decisiones-tecnicas-atribuidas-falsamente-a-fito (NUEVO sesión 6).
- project-daiana-toneatti.

Candidato a feedback persistente nuevo a escribir en sesión 7: **"lo simple es complejo" — anti-inflación de problemas / antes de proponer pivote arquitectónico, validar que el problema existe HOY para usuario actual no en horizonte futuro hipotético**.

## 7. Cazadas estructurales sesión 6 a snapshot-023

- Tool blindness escala mayor (sesión 6 inventó arquitectura sin leer código real del proyecto).
- Decisiones técnicas atribuidas falsamente a Fito (Claude toma decisiones compulsivas + las atribuye a Fito + sesiones siguientes confían sin re-cuestionar).
- Frame del ADR mal formulado (Opción A vs B asumían que pivote era necesario — la lente 6 cazó esto, Fito reformuló más arriba con "lo simple es complejo").
- Groupthink simulado entre lentes que comparten input.
- Costo del pivote NO calculado al inicio ($$ Workspace + soporte humano + SPOF mantenedor + 30 días-hombre + migración).
- Inflación de urgencia: mezclé Problema 1 (piloto YA resuelto) con Problema 3 (956 escuelas futuro hipotético) en uno solo.

## 8. Firma

Estado-actual sesión 6 cierre escrito al 93% de ventana, post-decisión final cancelar pivote + volver a V24 distribuido + aplicar aprendizajes. Salvavidas pre-compactación. Aplica costumbre `pildora-rescate-inter-sesion`.

Próxima sesión retoma con dale Fito sobre los 5 pasos pendientes. NO firma de cierre auto-asumida. NO commit sin "dale pushea".

— sesión 6, 2026-05-02, ventana al 93% pre-compactación.
