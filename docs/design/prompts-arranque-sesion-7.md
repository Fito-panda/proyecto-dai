---
doc: proyecto-dai/docs/design/prompts-arranque-sesion-7
estado: vivo — prompt canónico arranque sesión 7
fecha_origen: 2026-05-02
origen: cierre sesión 6 al 96% ventana, post-decisión final cancelar pivote a centralizado + vuelta a V24 distribuido + aprendizajes documentados. Sesión 6 sobrevive como asesor background. Sesión 7 fresca arranca con este prompt.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: prompt canónico copy-pasteable para arrancar sesión 7 sin reconstruir contexto. Auto-contenido. Reemplaza al prompt B "Camino producto DAI" de prompts-arranque-sesion-6.md (que llevó al moco de inventar pivote sin leer código). Esta vez con lectura obligatoria reforzada + decisión arquitectónica cerrada + 5 pasos pendientes explícitos + anti-patrones cazados sesión 6.
mutable: sí
fecha_elevacion_global: n/a
reemplaza_a: n/a (extiende cadena prompts-arranque-sesion-N)
---

# Prompt canónico arranque sesión 7 FORJA DAI siguiente

Fito copia y pega el bloque PROMPT abajo al arrancar sesión 7. Sesión 7 NO necesita reconstruir contexto si arranca con este prompt + lee los archivos linkeados.

Sesión 6 sobrevive como asesor en background. Si sesión 7 trae cazadas o ajustes, Fito los relaya a sesión 6 asesor.

---

## PROMPT (copy-paste literal)

