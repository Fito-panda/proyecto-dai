---
doc: proyecto-dai/docs/design/dai-pivote-centralizado-briefing-sesion-7
estado: vivo — briefing autocontenido para sesión 7 (diseño/arquitectura) y sesión 8+ (codeo)
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, cierre del ciclo de lectura post-cazada Fito sobre tool blindness escala mayor. Sesión 6 leyó el sistema entero (código + docs + reportes de agentes + costumbres + emergentes) en 4 batches después de inventar arquitectura imaginaria por NO leer al inicio. Doc construido aplicando costumbre `briefing-autocontenido-sesion-paralela` para que cualquier sesión futura arranque sin perder contexto.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: briefing autocontenido para que la próxima sesión (que será de codeo, según decisión Fito 2026-05-02 "esta sesión solo diseño/arquitectura, otra codea") arranque con contexto completo del pivote a modelo centralizado SIN repetir el moco de sesión 6 (diseñar arquitectura sin leer código real). Si la sesión que arranca lee este doc + los docs linkeados, NO necesita reconstruir nada.
mutable: sí (Fito puede ajustar; sesiones de codeo agregan al final)
fecha_elevacion_global: n/a
reemplaza_a: superseded por este doc: el camino "paso 22 distribuido cross-Sheet" entero quedó descartado. Los 3 docs descartados quedan en disco como evidencia del proceso fallido.
---

# DAI — Pivote a modelo centralizado · briefing sesión 7+

> **Lectura obligatoria al arrancar sesión nueva DAI**, en este orden, ANTES de tocar código o diseñar nada nuevo. Si saltás algún archivo, vas a inventar arquitectura que ya está resuelta o a violar non-goals explícitos.

## 0. Lectura obligatoria pre-arranque

1. `proyecto-dai/docs/design/dai-bases-fundamentales.md` — bases inmutables del proyecto.
2. `proyecto-dai/docs/design/dai-pivote-centralizado-v0.md` — primer borrador del pivote (este doc lo extiende).
3. Este doc (sesión 6 cierre del ciclo de lectura).
4. `proyecto-dai/README.md` — flow declarado.
5. `proyecto-dai/docs/design/01-problema.md` — qué resuelve DAI.
6. `proyecto-dai/docs/design/02-non-goals.md` — qué NO hace.
7. `proyecto-dai/docs/design/03-arquitectura.md` — arquitectura declarada.
8. `proyecto-dai/docs/Sheet-Template-Design.md` — spec del Sheet.
9. `proyecto-dai/apps-script/src/Main.gs` + `orchestration/SetupOrchestrator.gs` + `orchestration/TemplateBootstrapper.gs` + `orchestration/OnSubmitDispatcher.gs` — entry points + flow real V24.
10. `proyecto-dai/apps-script/src/webapp/PanelDocentes.html` (~190 líneas) y `PanelDirectora.html` (~2700 líneas) — paneles mobile-first.
11. `proyecto-dai/apps-script/src/webapp/WebApp.gs` — modelo C V24 (`_resolveAuthByEmail`, `submitOperativoFromPanel`, `submitSumarFromPanel`, etc.).
12. Memoria persistente del proyecto (`~/.claude/projects/C--Users-adolp-Desktop-proyecto-dai/memory/`) — 11 feedback files.
13. `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/checklist-pendientes.md` — bloque "Cierre 2026-05-01" + "Cagadas sesión 6".
14. `CLAUDE-CORE/catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-022-cazada-tool-blindness-escala-mayor.md` — qué pasó en sesión 6 antes del pivote.
15. Reportes de agentes 2026-05-01 + emergentes.md (cazadas A-K) — solo si vas a tocar arquitectura/scope.

Estimado lectura completa: 60-90 min. Si lo saltás, costo histórico fue ~9 hs perdidas en sesión 6.

## 1. Decisión arquitectónica tomada el 2026-05-02

**Pivote a modelo centralizado.** El equipo mantenedor (Fito) deploya UN Web App único en SU cuenta Google. Todas las escuelas usan la MISMA URL pública con `?sheetId=<su-sheet-id>` para distinguirse. Cada escuela tiene SU propio Sheet en SU Drive con SUS datos. Las docentes acceden vía link único en grupo WhatsApp.

