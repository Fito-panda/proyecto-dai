---
doc: proyecto-dai/docs/design/dai-pivote-centralizado-v0
estado: vivo — base de discusión "falso 0" del pivote arquitectónico
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, post-cierre del moco estructural. Fito tomó decisión arquitectónica de pivote a modelo centralizado tras research empírico que confirmó (a) la premisa "API deploy programático no existe" era atribución falsa de Claude a Fito, (b) la API SÍ existe pero el setup la mata para usuario no técnico, (c) el cuello de botella del deploy manual hace inviable la distribución masiva self-service del modelo distribuido original. Doc base para discutir el pivote sin ejecutar.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: documento autocontenido (costumbre `briefing-autocontenido-sesion-paralela`) que cualquier sesión DAI puede leer para entender el pivote a modelo centralizado. Aplica las 5 preguntas Nivel 1 universales (sintetizadas en `catedral/reportes-agentes/2026-05-01-frameworks-pre-diseno-anti-sobreingenieria.md`) + ADR mínimo Forja + pre-mortem 5 minutos antes de mapear plomero o codear nada. NO ejecuta. Es input para discusión + decisión.
mutable: sí
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# DAI — Pivote arquitectónico al modelo centralizado · base "falso 0"

> **Lectura previa obligatoria** antes de discutir o ejecutar nada de este doc:
> - `proyecto-dai/docs/design/dai-bases-fundamentales.md` (bases del proyecto, no se re-discuten).
> - `catedral/reportes-agentes/2026-05-01-frameworks-pre-diseno-anti-sobreingenieria.md` (5 preguntas Nivel 1 + ADR + pre-mortem).
> - `catedral/reportes-agentes/2026-05-01-compilacion-skills-existentes-meta-problema.md` (qué skills ya tenemos + qué gaps hay).
>
> Si no leíste esos 3 docs, frená acá y leelos. NO avanzar al doc base sin esa carga.

## 1. Big picture del pivote

El modelo distribuido original (cada escuela su Sheet + script bound + Web App propio) tiene un cuello de botella estructural inviable para distribución masiva self-service: el deploy del Web App requiere abrir Apps Script editor en compu y configurar 8-10 clicks técnicos. Una directora rural mobile-only no técnica NO va a poder hacer ese paso sin asistencia.

Decisión Fito 2026-05-02 (con datos empíricos del agente background sobre la mesa por primera vez): pivote a modelo centralizado.

Modelo centralizado en 3 frases. El equipo mantenedor (Fito) deploya UN Web App único en SU cuenta Google. Cada escuela copia un Sheet template público a SU Drive y completa pestañas con datos propios. Las escuelas usan la URL única del Web App + un identificador (sheetId) que las distingue — todas comparten infraestructura, NADIE deploya excepto Fito.

Tradeoff aceptado. Antes: cada escuela 100% autohostable, equipo mantenedor NO es SPOF. Ahora: equipo mantenedor sostiene la plataforma central, las escuelas dependen de que esté arriba. Mitigación documentada: código sigue MIT en GitHub, cualquiera puede clonar y deployar otra instancia. Period de downtime potencial entre que Fito desaparece y otro retoma. Manejable con co-mantenedor + handoff doc.

## 2. Skills + costumbres + reportes existentes que aplican (mapa)

NO empezar a inventar. Lo que existe primero (filosofía CLAUDE.md L17 "Buscá lo que existe antes de construir").

### 2.1 Costumbres preservadas (path vivo `catedral/costumbres/`)

- `propuesta-forja-requiere-auditoria-externa` — gate obligatorio de auditoría adversarial externa para toda propuesta densa. Aplica a este doc base cuando esté completo.
- `junta-asincronica-2-voces-asesor-ejecutor` — validación 2 capas (asesor predictivo + abogado adversarial) antes de propuesta densa. Aplica al ADR principal.
- `instrucciones-accionables` — instrucciones fuera del LLM especifican objeto exacto y recorrido literal sin jerga. Aplica al video Módulo 0 + onboarding Nely.
- `formato-respuesta-3-1-1` — toda respuesta de acción arranca con 3 estado / 1 acción / 1 pendiente. Aplica al estilo de respuesta del sistema a Nely.
- `consejo-universal-vs-decision-contextual` — adaptar frameworks externos al contexto del proyecto, no importar receta literal. Aplica a las 5 preguntas Nivel 1.
- `checklist-pendientes-por-proyecto` — ya aplicado.
- `control-usuarios-desde-dia-1` — auth explícita Fase 0. Aplica al modelo C distribuido en backend centralizado.