```
PROMPT ARRANQUE SESIÓN 7 FORJA DAI siguiente

Soy FORJA DAI siguiente sesión 7. Sesión 6 cerró al 96% ventana con:
- PIVOTE A CENTRALIZADO CANCELADO post-cazada Fito "lo simple es complejo".
- Vuelta a V24 distribuido CONFIRMADA. driveproyectodai@gmail.com YA es el sistema operador del piloto Bartolomé Mitre con Nely. V24 modelo C ya corre cross-account validado.
- Aprendizajes sesión 6 documentados a aplicar al V24 (NO tirar el aprendizaje del proceso fallido).
- 5 pasos pendientes para ejecutar con dale Fito explícito.
- Sesión 6 sobrevive como asesor en background.

Antes de tocar NADA, leer COMPLETOS (no headers, lectura entera):

1. proyecto-dai/docs/design/estado-actual-sesion-6-2026-05-02.md
   ★★★ SALVAVIDAS PRE-COMPACTACIÓN. Decisión final + aprendizajes + 5 pasos
   pendientes + instrucciones explícitas si me compactaron + qué NO hacer.
   Si solo leés UN archivo, leé este.

2. proyecto-dai/docs/design/INDEX.md
   ★★ catálogo navegable de los docs del proyecto + descartados marcados.

3. proyecto-dai/docs/design/dai-bases-fundamentales.md
   ★★ bases inmutables del proyecto (qué quiere Fito + qué necesitan las
   escuelas + non-goals + flow real).

4. proyecto-dai/README.md ★ flow declarado del producto.

5. proyecto-dai/docs/design/01-problema.md
   ★ qué resuelve DAI.

6. proyecto-dai/docs/design/02-non-goals.md
   ★ qué NO hace DAI. Línea 9 dice "no multi-tenancy centralizado" — la
   sesión 6 violó esto inventando pivote, NO repetir.

7. proyecto-dai/docs/design/03-arquitectura.md
   ★ arquitectura declarada D1 container-bound MIT.

8. proyecto-dai/docs/design/cierre-sesion-5-plan-continuidad.md
   ★★ lo que falta del producto V24 distribuido (R9.A + R9.B + paso 20 docs
   + acciones manuales).

9. proyecto-dai/docs/design/baja-sumar-docente.md
   ★ plan v3 madre (20 pasos del refactor modelo C ya implementado).

10. proyecto-dai/apps-script/src/webapp/WebApp.gs ★★ entero ~1000 LOC,
    modelo C V24.

11. proyecto-dai/apps-script/src/orchestration/OnSubmitDispatcher.gs ★
    handlers operativos.

12. proyecto-dai/apps-script/src/webapp/PanelDocentes.html
    ★ panel público mobile-first 190 líneas.

13. proyecto-dai/apps-script/src/webapp/PanelDirectora.html
    ★ panel admin 2700 líneas con 94 SPOFs cazados pre-código paso 17.3.

14. ~/.claude/CLAUDE.md global ★ releer entero. L9 NO MEZCLAR PROYECTOS,
    L19 lo nuevo reemplaza no apila, L55 si el mismo error se repite cambiar
    enfoque.

15. Memoria persistente proyecto-dai TODOS los archivos
    (~/.claude/projects/C--Users-adolp-Desktop-proyecto-dai/memory/).
    Especial atención a feedbacks nuevos sesión 6:
    tool-blindness-memoria-cruzada.md +
    decisiones-tecnicas-atribuidas-falsamente-a-fito.md.

16. CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/checklist-pendientes.md
    ★ bloque "Cierre 2026-05-01 sesión 5" + bloque "Cagadas sesión 6 a
    revertir" + decisiones arquitectónicas declaradas del producto.

17. CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-022-cazada-tool-blindness-escala-mayor.md
    ★ qué pasó en sesión 6 antes del pivote (sesión 5 anterior ya escribió
    el snapshot del moco antes de que sesión 6 lo reconozca).

Estimado lectura completa: 60-90 min. Si lo saltás repetís el moco
sesión 6 (~9 hs perdidas inventando arquitectura imaginaria).

Después de leer:
- git status proyecto-dai. Esperado: branch feat/paso-22-distribuido
  pendiente borrar (paso 2 abajo).
- curl -I https://script.google.com/macros/s/AKfycbyYZOSVbpoWY8UvAszsx5P85mQGvUtbt8-Pe_J-WNpSviQyDGGKuQM2EvifVYY8VLAE/exec
  Esperado: HTTP 302 (V24 producción intacto).
- Verificar que existe V25 deployment de test pendiente undeploy:
  cd apps-script && clasp deployments
  Esperado: ver deployment con descripción "chunk 22.1 test openById
  cross-Sheet TEMPORAL". Ese es el V25 a revertir paso 2.

Reportar 8-12 líneas confirmando contexto cargado + plan acción
inicial (paso 1 de los 5 pendientes, post-dale Fito).

DECISIÓN ARQUITECTÓNICA TOMADA SESIÓN 6 — NO REABRIR:

Pivote a centralizado CANCELADO. V24 distribuido vigente.
Pivote queda como PROYECTO FUTURO CONDICIONAL: si una directora resuelve
sola desde PC con tutorial bien hecho quizás ni hace falta nunca; si
gobierno (Ministerio Educación / TransFORMAR@Cba) toma posta, ellos
resuelven distribución masiva; si Apps Script Library verificada se
vuelve viable algún día, otra opción. Pero HOY NO se resuelve.

Para Nely + piloto Bartolomé Mitre + 5-10 escuelas piloto siguientes:
V24 distribuido sobre driveproyectodai (piloto) o Opción A asistida
(escuelas siguientes con manuales modulo-0-3 ya escritos al 70% +
checklist-opcion-A-setup-asistido.md ya escrito) alcanza.

5 PASOS PENDIENTES para ejecutar (esperan dale Fito explícito):

PASO 1 — Doc cierre del pivote
Escribir docs/design/dai-pivote-cancelado-2026-05-02.md con:
- Cazada Fito "lo simple es complejo" + driveproyectodai YA es operador.
- Por qué se canceló (3 problemas separados que sesión 6 mezcló: piloto
  HOY ya resuelto / escalar 5-10 con Opción A asistida / 956 escuelas
  proyecto futuro condicional).
- Aprendizajes a conservar (los 8 puntos sección 2 estado-actual).
- Qué queda como proyecto futuro condicional con condiciones concretas.
- Próximo paso volver a cierre sesión 5 (R9 + paso 20 docs).

PASO 2 — Reversión técnica
- (cd apps-script && clasp undeploy AKfycbwS15tnUE3mteXlJeYYCPcoyOwYc26ziSO7yI-vzRCYgshKoDCONqWwHeLA9mA7ysDh)
- git checkout feat/baja-sumar-docente-v3
- git checkout -- apps-script/src/webapp/WebApp.gs
- git branch -D feat/paso-22-distribuido
- Crear docs/design/descartados-pivote/ con README explicando contenido.
- Mover los 6 docs descartados con frontmatter actualizado
  "estado: histórico — descartado por re-evaluación 2026-05-02":
  - paso-22-pre-fase-cuestionar-plan.md
  - refactor-paso-22-mapeo.md
  - chunk-22.0b-research-bloqueante-cierre.md
  - dai-pivote-centralizado-v0.md
  - dai-pivote-centralizado-briefing-sesion-7.md
  - 5-lentes-adr-forms-sintesis.md

PASO 3 — Actualizar INDEX.md
Agregar bloque "DESCARTADOS 2026-05-02 — pivote a centralizado cancelado"
con los 6 docs movidos. Actualizar sección "Lectura obligatoria" para
apuntar solo a docs vigentes (sin briefing-sesion-7 que está superseded
por estado-actual-sesion-6).

PASO 4 — Actualizar checklist-pendientes.md en CLAUDE-CORE
- Cerrar [x] cada item del bloque "Cagadas sesión 6 a revertir"
  post-ejecución del paso 2.
- Agregar bloque "Aprendizajes sesión 6 a aplicar a V24" con los 8
  puntos sección 2 estado-actual.
- Re-confirmar sección "Cierre 2026-05-01 sesión 5" como vigente:
  R9.A + R9.B + paso 20 docs + acciones manuales pendientes.

PASO 5 — Snapshot-023 cierre sesión 6
Escribir CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-023-pivote-cancelado.md
con: contexto sesión 6 (carga de contexto post-cazada tool blindness +
diseño pivote + aplicación 5 lentes + lente 6 + cazada Fito "lo simple
es complejo") + decisión cancelar pivote + aprendizajes a aplicar al V24
+ estado final V24 distribuido confirmado + lecciones meta para futuras
sesiones (4 cazadas estructurales sesión 6).

POST-5-PASOS retomar V24 distribuido foco:

- R9.A — 4 corridas operador desde driveproyectodai (mínima 1 docente 1
  sección / completa varias docentes 5+ secciones / error paths / cambio
  incremental).
- R9.B — Demo Fito-como-Nelly desde adolfoprunotto@gmail.com mobile +
  desktop según necesidad.
- Paso 20 docs — 4 docs nuevos + README final + Módulo 0 con video
  instructivo + alinear /ayuda con flow modelo C real (no modelo viejo).
- Acciones manuales — re-bootstrap plantilla pública DAI Plantilla 2026
  + borrar contenido col 10 Token en Sheet vivo (deuda visual menor).

APRENDIZAJES SESIÓN 6 a aplicar al V24 distribuido:

1. Las 4 convergencias 4-lentes universales (cazadas sobre UX no
   específicas del centralizado): idempotency con UUID + dedup server,
   evidencia persistente post-submit (NO toast efímero), auto-save
   borrador localStorage por form, reintento + manejo offline mobile.
   Verificar empírico V24 actual cuáles ya tiene del paso 17.3 sesión 3
   (94 SPOFs cazados) y cuáles faltan ANTES de R9.B.

2. Las 5 preguntas Nivel 1 destiladas DAI con ROI medido. Aplicar al
   paso 20 docs antes de redactar cada módulo. Especialmente Q5 ¿plan
   sigue vigente? + Q6 KITCHEN SINK detector (¿este módulo lo pidió
   alguien o lo agregamos por completitud profesional?).

3. Técnica de las 5 lentes canonizada como método de validación
   pre-código para sub-pasos críticos UX no técnica del paso 20 (módulo
   0 video, página de ayuda, nota de prueba social). Caso seminal en
   analisis-patrones-dai/caso-estudio-validacion-5-lentes-paso-17-3.md.

4. Lente 6 cazada "groupthink simulado": las lentes pueden converger
   por construcción del prompt si todas miran el mismo input. Aplicar
   pluralidad real (inputs distintos por lente, perspectivas
   independientes) al validar sub-pasos.

5. "Lo simple es complejo" — anti-inflación de problemas. Antes de
   proponer cualquier enfoque arquitectónico nuevo, validar que el
   problema existe HOY para usuario actual, no en horizonte futuro
   hipotético. Candidato a feedback persistente nuevo.

6. Cuestionar el frame antes de decidir. Antes de aplicar 5 lentes
   sobre Opción A vs B, preguntar primero si A vs B son las opciones
   correctas o el frame mismo está mal formulado.

7. 11 cazadas técnicas Apps Script catalogadas en emergentes.md (clasp
   src/ prefix, PropertiesRegistry JSON wrapper, ScriptApp.getService.getUrl
   context-dependent, emojis primer char celda, /dev fragility, triggers
   cross-Sheet imposibles, simple triggers limitados a 6 reservados,
   límite 20 triggers/usuario/script, Session.getActiveUser deploy mode,
   setRequireLogin deprecated, tokens URL OK con e.parameter). V24 las
   maneja en su mayoría — verificar al hacer R9 si emerge alguna.

8. Feedback persistente nuevo en memoria proyecto-dai:
   tool-blindness-memoria-cruzada + decisiones-tecnicas-atribuidas-falsamente-a-fito.
   Universales para cómo opero Claude.

ANTI-PATRONES OBLIGATORIOS (cazados sesión 6):

- NO reabrir el pivote a centralizado. Si emerge sensación de "sería
  mejor centralizar", PARAR y leer estado-actual-sesion-6 sección 1 + 4
  (por qué se canceló).
- NO inventar arquitectura sin haber leído los 17 archivos de arriba.
- NO atribuir decisiones técnicas a Fito (especialmente APIs Apps Script
  / quotas / modelos seguridad / OAuth) — verificar empírico contra docs
  oficiales actualizados (cutoff modelo enero 2026, fecha real ~mayo
  2026 — APIs pueden haber cambiado).
- NO firma cierre auto-asumida (cazada estructural sesión 5 + 6 —
  feedback no-ofrecer-pausa.md + tool-blindness + decisiones-atribuidas).
- NO ofrecer pausa.
- NO commit sin "dale firma" explícito.
- NO push a remoto sin "dale pushea" explícito.
- NO borrar nada sin doble dale (CLAUDE.md L5).
- "Lo simple es complejo": antes de proponer enfoque arquitectónico
  nuevo, validar que el problema existe HOY.

— FORJA DAI siguiente sesión 7 arranque, fecha-de-arranque.
```