Disparador: en el modelo distribuido original, el deploy del Web App requería abrir Apps Script editor en compu y configurar 8-10 clicks técnicos (Implementar → Nueva implementación → tipo Web App → Execute as user accessing → Anyone with Google account → consent OAuth → copiar URL). Imposible para directora rural mobile-only no técnica. Validado empírico contra docs oficiales 2026-05-02 vía agente background: la API de deploy programático SÍ existe (`projects.deployments.create`) pero su setup previo es igual o peor de intimidante que el deploy manual. NO existe path mobile-only para self-deploy.

Tradeoff aceptado conscientemente: 100% autohostable (cada escuela 100% suya, cero dependencia de Fito) → simplicidad de distribución (vos hostes 1 Web App para 956+ escuelas, código sigue MIT en GitHub para que cualquiera clone y deploye otra instancia si vos desaparecés).

**Esta decisión NO se reabre salvo evidencia técnica nueva**. Cualquier sesión que proponga "modelo X SaaS distribuido" o "cada escuela su Web App" o "Library compartida" debe leer 02-non-goals.md línea 9 + este doc + el snapshot-022 antes de seguir.

## 2. Cuello de botella original que motiva el pivote

Hasta sesión 5, el flow asumía que la directora abría Apps Script editor desde compu UNA VEZ para deployar el Web App. El plan v9 paso 0 del Módulo de ayuda decía "guíada en /ayuda Paso 0". El research empírico 2026-05-02 confirmó: ese paso es UN flow técnico de 8-10 decisiones específicas en pantalla intimidante. Nely va a llegar ahí, ver Apps Script editor (carpetas .gs + código + botones "Implementar"), tener miedo, llamar a alguien o abandonar.

Otras opciones evaluadas y descartadas:
- Apps Script Library con HEAD: Google explícitamente dice "no para producción" — un Cmd+S accidental rompe a todas las escuelas simultáneo. Más sharing limit 100-user no documentado oficialmente para 1k+.
- Editor Add-on Marketplace: requiere instalación per-user, no es URL pública abrible desde WhatsApp.
- Workspace Add-ons: idem.
- API self-deploy desde menú: requiere habilitar Apps Script API manualmente + GCP project standard + consent OAuth con scopes peligrosos. UX igual o peor.

Solo el modelo centralizado resuelve el cuello de botella respetando "directora mobile-only no técnica".

## 3. Estado actual del backend V24 modelo C (lo que YA tenemos)

V24 producción corre en `driveproyectodai` con 9 commits pusheados (be169f4..a3d027e en branch `feat/baja-sumar-docente-v3`). Última versión validada cross-account en chunk C sesión 5: cuenta Gmail común externa entró al panel admin del operador via Session.getActiveUser sin tokens UUID en URL.

**~80% del backend V24 es reusable directo o con ajuste menor para el pivote centralizado**:

- `_resolveAuthByEmail()` — modelo C auth por email. Ajuste: aceptar `sheetId` opcional (si presente, `openById(sheetId)`; si no, legacy TemplateResolver para uso interno operador).
- `_readEquipoDocente()` + `_findEquipoDocenteByEmail()` + `getEquipoDocenteForPanel()` — propagación de `sheetId`.
- `submitOperativoFromPanel()` + `submitSumarFromPanel()` — handlers operativos del panel admin. Propagación `sheetId`.
- `OnSubmitDispatcher.gs` con `DISPATCH_TABLE` — UN trigger Sheet-bound + dispatcher por nombre de pestaña. **Se mantiene PERO el contexto de ejecución cambia** (ver sección 4 ADR principal).
- `handleSumarDocente`, `handleAuthCheck`, `_changeDocenteEstado` — handlers operativos. Resuelven Template via TemplateResolver — ajuste para resolver vía `sheetId` cuando aplique.
- `PanelDocentes.html` (190 líneas) — HTML mobile-first. Ajuste: aceptar `sheetId` param para mostrar info correcta.
- `PanelDirectora.html` (2700 líneas) — panel admin mobile-first con resumen "Mi equipo hoy" + Equipo Docente (Sumar/Licencia/Volvió/Baja con dialogs nativos + optimistic UI + watchdog 90s + verify on timeout + sessionStorage draft + 94 SPOFs cazados pre-código en paso 17.3 sesión 3). Ajuste: cliente JS propaga `sheetId` en cada `google.script.run.X(args, sheetId)`. Stateless arg, no Properties (race conditions).
- `TuPanelTabBuilder.gs` — pestaña "📱 Cómo entrar" del Sheet. Ajuste: URLs construidas con `&sheetId=<MISHEETID()>` dinámico.
- `MISHEETID()` custom function — devuelve `SpreadsheetApp.getActive().getId()`. NUEVO, ~5 LOC.
- `bootstrapTemplate()` + `setupAll()` — orquestador. **Cambia el contexto de ejecución**: ya no corre desde script bound al Sheet de la escuela, corre desde TU Web App como user accessing sobre Sheet de la escuela vía `openById`. Ver sección 4.
- `DocGenerator` + 9 templates Google Docs — generación de docs formales (PIE, actas, autorizaciones, comunicados, SGE, legajos). Reusable. Cambia trigger (ver ADR principal).
- `ConfigSheetBuilder.gs` — crea las 8 pestañas del Sheet template. Reusable directo.
- `FolderBuilder.gs`, `SheetBuilder.gs`, `FormBuilder.gs`, `ListasMaestrasBuilder.gs` — builders. Reusables, ejecución cambia (corre desde TU Web App como user accessing).
- `appsscript.json` manifest — scopes ya cubren pivote (`spreadsheets`, `drive`, `forms`, `userinfo.email`).

**Lo que cambia conceptualmente:**

1. El Sheet template público que las escuelas copian a su Drive **probablemente NO va a tener script bound** en pivote centralizado. Es solo planilla con 8 pestañas + datos. El script vive solo en TU cuenta operadora. PENDIENTE confirmación: depende del ADR principal.
2. Triggers de Forms operativos no pueden vivir en script ajeno (cazada del primer agente sesión 6 confirmada con docs oficiales). En modelo distribuido original, los triggers vivían en script bound al Sheet de la escuela. En modelo centralizado, los triggers no existen como tales — se reemplazan por algo que el ADR principal define.
3. El bootstrap inicial (lo que hoy hace `bootstrapTemplate()` corriendo desde la copia local) ahora corre desde TU Web App vía `openById` como user accessing sobre Sheet ajeno.

## 4. ADR principal abierto — Forms operativos en modelo centralizado

Decisión arquitectónica grande pendiente. Define mucho del scope de implementación.

### Opción A — HTML forms en Web App centralizado (drop Google Forms nativos)

La docente toca un botón en panel docentes → se abre HTML form del operador → submit dispara `google.script.run.submitX(args, sheetId)` → el Web App procesa con scope del usuario logueado, escribe directo al Sheet de la escuela vía `openById`.

Pro: arquitectura limpia. NO depende de triggers cross-Sheet. Updates instantáneos del UX (cambio HTML una vez, todas las escuelas tienen UX nueva). Funciona offline parcialmente con sessionStorage. Privacidad técnica controlada.

Contra: se pierde UX familiar de Google Forms (offline robusto, autocomplete, save progress nativo). Hay que re-implementar 11 forms en HTML (~400 LOC nuevos por la formita más compleja, escalable). Si falla la red al submit, se pierde lo escrito (mitigable con sessionStorage draft).

LOC neto estimado: -150 LOC (FormApp.create + ConfigForms items) + 400 LOC HTML forms = +250 LOC.

### Opción B — Forms nativos sin trigger + procesamiento on-demand desde panel admin

bootstrap remoto crea Google Forms en Drive de la directora (FormApp.create + setDestination al Sheet de la escuela). Submits van al Sheet de respuestas. Sin trigger, las respuestas quedan acumuladas. Cuando la directora abre panel admin, el panel detecta "tienes 5 respuestas pendientes de procesar" → click "Procesar todas" → `google.script.run.processarPendientes(sheetId)` → Web App procesa con user accessing → invoca handlers + DocGenerator on-demand.