### 2.2 Costumbres archivadas (path `catedral/archivo/canon-v1/costumbres/`) — invocar con "dale traé X"

- `entrevista-descubrimiento` — entrevista estructurada al humano antes de diseño denso. Lo que NO hicimos en sesión 6 y por lo cual asumí modelo X. Aplicar antes de mapear plomero.
- `landscape-research-pre-diseno` — Paso 0 biblia (research landscape). Re-research del landscape con modelo centralizado.
- `aporte-critico-al-brief` — criticar y ajustar el brief antes de ejecutar.
- `cuestionar-plan-pre-fase` — 4 preguntas (qué del plan sigue, qué research falta, qué nadie pidió, qué falta).
- `briefing-autocontenido-sesion-paralela` — este doc cumple ese rol.
- `vocabulario-anclado-al-contexto` — vocabulario del dominio del usuario (Nely + escuela rural), no genérico LLM.
- `trade-off-explicito-pre-bug` — declarar trade-off de prioridades antes de implementar.
- `scriptapp-geturl-context-dependent` — técnico crítico para Web App centralizado.
- `auto-consulta-catedral` — consultar canon vigente con Grep+Read antes de escribir/decidir. ESTA es la que YO violé en sesión 6.
- `tool-blindness-antipatron-operativo` — checklist pre-acción operacional.
- `properties-registry-json-schema` — técnico.

### 2.3 Skills instaladas (invocables ahora desde el listado activo)

- `cognitivo:sistema-dinamico` — 9 agentes coordinados que fuerzan comprensión real antes de resolver. **CRÍTICA para este pivote** — exactamente para NO repetir el moco sesión 6 de saltar a solución sin entender.
- `arcanomedia:abogado-del-diablo` — audit adversarial de propuestas. Aplica al ADR principal antes de aceptarse.
- `cognitivo:motor-recursivo` — dialéctica vertical intra-tema. Aplica si una decisión arquitectónica requiere profundización.
- `simplify` — herramienta más chica que resuelve el problema. Aplica POST-implementación.
- `bitacora:cargar-contexto` — al inicio de sesión nueva. Carga estado relacional.
- `bitacora:artefacto-transferencia` — al cierre. 4 dimensiones + actualización mapa.
- `anthropic-skills:consolidate-memory` — reflective pass: merge duplicados + fix stale facts + prune index. Aplicar al cierre de sesión.

### 2.4 Reportes de agentes ya escritos en disco (sesión 5 dejó preparados, sesión 6 ignoró por elegir Camino B)

- `catedral/reportes-agentes/2026-05-01-frameworks-pre-diseno-anti-sobreingenieria.md` — 11 frameworks + 5 preguntas Nivel 1 + 3 costumbres canonizables (5 preguntas / ADR mínimo / pre-mortem 5 min).
- `catedral/reportes-agentes/2026-05-01-compilacion-skills-existentes-meta-problema.md` — tabla 20 skills + qué gaps requieren custom.
- `catedral/reportes-agentes/2026-05-01-destilacion-preguntas-nivel-1-desde-DAI.md` — destilación específica DAI (NO leído todavía por sesión 6, leer antes de avanzar).
- `catedral/reportes-agentes/2026-05-01-auditor-externo-alzheimer-post-cierre.md` — auditoría externa cierre.

### 2.5 Skills externas mencionadas en compilación que NO tenemos pero podrían aplicar

- `prompt-improver` (severity1) — gate de claridad pre-ejecución. Recomendado A INSTALAR.
- `find-skills` (vercel-labs) — meta-skill que resuelve cargas on-demand. A EVALUAR.
- `Systematic Debugging` (obra/superpowers) — Nivel 2. A EVALUAR.