---

## Notas operativas finales

**Sobre sesión 6 como asesor en background:**
Sesión 6 quedó al 96% ventana post-Write de este prompt. Si Fito relaya cazadas o ajustes de sesión 7 a sesión 6, sesión 6 reflexiona desde su contexto residual. El salvavidas pre-compactación es `estado-actual-sesion-6-2026-05-02.md` que tiene todo lo charlado en el cierre.

**Sobre el prompt mismo:**
Auto-contenido. Lista 17 archivos lectura obligatoria pre-arranque. Decisión arquitectónica cerrada explícita. 5 pasos pendientes con dale Fito. 8 aprendizajes a aplicar. Anti-patrones explícitos cazados sesión 6.

**Si sesión 7 cambia algo:**
Los 5 pasos pendientes son sticky — no se re-decidir salvo que el contexto cambie sustancialmente. Si Fito quiere otra prioridad al arrancar (ej. R9.A directo sin ejecutar los 5 pasos), eso es decisión de Fito en su turno, no de Claude por inercia.

**Si sesión 7 detecta que algo del prompt o de los aprendizajes no encaja con la realidad técnica de V24:**
Frenar antes de codear. Reportar a Fito. Si hace falta investigar, lanzar agente background. NO reescribir aprendizajes sin dale.

— escrito al cierre sesión 6, 2026-05-02, 96% ventana pre-compactación.