Pro: mantiene UX familiar de Forms nativos para docentes (offline robusto, save progress, autocomplete). Las docentes operan exactamente igual que en modelo distribuido — cero cambios para ellas. Re-uso 100% del bootstrap actual + handlers + DocGenerator + dispatcher (con ajustes menores).

Contra: tiempo real perdido — la docente NO ve el doc generado al instante. Si la directora no entra al panel por días, los docs se acumulan. UX confusa. Si falla `processarPendientes`, datos quedan limbo. Trigger time-based en TU Web App podría procesar nightly como mitigación.

LOC neto estimado: +150 LOC (`processarPendientes` + UI panel admin "5 respuestas pendientes" + cron trigger).

### Recomendación honesta

**Opción A es más limpia arquitectónicamente. Opción B preserva UX familiar para docentes.** Decisión depende del peso relativo Fito sobre estos dos vectores.

**Cazada estructural a tener presente**: en Opción B el bootstrap remoto crea Forms en Drive ajeno via `openById` como user accessing. **Esto NO está validado empírico todavía**. La validación del chunk C sesión 5 fue cross-account pero NO cross-Sheet. La sesión que codee debe diseñar test empírico de `_testOpenById` cross-Sheet ANTES de codear backend (lo que sesión 6 hizo conceptualmente pero contra modelo equivocado — la idea del test sirve, el contexto era el incorrecto).

## 5. Las 10 preguntas Nivel 1 a responder antes de codear

(5 universales del reporte `frameworks-pre-diseno-anti-sobreingenieria` + 5 específicas DAI del reporte `destilacion-preguntas-nivel-1-desde-DAI`.)

### 5 universales

1. Job real del usuario: ya respondido en `01-problema.md` ("ordenar el caos del Word compartido"). Confirmar que el pivote NO cambia el job.
2. Quién es el usuario y qué limita su contexto: ya respondido (Nely + 7-10 docentes + Gmail común + celular + internet intermitente + con suerte una PC prestada UNA vez).
3. Hipótesis a testear y cómo sabremos que falla: hipótesis explícita del pivote → "una directora rural sola desde su celular puede instalar DAI en menos de 30 min sin asistencia técnica usando flow centralizado". Cómo falla → R9.B mobile-only sin asistencia. Si tarda > 30 min o se traba, falla.
4. Por qué este deliverable y no otro: 4 alternativas evaluadas (modelo X distribuido, Apps Script Library, Editor Add-on Marketplace, modelo centralizado). Las 3 primeras tienen blocker explícito en research. Modelo centralizado es la sobreviviente.
5. Qué tendría que pasar para que falle: pre-mortem 5-min listo para escribir post-decisión ADR principal.

### 5 específicas DAI con ROI medido

1. Q3 ¿Auth fuerte o confianza humana alcanza? — RESPUESTA: confianza humana alcanza. Modelo C V24 sin tokens. ~445 LOC + 3 sesiones evitadas si se hubiera hecho al inicio. Sigue válido en pivote.
2. Q1 ¿Usuario primario solo o equipo distribuido? — RESPUESTA: equipo (Modelo B mail comunitario tipo banco con 2-3 personas). Cazada H "ni la directora SPOF". Sigue válido en pivote.
3. Q2 ¿Mail/notificaciones o ver info donde ya trabaja? — RESPUESTA: ver info en Drive + panel. NO mail. Pestaña "📱 Cómo entrar" del Sheet + panel admin centralizan info. Sigue válido en pivote.
4. Q5 ¿Plan sigue vigente? — APLICAR antes de codear cualquier chunk. Esta sesión ya aplica al meta-nivel (descubrimos que paso 22 distribuido entero NO aplica al modelo centralizado).
5. Q6 ¿Algún usuario real pidió esto? — APLICAR específicamente al panel admin extendido del pivote (configurar escuela + secciones + espacios + activación forms desde panel). ¿Vale la pena cada feature o es scope creep?

## 6. Cazadas estructurales DAI a aplicar al pivote

Catalogadas en `analisis-patrones-dai/emergentes.md` líneas 1-790. Las que aplican directo:

- Cazada D mobile-first "ella lo tiene que hacer desde el celular" — restricción operativa entra al modelo desde el inicio. Confirmar en cada chunk: ¿esta decisión técnica preserva mobile-first?
- Cazada I "solo registradas operan" — modelo C valida vs `👥 Docentes` Activa. Mantener en pivote.
- Cazada H "ni la directora SPOF" — Modelo B mail comunitario. Mantener.
- Cazada G "no creemos un muro, hagamos puertas" — diseño minimal del schema. NO inflar campos por las dudas.
- Cazada J "lenguaje de Nely no del Ministerio" — copy nativo. Aplicar al panel admin extendido + landing.
- Cazada F "mapeo del plomero" — antes de codear cualquier chunk, mapear flujo de datos + dependencias.
- Cazada A "loop hasta convergencia" — auditar exhaustivo NO declarar terminado prematuro.
- Cazada B "no dejar para después lo que puede quedar bien ahora" — prolijidad atómica.
- Cazada C "render visual pre-decisión UX" — para decidir UX, ASCII art o mockup, no tablas.
- Meta-patrón "Fito como safety net multidimensional" — esperar cazadas estructurales del humano. NO defenderse.

## 7. Riesgos nuevos específicos del pivote

1. **SPOF estructural nuevo**: las 956 escuelas dependen de que TU Web App esté arriba. Mitigación: código MIT en GitHub + docs operativas claras + co-mantenedor desde el principio + testamento técnico (si Fito desaparece, el dominio proyectodai.com va a esta persona/ONG).
2. **Privacidad pasa de técnica a política**: en modelo distribuido vos NO tenías acceso técnico a Sheets de escuelas (cada uno bound a su script). En centralizado SÍ tenés capacidad técnica via `openById`. Política tuya documentada: "no miro datos de escuelas". Requiere documento legal Ley 25.326 explícito + audit log + commitment público en landing.
3. **Quotas Apps Script a escala**: TU Web App va a recibir tráfico de N escuelas concurrente. Quotas Apps Script son per-user pero hay límites globales por deployment. NO investigado empírico todavía. Research bloqueante antes de scale-out.
4. **OAuth verification de Google**: ahora tiene sentido tramitarla UNA vez para tu Web App único (cubre las 956 escuelas). En modelo distribuido era irrelevante (cada escuela su deploy). En centralizado pasa a ser deuda explícita pre-distribución masiva. ~2-4 semanas de trámite + política de privacidad + video explicativo. Pero vale la pena: elimina el warning amarillo "no verificada" para todas las escuelas.

## 8. Skills + costumbres + reportes disponibles

### Costumbres preservadas path vivo

`propuesta-forja-requiere-auditoria-externa`, `junta-asincronica-2-voces-asesor-ejecutor`, `instrucciones-accionables`, `formato-respuesta-3-1-1`, `consejo-universal-vs-decision-contextual`, `checklist-pendientes-por-proyecto`, `control-usuarios-desde-dia-1`.

### Costumbres archivadas — invocar con "dale traé X"

`entrevista-descubrimiento`, `landscape-research-pre-diseno`, `aporte-critico-al-brief`, `cuestionar-plan-pre-fase`, `briefing-autocontenido-sesion-paralela`, `vocabulario-anclado-al-contexto`, `trade-off-explicito-pre-bug`, `scriptapp-geturl-context-dependent`, `auto-consulta-catedral`, `tool-blindness-antipatron-operativo`, `properties-registry-json-schema`, `mapeo-de-plomero-pre-implementacion`.

### Skills instaladas

`cognitivo:sistema-dinamico` (9 agentes que fuerzan comprensión real antes de resolver — NO repetir moco sesión 6), `arcanomedia:abogado-del-diablo`, `cognitivo:motor-recursivo`, `simplify`, `bitacora:cargar-contexto`, `bitacora:artefacto-transferencia`, `anthropic-skills:consolidate-memory`.

### Reportes de agentes pendientes de aplicar