NO instalar nada de esto en esta sesión. Cluster v2 cuando estabilicemos el pivote.

## 3. Las 5 preguntas Nivel 1 aplicadas al pivote (sin responder — para responder con Fito en próximo turno)

(Sintetizadas en `frameworks-pre-diseno-anti-sobreingenieria.md` sección 2 — JTBD + C4 + Lean UX + Pre-mortem + OST.)

### Pregunta 1 — ¿Cuál es el job real del usuario?

**Job de Nely (directora rural):** ordenar el caos del Word compartido sin que las maestras tengan que aprender nada nuevo. Ya documentado en `01-problema.md`.

**Job nuevo en modelo centralizado que NO estaba en modelo distribuido:** instalar el sistema sola desde celular sin asistencia técnica.

### Pregunta 2 — ¿Quién es el usuario y en qué contexto opera?

**Nely:** Gmail común, celular, internet intermitente, no técnica, con suerte una PC prestada UNA vez. Ya documentado.

**Nuevo actor en modelo centralizado:** Fito como operador del Web App único. Maintains uptime de la plataforma para 956+ escuelas. Necesita pensar en operación a escala.

### Pregunta 3 — ¿Qué hipótesis estamos testeando y cómo sabremos que falla?

**Hipótesis principal del pivote:** una directora rural sola desde su celular puede instalar DAI en menos de 30 minutos sin asistencia técnica usando el flow centralizado (proyectodai.com → loguear Google → copiar Sheet template → completar datos → obtener URL del panel → pegar en WhatsApp).

**Cómo sabremos que falla:** R9.B realista — Fito como Nely desde adolfoprunotto@gmail.com, mobile, sin abrir Apps Script editor, sin asistencia. Si Fito tarda más de 30 minutos o se traba, falla.

**Hipótesis secundaria del pivote:** los Forms operativos creados por el Web App centralizado en el Drive de cada escuela funcionan sin necesidad de triggers locales (procesamiento on-demand desde el panel admin) o reemplazados por HTML forms en el Web App. Decisión arquitectónica pendiente.

### Pregunta 4 — ¿Por qué este deliverable y no otro? ¿Qué alternativas existen?

(Para responder en el ADR principal — sección 5.)

Alternativas conocidas a "modelo centralizado":
- A. Mantener distribuido + Módulo 0 video bien hecho + asistencia distribuida (algún familiar, vecino, cyber). Asume que la directora va a conseguir ayuda técnica una vez.
- B. Distribuido + Apps Script Library verificada por Google (puerta abierta D1). Tradeoffs ya investigados en sesión 6 (HEAD para test no producción, scope changes disparan re-consent, sharing limit 100, no blessed para 1k+ tenants).
- C. Editor Add-on Marketplace. Migración arquitectónica grande. Requiere instalación per-user, no es URL pública abrible desde WhatsApp.
- D. Modelo centralizado (decisión Fito 2026-05-02). Lo que estamos diseñando.

### Pregunta 5 — ¿Qué tendría que pasar para que esto fracase?

(Para responder en el pre-mortem — sección 6.)

Razones plausibles que ya intuimos:
- El bootstrap remoto via openById como user accessing falla por permisos en algún caso edge.
- Los Forms operativos creados via FormApp en Drive ajeno tienen scope OAuth que los rompe.
- Las quotas Apps Script del Web App centralizado se rompen a 956+ escuelas concurrentes.
- Fito desaparece, nadie hace handoff técnico, escuelas quedan rotas.
- El warning "no verificada" de Google se vuelve fricción crítica al primer encuentro mobile.
- Algún paso del flow Nely (logueo Google, copiar Sheet, sacar sheetId, pegar URL) se traba en mobile real.

Listar al menos 5-7 más en el pre-mortem.

## 4. Lo que tenemos hoy que sirve (re-contextualizado)

