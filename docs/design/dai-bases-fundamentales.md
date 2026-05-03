---
doc: proyecto-dai/docs/design/dai-bases-fundamentales
estado: vivo — bases del proyecto
fecha_origen: 2026-05-02
origen: cierre del moco estructural sesión 6 FORJA DAI siguiente. Sesión 6 diseñó 5 horas de chunks distribuidos cross-Sheet contra non-goal explícito del proyecto por NO haber leído los docs originales antes de diseñar. Fito pidió documentar las bases para que próximas sesiones no repitan el error.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: doc de bases fundamentales del proyecto DAI. Lectura obligatoria al arrancar cualquier sesión DAI ANTES de tocar código o diseñar nada. Resume el qué quiere Fito + qué necesitan las escuelas + el flow real del producto + los non-goals explícitos. Si una sesión va a contradecir algo de este doc, frenar y consultar con Fito.
mutable: sí (Fito puede ajustar bases con el tiempo)
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# DAI — Bases fundamentales del proyecto

> **Lectura obligatoria al arrancar sesión DAI**, antes de tocar código o diseñar nada. Las bases acá NO se re-discuten en cada sesión: están confirmadas por Fito 2026-05-02 al cierre del moco estructural sesión 6.
>
> Si una sesión propone algo que contradice este doc, FRENAR y consultar con Fito antes de avanzar. NO inventar arquitecturas alternativas (modelo X SaaS, multi-tenant centralizado, web app único del operador con sheetId param, library propagada con HEAD, etc.) — todas esas son violaciones directas a las bases.

## 1. Qué quiere Fito

Hacer un sistema gratuito para que las escuelas rurales argentinas dejen de pelear con un Word compartido que se pisa. 956+ escuelas en Córdoba, 2600+ en Argentina. Distribución masiva sin asistencia de Fito escuela por escuela porque eso no escala. Cada escuela monta el sistema sola, pidiendo PC prestada una vez si hace falta.

Open source MIT en GitHub para que si Fito se aburre, se muere o agarra el proyecto siguiente, otro pueda agarrarlo (otro programador, una ONG, el Ministerio). NO es un SaaS centralizado de Fito — es un template que cada escuela copia y queda 100% suyo. Fito es el equipo mantenedor inicial pero el proyecto está armado para sobrevivirlo.

Lenguaje cálido humano, no corporate, no techy. Foco mobile-first para uso continuo porque las docentes lo viven desde celular en el grupo de WhatsApp.

## 2. Qué necesitan las escuelas

Una directora rural (cargo combinado directora + docente titular del ciclo superior, Gmail común, celular, internet intermitente, no técnica, recibe inspección y tiene que mostrar evidencia del Proyecto Institucional Escolar). Equipo de 7-10 docentes con celular, alguno con cuenta Google, otros solo WhatsApp.

Hoy gestionan lo informal (planificaciones, actas, seguimiento, novedades) en un Word compartido en Drive que se pisa entre docentes y se pierde info. SGE oficial de Córdoba cubre solo lo formal (matrícula, calificaciones) y es cerrado sin API.

Lo que necesitan: reemplazar ese Word por formularios estructurados que las docentes rellenen desde el celular tocando un link en el grupo de WhatsApp. Que las respuestas queden ordenadas en el Drive de la escuela para que la directora las vea.

Cero Google Workspace pago. Cero programación. Cero servidor central. Cero dependencia de un equipo externo si éste desaparece.

JTBD literal del proyecto: ordenar el caos del Word compartido sin que las maestras tengan que aprender nada nuevo. Tiene que sentirse como "un Google Form con una pestaña de contactos del grupo", no como sistema de gestión educativa.

## 3. El flow real (corregido por Fito 2026-05-02)

**Setup inicial** (una vez por escuela, requiere PC prestada o propia):

1. La persona que monta (directora o cuenta institucional comunitaria) tiene UNA cuenta Google.
2. Esa persona crea una carpeta DAI en SU Drive.
3. Copia el Sheet template público a SU Drive ("Archivo → Crear una copia").
4. Completa pestañas de configuración del Sheet con los datos de SU escuela (docentes, secciones, espacios curriculares).
5. Corre el setup desde el menú custom (necesita compu por menús custom no funcionar en mobile).
6. Acepta permisos OAuth una vez (warning "app no verificada" → nota de prueba social → continuar).
7. Deploya el Web App (requiere Apps Script editor → necesita compu).
8. Comparte la carpeta DAI con los mails individuales de las docentes vía Drive sharing (igual que ya hacen con su Word actual).

**Uso continuo** (mobile-first, sin compu):

9. La directora copia la URL del panel docentes (HTML público generado por el Web App).
10. Pega esa URL en el grupo de WhatsApp de las docentes.
11. **Las docentes tocan ese link → se les abre el panel docentes (HTML público) en el browser del celular**.
12. **El panel docentes les muestra los 11 formularios ordenados por fase (pedagógica / institucional / comunicación / admin)**. NO es un link directo a un form — es la capa intermedia organizativa.
13. La docente elige qué formulario necesita rellenar en ese momento. Toca el botón del form. Se le abre el Google Form correspondiente desde el navegador del celular.
14. Rellena el form, submit. La respuesta queda en el Drive de la escuela en el Sheet de respuestas correspondiente.
15. La directora ve las respuestas organizadas en su Drive.

**Detalle crítico que sesión 6 NO había considerado bien**: el link único compartido en WhatsApp NO va a un form específico. Va al panel docentes que muestra los 11 forms ordenados. Una sola URL para todos los forms. Las docentes no necesitan recordar 11 URLs distintas — solo recuerdan la del panel.