- `frameworks-pre-diseno-anti-sobreingenieria.md` — 11 frameworks externos + 3 costumbres canonizables (5 preguntas Nivel 1 / ADR mínimo Forja / Pre-mortem 5 min).
- `compilacion-skills-existentes-meta-problema.md` — 20 skills evaluadas + recomendación 3-5 a instalar.
- `destilacion-preguntas-nivel-1-desde-DAI.md` — 13 preguntas DAI con ROI medido.
- `auditor-externo-alzheimer-post-cierre.md` — 7 patrones para protección post-cierre.

### Memoria persistente proyecto-dai

11 feedback files. Más críticos para próxima sesión: `pre-condiciones-empiricas`, `dudas-disfrazadas-de-decisiones`, `tool-blindness-memoria-cruzada`, `decisiones-tecnicas-atribuidas-falsamente-a-fito`, `gaslighting-ia`, `no-ofrecer-pausa`, `mapeo-plomero-pre-sub-paso`.

## 9. Decisión pendiente sobre cómo arrancar — Camino A/B/C

Antes de codear nada, Fito tiene que decidir entre 3 caminos posibles para abordar el pivote:

**Camino A — Reciclar lo desarrollado, adaptarlo al pivote.**
Tomar V24 modelo C entero, agregar `sheetId` param + `openById`, propagar por handlers + paneles + cliente JS. Mantener arquitectura general, ajustar puntos de contacto con el modelo distribuido. Estimado: ~200-280 LOC nuevos + ajustes en ~10 archivos existentes.
Riesgo: arrastrar decisiones del modelo distribuido que NO aplican al centralizado (ejemplo: bootstrap localizado, dispatcher Sheet-bound, etc). Sobre-ingeniería heredada.

**Camino B — Arrancar de 0, reciclar solo ideas.**
Borrar el código de V24, escribir desde cero un Web App centralizado tipo SaaS, mantener solo decisiones de diseño (modelo C auth, schema 👥 Docentes, panel mobile-first, etc.). Estimado: re-escribir ~3000 LOC + tests + paneles.
Riesgo: tirar 6+ sesiones de trabajo + plomería ya resuelta + 94 SPOFs cazados pre-código en paso 17.3.

**Camino C — Arrancar de 0 conceptualmente sabiendo lo que sabemos, adaptar lo desarrollado.**
Pensar la arquitectura del pivote desde cero como si V24 no existiera. Después identificar qué piezas de V24 sirven literal o con ajustes mínimos. Reusar lo que sirve, reescribir lo que no encaja, descartar lo que es heredado del modelo distribuido. Estimado: re-pensar conceptualmente (1-2 sesiones diseño) + reusar 70-80% del backend + reescribir flow operativo según ADR principal.
Es el camino que aplica el patrón "Lo nuevo reemplaza a lo viejo. Nunca apiles" del CLAUDE.md global.

**Recomendación sesión 6**: Camino C. Razón: el pivote es decisión arquitectónica diferente, NO una "extensión" del modelo distribuido. Pretender reciclar todo (Camino A) lleva al sobre-ingeniería que sesión 6 hizo. Tirar todo (Camino B) pierde valor real (plomería + paneles + cazadas). Camino C re-piensa con datos pero adapta lo que SÍ aplica.

**Decisión Fito pendiente**: confirmar Camino C o elegir otro.

## 10. Próximos pasos post-decisión Camino A/B/C

Una vez Fito confirma Camino:

1. **Aplicar `cognitivo:sistema-dinamico`** sobre la propuesta del pivote — 9 agentes que fuerzan comprensión real antes de resolver. Especialmente para evitar repetir el moco sesión 6.
2. **Responder pre-mortem 5 min** + las 10 preguntas Nivel 1 que faltan respuesta concreta (especialmente Q5 plan sigue vigente y Q6 KITCHEN SINK aplicado al panel admin extendido).
3. **Decidir ADR principal Forms HTML vs nativos** con tradeoffs explícitos (sección 4 de este doc) + voto + razón documentada.
4. **Aplicar `arcanomedia:abogado-del-diablo`** sobre la propuesta del pivote post-ADR.
5. **Mapeo del plomero del backend del pivote** — qué archivos se tocan, cambios concretos, riesgos.
6. **Research bloqueante** antes de codear:
   - Test empírico de `bootstrapTemplate` corriendo desde TU Web App via `openById` sobre Sheet ajeno como user accessing — funciona? falla con permisos?
   - Test empírico de FormApp.create en Drive ajeno como user accessing (si Camino B del ADR).
   - Quotas Apps Script de TU Web App con N=956 escuelas concurrentes — investigación oficial Google.