| Pieza V24 actual | Aplica al modelo centralizado | Ajuste necesario |
|---|---|---|
| Modelo C `_resolveAuthByEmail` | SÍ | Aceptar `sheetId` opcional → openById si presente, TemplateResolver si no (uso interno operador). |
| `PanelDocentes.html` | SÍ | Recibir `sheetId` param para mostrar info correcta de la escuela. |
| `PanelDirectora.html` | SÍ | Recibir `sheetId`. **Extender con secciones nuevas** para que Nely no necesite abrir el Sheet: configuración escuela, secciones, espacios curriculares, activación de forms. |
| Handlers `submitOperativoFromPanel` + `submitSumarFromPanel` | SÍ | Aceptar `sheetId` argument propagado desde cliente JS. |
| `_readEquipoDocente` + `_findEquipoDocenteByEmail` + `getEquipoDocenteForPanel` | SÍ | Aceptar `sheetId` argument. |
| `OnSubmitDispatcher` + handlers operativos `handleSumarDocente` + `_changeDocenteEstado` + `handleAuthCheck` | DEPENDE | Decisión arquitectónica pendiente sobre Forms (ver sección 5). |
| `DocGenerator` + 9 templates Docs | DEPENDE | Idem. |
| `bootstrapTemplate` + `setupAll` | RECONTEXTUALIZAR | Se ejecutan AHORA via Web App centralizado como user accessing sobre Sheet de la escuela en su primera visita. NO local. |
| `TuPanelTabBuilder` + `MISHEETID()` | SÍ | Construir URLs admin + panel docentes con `&sheetId=` dinámico. La pestaña Sheet ya no se llama "🚀 Tu Panel" sino "📱 Cómo entrar" post-chunk G sesión 5. |
| `appsscript.json` manifest scopes | SÍ | Sin cambios — ya tiene `spreadsheets`, `drive`, `forms`, `userinfo.email`. |
| Sheet template estructura (8 pestañas + spec) | SÍ | Pero SIN script bound. Solo planilla con pestañas + validaciones + protecciones. |

**Total piezas reusables:** ~80% del backend modelo C. ~70% del frontend PanelDirectora. PanelDocentes casi completo. Sheet template estructura entera.

**Lo que se elimina:** todo el flow "menú custom Generar todo desde compu" del Sheet copiado. El script bound al Sheet template desaparece — la copia es solo datos.

**Lo que se agrega:** lógica server-side del Web App centralizado para servir múltiples escuelas via `sheetId`, bootstrap remoto first-time, panel admin extendido para que Nely no abra el Sheet.

## 5. ADR principal pendiente — Forms operativos en modelo centralizado

(Aplicación de costumbre `ADR mínimo Forja` del reporte 2026-05-01.)

**Status:** propuesta — para discutir y decidir con Fito.

**Contexto:**
En modelo centralizado, los 11 Forms operativos viven en el Drive de cada escuela (creados por bootstrap remoto). Pero los triggers que procesan sus submits NO se pueden instalar cross-script (cazada del primer agente sesión 6 confirmada con docs oficiales: triggers cross-tenant no existen en Apps Script). Hay 2 opciones operativas para resolver esto, cada una con tradeoffs.

**Decisión:** PENDIENTE.

**Alternativas:**

**Opción A — Reemplazar Google Forms nativos por HTML forms servidos desde Web App centralizado.**
- La docente toca un form en panel docentes → se abre HTML form en el Web App de Fito → submit dispara `google.script.run.submitX(args, sheetId)` → el Web App procesa con scope del usuario (la docente logueada) → escribe directo al Sheet de la escuela via openById.
- Pro: arquitectura limpia, NO depende de triggers cross-Sheet. Updates instantáneos del UX (cambio el HTML, todas las escuelas tienen UX nueva).
- Contra: pierde UX familiar de Google Forms (offline parcial, save progress, autocomplete). Requiere re-implementar 11 forms en HTML. Si la docente no tiene señal en el momento del submit, pierde lo escrito.