## 4. Lo que DAI NO es (non-goals explícitos)

Tomados literal de `docs/design/02-non-goals.md`. **Cualquier sesión que viole alguno de estos puntos está fuera de scope y debe frenar inmediatamente**.

- ❌ NO multi-tenancy centralizado. Cada escuela es dueña de su copia 100%. NO hay "instancia central" ni panel admin que vea a todas las escuelas.
- ❌ NO Web App único del operador sirviendo a todas las escuelas vía sheetId param.
- ❌ NO soporte para Google Workspace pago. Target = Gmail común gratis.
- ❌ NO backend propio. Todo corre en infra Google (Drive + Apps Script).
- ❌ NO app móvil nativa. Panel HTML mobile-first + Google Forms nativo.
- ❌ NO integración con SGE ni SInIDE. DAI vive al lado, no compite.
- ❌ NO soporte para nivel secundario. Solo primaria rural.
- ❌ NO multi-idioma. Solo español argentino rioplatense.
- ❌ NO analytics ni dashboards ejecutivos.
- ❌ NO creación de forms custom desde la directora en v1.
- ❌ NO histórico con audit log de quién-cambió-qué-cuándo.
- ❌ NO envío automático de emails.
- ❌ NO alertas push (Slack/WhatsApp/SMS).
- ❌ NO verificación con Google del OAuth Consent Screen en v1. Se resuelve con nota de prueba social entre directoras.
- ❌ NO soporte estilo SaaS. NO hay ticketing ni SLA.
- ❌ NO deploy centralizado de actualizaciones. Cada escuela decide si re-copia el template cuando salga versión nueva.
- ❌ NO versionado más allá del año lectivo. Al pasar a 2027 se re-ejecuta "Generar sistema" con año nuevo.

## 5. Decisión arquitectónica D1 (de docs/design/03-arquitectura.md)

**Container-bound puro + open source MIT + puerta abierta a Library**:

- Se distribuye un Google Sheet Template público con Apps Script embebido. Cada escuela hace "Archivo → Crear una copia" → tiene su Sheet + script independiente en su Drive.
- Código en GitHub público con licencia MIT. Cualquier actor (gobierno, ONG, programador) puede forkear y empaquetar como Apps Script Library verificada (Adaptador C) sin pedir permiso.
- El equipo mantenedor NO es SPOF. Si el equipo original desaparece, las escuelas existentes siguen funcionando; alguien puede retomar el código.

## 6. Para próximas sesiones — checklist anti-error

Antes de diseñar cualquier cambio en DAI, leer en este orden y NO saltarse:

1. Este doc (`dai-bases-fundamentales.md`).
2. `README.md` raíz del proyecto.
3. `docs/design/01-problema.md` — qué resuelve DAI.
4. `docs/design/02-non-goals.md` — qué NO hace.
5. `docs/design/03-arquitectura.md` — arquitectura declarada.
6. `docs/design/04-landing-wordpress.md` — cómo se le explica DAI a la directora.
7. `docs/Sheet-Template-Design.md` — spec del Sheet.
8. `apps-script/src/Main.gs` + `apps-script/src/orchestration/SetupOrchestrator.gs` + `apps-script/src/orchestration/TemplateBootstrapper.gs` — entry points + flow real.
9. `apps-script/src/webapp/PanelDocentes.html` — panel público mobile-first que las docentes usan día a día.
10. `apps-script/src/webapp/PanelDirectora.html` — panel admin mobile-first que la directora usa.
11. `apps-script/src/webapp/WebApp.gs` — ruteo doGet + modelo C auth.
12. `checklist-pendientes.md` (en CLAUDE-CORE) — estado actual + decisiones arquitectónicas declaradas.

Si después de leer esos 12 archivos algo no cierra, PREGUNTAR a Fito antes de diseñar. NO asumir. NO inventar arquitecturas alternativas. NO importar modelos de OTROS proyectos del ecosistema (Vexion, Pulpo, Arcanomedia studio).

## 7. Aprendizaje específico del moco sesión 6 (anti-patrón a evitar)

Sesión 6 arrancó con prompt B "Camino producto DAI" que mencionaba "modelo X SaaS multi-tenant 10k escuelas decisión TOMADA desde discovery". Sesión 6 asumió esto literal sin verificar contra los docs del proyecto. Resultado: diseñó 5 horas de chunks distribuidos cross-Sheet (paso 22 distribuido + research bloqueante triggers + Library + Editor Add-on Marketplace) — todo derivado de una asunción FALSA.

`02-non-goals.md` línea 9 dice literal: "No multi-tenancy centralizado. Cada escuela es dueña de su copia 100%. No hay instancia central ni panel admin que vea a todas las escuelas". Sesión 6 violó este non-goal explícito.

**Lección aplicable a futuro**: si un prompt habla de "modelo X SaaS" o "multi-tenant" o "web app único del operador sirviendo a 10k escuelas", **NO es DAI**. Es invención de la sesión que armó el prompt. Verificar empírico con los docs originales antes de aceptar el frame.

## 8. Firma

Doc bases escrito al cierre del moco sesión 6. Aplica feedback `tool-blindness-memoria-cruzada.md` a escala mayor: NO solo verificar herramientas empíricas, también verificar QUÉ ES EL PROYECTO antes de diseñar nada. Aplica feedback `pre-condiciones-empiricas.md`: NO asumir estado del proyecto entre sesiones, leer empírico los docs originales. Aplica filosofía CLAUDE.md L9 "NO MEZCLAR PROYECTOS": las decisiones arquitectónicas de un proyecto NO se importan al otro sin verificar.

— FORJA DAI siguiente, sesión 6, cierre del moco estructural, 2026-05-02.