7. **Mapear chunks de implementación** con LOC + ETA realista por chunk. Probable 6-10 chunks de 30 min a 2 hs cada uno.
8. **Branch separada** `feat/pivote-centralizado` desde `feat/baja-sumar-docente-v3` (V24 estable). NO tocar `master` ni `feat/baja-sumar-docente-v3` durante el pivote.
9. **R9.B mobile-only** ANTES de cualquier merge — Fito como Nelly desde adolfoprunotto@gmail.com en celular sin asistencia técnica.

NO arrancar a codear hasta tener pasos 1-7 completos.

## 11. Cazadas técnicas de Apps Script ya documentadas en emergentes.md

Sesión que codee debe leer si va a tocar estas áreas:

- clasp preserva `src/` prefix en paths de Apps Script (HtmlService.createTemplateFromFile usa el path completo).
- `PropertiesRegistry` JSON wrapper — NO leer Properties directo cuando son keys del registry.
- `ScriptApp.getService().getUrl()` retorna null fuera de doGet/doPost — cachear en Properties.
- Emojis en primer char de celda Sheet renderizan distinto — evitar.
- IDE Apps Script preview `/dev` se invalida con frecuencia — regenerar via "Implementar → Probar implementaciones".
- Triggers cross-Sheet imposibles — el script del operador NO puede instalar triggers en script ajeno.
- Simple triggers reservados solo 6: `onOpen`, `onInstall`, `onEdit`, `onSelectionChange`, `doGet`, `doPost`. `onFormSubmit` NO es simple trigger reservado.
- Límite 20 triggers/usuario/script — idéntico Gmail común y Workspace.
- `Session.getActiveUser().getEmail()` requiere deploy "Execute as: User accessing" para retornar email del visitante. Deploy "Execute as: Me" retorna email del owner siempre.
- `setRequireLogin(true)` está deprecado. Reemplazo: `setCollectEmail(true)` con modo VERIFIED.

## 12. Riesgo de regresión a vigilar

La próxima sesión que arranque sin leer este doc + los linkeados va a inventar uno de estos 3 patrones de moco (catalogados en sesión 6):

1. Inventar arquitectura imaginaria que contradice non-goals explícitos (modelo X SaaS multi-tenant cuando 02-non-goals.md línea 9 dice "no multi-tenancy centralizado").
2. Atribuir decisiones técnicas a Fito que él no podría tomar por no ser developer (ejemplo: "Fito decidió que deployWebApps() no existe").
3. Diseñar plomería sin leer código real del proyecto (sesión 6 escribió 5 hs de chunks distribuidos cross-Sheet sin leer PanelDocentes.html ni 03-arquitectura.md).

Anti-patrón que la próxima sesión debe aplicar al arrancar: leer este doc completo + los 14 archivos linkeados ANTES de tocar código o diseñar arquitectura. Costo lectura completa: 60-90 min. Costo de saltarlo: 9 hs perdidas en sesión 6.

## 13. Firma

Briefing autocontenido sesión 6 → sesión 7+ FORJA DAI siguiente. Cierra el ciclo de lectura post-cazada Fito sobre tool blindness escala mayor 2026-05-02. Aplica costumbre `briefing-autocontenido-sesion-paralela`. Aplica feedback `tool-blindness-memoria-cruzada` + `decisiones-tecnicas-atribuidas-falsamente-a-fito` (memoria persistente nueva creada en sesión 6). Aplica filosofía CLAUDE.md L9 "NO MEZCLAR PROYECTOS" + L17 "Buscá lo que existe antes de construir" + L19 "Lo nuevo reemplaza a lo viejo. Nunca apiles".

— FORJA DAI siguiente, sesión 6 cierre del ciclo de lectura, 2026-05-02. Pendiente: decisión Fito sobre Camino A/B/C antes de pasar la pelota a sesión 7 (diseño post-decisión) y sesión 8+ (codeo).