**Opción B — Forms nativos sin trigger + procesamiento on-demand desde panel admin.**
- bootstrap remoto crea Forms nativos en Drive de la escuela (FormApp.create + setDestination al Sheet de la escuela).
- Submits quedan acumulados en Sheet de respuestas SIN procesar.
- Cuando Nely abre panel admin, el panel detecta "tienes 5 respuestas pendientes" y ofrece botón "Procesar todas".
- Click → `google.script.run.processarPendientes(sheetId)` → web app del operador procesa con scope user accessing → invoca handlers + DocGenerator.
- Pro: mantiene UX familiar de Forms nativos para docentes. Offline funciona, save progress funciona.
- Contra: tiempo real perdido (la docente no ve doc generado al instante). UX confusa si Nely no entra al panel por días. Si falla el procesamiento on-demand, datos quedan limbo.

**Consecuencias (a completar post-decisión):**
- Si A: re-implementar 11 forms en HTML + dropear FormApp.create del bootstrap. Aprox -80 LOC + nuevos +400 LOC HTML.
- Si B: bootstrap mantiene FormApp.create + nuevo handler `processarPendientes` + nuevo botón panel admin. Aprox +150 LOC.

**Recomendación honesta sin asumir decisión Fito:** en términos puros de simplicidad arquitectónica, Opción A. En términos de UX para docente que ya conoce Google Forms, Opción B. Decisión depende del peso relativo Fito.

## 6. Pre-mortem 5 minutos

(Aplicación de costumbre `Pre-mortem 5 minutos` del reporte 2026-05-01. Listar al menos 5-7 razones.)

Imaginá que el pivote a centralizado fracasó. Por qué:

1. **Bootstrap remoto via openById falla por permisos cross-account en algún caso edge** que no testeamos en R9.B. La docente Nely entra a la URL DAI con su sheetId, el Web App intenta openById sobre su Sheet, falla con "permission denied" → arquitectura entera no funciona. Mitigación: chunk 22.1 test empírico de openById cross-Sheet ANTES de codear backend (pero ahora con el contexto correcto: NO modelo X SaaS, sino bootstrap remoto centralizado).

2. **FormApp.create en Drive ajeno via user accessing falla** o crea forms con permisos raros que rompen el flow. Mitigación: test empírico durante chunk de bootstrap remoto.

3. **Quotas Apps Script del Web App centralizado** se rompen al escalar a cientos de escuelas concurrentes. Apps Script tiene quotas per-user pero también per-script/deployment para algunos servicios. Mitigación: research empírico de quotas + diseño defensive contra rate limits + plan de degradación graceful si llega el límite.

4. **Fito desaparece o pierde interés** sin handoff técnico. Las 956 escuelas dependientes quedan rotas. Mitigación: docs operativas claras + co-mantenedor desde el principio + testamento técnico en GitHub README + dominio proyectodai.com con DNS recoverable.

5. **Warning "no verificada" sigue siendo fricción crítica al primer encuentro mobile.** La directora rural ve el warning amarillo y abandona. Mitigación: tramitar Google OAuth verification UNA VEZ para el Web App único (cubre todas las escuelas porque todas usan tu URL). Es la primera vez que vale la pena el trámite porque hay un único deployment para verificar, no 956.

6. **Algún paso del flow Nely se traba en mobile real.** Logueo Google OK, copiar Sheet OK, completar pestañas OK, pero "extraer sheetId de la URL del Sheet" es paso técnico que puede confundir. Mitigación: el Web App debe AUTOMATIZAR ese paso — la página post-copy detecta el Sheet de la directora (via OAuth) y le da el link armado, sin que ella tenga que copy-paste sheetId manualmente.

7. **Decisión Forms HTML vs nativos sale mal.** Si elegimos B (procesamiento on-demand) y Nely no entra al panel por una semana, las docentes están enviando forms cuyas respuestas no se procesan. Cuando Nely abre, ve 80 respuestas pendientes, abrumador. Mitigación: notificación + procesamiento automático nocturno via trigger time-based en el Web App centralizado (se puede instalar trigger time-based en TU script porque ahí sí sos owner).

8. **Privacidad cross-escuela mal manejada.** El Web App tuyo accede a Sheets de 956 escuelas. Si hay un bug que cruza datos entre escuelas, escándalo. Mitigación: testing exhaustivo del filtrado por sheetId + audit log + nunca cachear datos de escuela en Properties globales.

9. **Modo "Execute as: User accessing" falla en cuenta institucional comunitaria** porque las 2-3 personas con el password del mail comunitario no se identifican individualmente — todas se loguean como el mail comunitario. Modelo C que valida `Session.getActiveUser` contra `👥 Docentes` siembra el mail comunitario directamente. Eso ya debería estar resuelto en sesión 5 con Modelo B + Cazada I "todas pares". Confirmar en R9.B.

## 7. Mapeo del flow Nely en modelo centralizado paso por paso (ideal post-pivote)

(Aplicación de `vocabulario-anclado-al-contexto` — Nely no developer, criollo.)

### Setup inicial (una vez por escuela, mobile-first 100%)

1. Una directora amiga le manda a Nely por WhatsApp el link a `proyectodai.com`. Nely lo abre en celular.
2. Página simple, cálida, en castellano. Botón "Empezá tu sistema".
3. Tap → le pide loguear con Google. Loguea como `nelyperalta@gmail.com` (cuenta personal o cuenta comunitaria de la escuela).
4. La página le explica en 2 frases qué va a pasar: "vamos a copiarte un Sheet a tu Drive y armarte el sistema. Tarda 1 minuto. Tap el botón verde."
5. Tap "Empezar" → el Web App tuyo invoca el flow de copy del Sheet template (probable usando Drive API copy file via user accessing) + bootstrap remoto sobre la copia.
6. Spinner ~30s con mensaje "armando tu sistema" + barra de progreso.
7. Cuando termina, página verde "Listo, tu sistema ya está armado". Le da DOS links:
   - "Link para tu equipo de docentes" (panel docentes con sheetId de su escuela). Botón "Copiar y compartir por WhatsApp".
   - "Link para tu panel admin" (panel directora con sheetId de su escuela). Botón "Guardar en favoritos".
8. Tap "Copiar y compartir" → se abre el share sheet del celular → elige WhatsApp → grupo de docentes → pega y manda con un mensaje pre-armado tipo "chicas, este es el sistema nuevo, tóquenlo cada día para los formularios".
9. Tap "Guardar en favoritos" → ella lo guarda en marcadores del browser.

Listo. Tiempo total: 5-10 minutos. CERO pasos técnicos. CERO Apps Script editor. CERO sheetId manual.

### Configuración de datos de la escuela

10. Nely abre el link admin que guardó en favoritos. Se le abre el panel directora (lo que ya tenemos pero EXTENDIDO).
11. La primera vez ve un wizard "completemos los datos de tu escuela": nombre, año, dirección, email institucional, docentes (apellido + nombre + email + cargo), secciones (1°/2° / 3°/4° / etc), espacios curriculares (defaults PCI Córdoba editables).
12. Cada paso del wizard se guarda en el Sheet de la escuela via `google.script.run`. Nely NO ve el Sheet — todo desde el panel.
13. Cuando termina el wizard, ve el panel directora completo: resumen "Mi equipo hoy", sección Equipo Docente, sección "Mis respuestas por carpeta", recordatorios, etc.

### Uso continuo día a día

14. Maru (docente) abre WhatsApp, ve el link en el grupo, lo toca. Se abre el panel docentes con los 11 forms ordenados por fase. Toca "Registro de clase" → abre el Form correspondiente en el browser → llena → submit → respuesta queda en el Sheet de la escuela.
15. Día siguiente Nely abre el panel admin desde su celular. Ve respuestas nuevas (con badge tipo "5 nuevas"). Toca → ve la lista. Si hay docs generados (PIE, actas, etc.) los ve linkeados a Drive.

### Editar después de la configuración inicial

16. Nely necesita sumar a una docente nueva (Carmen). Abre panel admin → sección Equipo Docente → botón "+ Sumar nueva docente" → modal con campos (apellido, nombre, email, tipo) → confirmar → handler centralizado escribe en `👥 Docentes` de su Sheet via sheetId → refreshDocentes regenera dropdowns en los Forms de su Drive → Nely recibe link para mandar a Carmen.
17. Idem para marcar licencia, volvió, baja. Idem para editar secciones, espacios, activar/desactivar forms. Todo desde el panel admin extendido.

### Lo que Nely NO toca, NO ve, NO sabe

- Apps Script editor.
- Concept de "deploy".
- Concept de "Web App".
- Concept de "trigger".
- Que existen otras 955 escuelas en el sistema.
- Que vos sos el operador que mantiene la plataforma.
- El sheetId. La URL ya viene armada con su sheetId pegado.

## 8. Cazadas conocidas que aplican (de sesiones anteriores + sesión 6)

- **Cazada H "ni la directora es SPOF":** se mantiene en modelo centralizado. La cuenta institucional de la escuela puede ser compartida 2-3 personas. Cualquiera puede entrar al panel admin con su mail si está sembrada en `👥 Docentes` Activa.
- **Cazada I "todas son pares":** se mantiene. Modelo C centralizado valida email contra `👥 Docentes` Activa de la escuela target. NO hay rol "directora" privilegiado.
- **Cazada modelo B "mail comunitario tipo banco":** se mantiene. La copia del template puede hacerse desde la cuenta institucional de la escuela.
- **Cazada gaslighting de IA:** aplica al pivote. NO minimizar la complejidad real del backend distribuido. Si emerge SPOF nuevo en mapeo del plomero, documentarlo honesto.
- **Cazada tool-blindness por memoria cruzada:** aplica antes de inventar nada — verificar empírico contra docs oficiales actualizados.
- **Cazada decisiones-tecnicas-atribuidas-falsamente-a-Fito:** aplica especialmente al ADR principal. NO citar "decisión Fito" técnica sin que Fito haya validado explícito.
- **Cazada Alzheimer post-cierre:** aplica. NO firmar cierre del pivote sin que Fito declare cierre. Si chunks salen exitosos, NO generar firma "Pivote cerrado" + emoji + tabla métricas.

## 9. Próximos pasos (post-discusión con Fito)

NO ejecutar. Esto es para que Fito decida orden + ritmo.

1. **Discutir las 5 preguntas Nivel 1 (sección 3) con Fito y registrar respuestas a disco.** Especialmente respuestas a Pregunta 4 (alternativas que se descartan) y Pregunta 5 (pre-mortem completo).
2. **Decidir el ADR principal (sección 5) — Forms HTML vs Forms nativos.** Decisión arquitectónica grande, define mucho del scope.
3. **Aplicar `arcanomedia:abogado-del-diablo`** sobre este doc base como audit adversarial. Para cazar lo que NO vimos.
4. **Aplicar `cognitivo:sistema-dinamico`** si el pivote requiere comprensión más profunda antes de mapear plomero (lo que NO hicimos en sesión 6 y por lo cual moco).
5. **Leer reportes de agentes pendientes** (`destilacion-preguntas-nivel-1-desde-DAI.md` + `auditor-externo-alzheimer-post-cierre.md`) para completar el cuadro.
6. **Después de eso recién**: mapeo del plomero del backend centralizado + research empírico bloqueante (openById cross-Sheet con bootstrap remoto + FormApp.create cross-account si vamos opción B + quotas Apps Script a escala) + chunks de implementación.

## 10. Cierre

Este doc es input de discusión, NO ejecución. Aplica `briefing-autocontenido-sesion-paralela` para que cualquier sesión pueda retomar. Aplica `auto-consulta-catedral` rescatando los reportes de sesión 5 + costumbres del INDEX. Aplica `consejo-universal-vs-decision-contextual` adaptando los 11 frameworks externos al contexto Fito real, no importando recetas literales.

NO hay decisiones tomadas en este doc más allá del pivote a centralizado (que Fito ya confirmó con datos empíricos). El ADR principal queda abierto. Las 5 preguntas Nivel 1 están planteadas pero sin responder más allá de lo obvio. El mapeo del plomero técnico NO está hecho — se hace después de que Fito decida ADR + responda preguntas Nivel 1.

Próximo turno de Fito decide qué de los 6 puntos de "próximos pasos" arrancamos primero o si quiere ajustar el doc antes.
