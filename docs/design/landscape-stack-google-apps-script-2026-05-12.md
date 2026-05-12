---
fecha: 2026-05-12
estado: vivo (re-correr en eventos macro o cada 3-4 meses)
proyectos: DAI + Carpetas Viaje Res 59 (research cross-proyecto)
tipo: landscape research del stack
proposito: validar empíricamente supuestos arquitectónicos antes de arrancar Carpetas Viaje + persistir info útil para DAI plan v9+
fuente: agente general-purpose Forja Claude Code, 5 búsquedas paralelas WebFetch + WebSearch
duracion_research: ~93 segundos / 12 tool uses
cutoff_base: enero 2026
ventana_validada: enero 2026 — 12 mayo 2026
mutable: sí — revisar y reescribir cuando aparezca evento macro (release relevante, cambio normativo, etc.)
---

# Landscape — Stack Google Apps Script + Drive + Forms + Sheets + Gmail (mayo 2026)

## 1. Contexto del research

Forja Claude Code está por arrancar el diseño de **Carpetas Viaje Res 59** — sistema genérico para que escuelas anfitrionas organicen carpetas de viaje de escuelas visitantes según la Resolución Ministerial 59/2026 (Córdoba). Caso de uso primero: AMIJUGANDO 2026, sede Bartolomé Mitre.

El proyecto hermano **DAI plan v9** quedó commiteado el 28-abril-2026. Su arquitectura tomó dos decisiones críticas que dependen del estado del stack:

- Descartó `deployWebApps()` programmatic ("API no usable as of April 2026"). Por eso el flujo de onboarding de cada escuela DAI tiene **un paso manual de deploy del Web App** en `Extensiones → Apps Script → Deploy`.
- Descartó `FormApp.addFileUploadItem()` ("no existe en Apps Script"). Por eso los campos de archivo en los 11 Forms DAI se renderean como texto con helpText "mandar por WhatsApp".

Si Google sacó cualquiera de las dos features entre fines de abril y hoy 12-may-2026, **cambia la arquitectura** de Carpetas Viaje y abre upgrade para DAI plan v10. Las otras 3 búsquedas (cuotas Gmail, Drive personal, Res 59 + sistema 2027 Ministerio) bajan riesgo de partir con supuestos podridos.

## 2. Los 5 hallazgos

### Hallazgo 1 — Deploy Web App programático

- **Estado:** SIN INFO NUEVA — estado abril 2026 = sigue igual.
- **Fuente:** [Apps Script release notes](https://developers.google.com/apps-script/release-notes) (sin entries enero-mayo 2026 sobre deploy) + [`projects.deployments.create` REST API reference](https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments/create).
- **Detalle:** La REST API externa `projects.deployments.create` ya existía en abril 2026, **pero requiere GCP project + OAuth con scope `script.deployments` + script-id externo**. Para cuenta Gmail personal sin GCP configurado eso es fricción alta — no es plug-and-play. Por dentro de Apps Script no hay `ScriptApp.deployWebApp()` ni equivalente. Updates 2026 documentados en release notes: Vertex AI advanced service, Forms `setPublished`, Rhino deprecation EOL 31-ene-2026, Maps `setAuthentication` deprecated sunset jun-2026.
- **Implicancia Carpetas Viaje:** mantener deploy manual del Web App vía editor Apps Script. Owner `dev.bmlacumbrecita@gmail.com` ejecuta `Deploy → New deployment` una vez al arrancar el sistema. NO automatizar deploy desde código.
- **Implicancia DAI plan v9:** cero cambios. Decisión "API no usable" sigue vigente. Tu Panel tab + paso manual de deploy guiado en `/ayuda` se mantiene.
- **Confianza:** ALTA.

### Hallazgo 2 — `FormApp.addFileUploadItem()`

- **Estado:** NO EXISTE.
- **Fuente:** [Form class reference](https://developers.google.com/apps-script/reference/forms/form) — fetched directo 12-may-2026.
- **Detalle:** La lista exhaustiva de `addXxxItem()` del Form class al 12-may-2026 NO incluye `addFileUploadItem`. Métodos disponibles: Checkbox, CheckboxGrid, Date, DateTime, Duration, Grid, Image, List, MultipleChoice, PageBreak, ParagraphText, Rating, Scale, SectionHeader, Text, Time, Video. File upload item solo se crea a mano en la UI del Form. Limitación adicional conocida no resuelta: file upload UI items no funcionan si el form vive en Shared Drive — y Shared Drives no existen en cuenta personal de todos modos.
- **Implicancia Carpetas Viaje:** si el Form de inscripción necesita upload nativo, owner crea el item manualmente en UI. NO se puede generar por código. Alternativa robusta: Web App con HTML form + `DriveApp.createFile()` server-side, igual que DAI.
- **Implicancia DAI plan v9:** cero cambios. Workaround "campos archivo → texto con helpText" sigue vigente.
- **Confianza:** ALTA — reference oficial, lista exhaustiva.

### Hallazgo 3 — Cuotas Gmail / MailApp

- **Estado:** EXISTE (sin cambios).
- **Fuente:** [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) — last updated 2026-04-20.
- **Detalle:** Consumer (Gmail personal gratuita) = **100 recipients/día**. Google Workspace = 1500/día general, 2000/día intra-domain. La cuota es por **recipients** no por mails (un mail a 10 destinatarios cuenta 10). Sigue disponible `MailApp.getRemainingDailyQuota()`. `GmailApp.createDraft()` sin cambios documentados y los drafts **no consumen** cuota de send hasta que se envían manualmente.
- **Implicancia Carpetas Viaje:** owner `dev.bmlacumbrecita@gmail.com` = cuenta personal → 100/día hard cap. Para AMIJUGANDO 2026 con ~5 escuelas visitantes × (bienvenida + 3 recordatorios + completa + confirmación elevación) ≈ 25-35 recipients en total durante el ciclo del evento. **Dentro del cupo.** La elevación a inspección por `createDraft` no consume cuota — la envía Nely manualmente desde Gmail.
- **Implicancia DAI plan v9:** cero cambios. Pattern `createDraft` ya está aprovechado en el flujo F09 Comunicado (registro en Sheet, no envío programático).
- **Confianza:** ALTA — docs oficiales con timestamp 2026-04-20.

### Hallazgo 4 — Drive cuenta personal

- **Estado:** Shared Drives NO EXISTE en personal Gmail / 15GB storage sin cambios.
- **Fuente:** [Google One](https://one.google.com/about/) + [Drive storage help](https://support.google.com/drive/answer/9312312).
- **Detalle:** Cuenta Gmail personal = **15GB compartidos** entre Drive + Gmail + Photos. Shared Drives siguen siendo feature Workspace, no migró a personal. No hay cambios documentados en flujo OAuth Consent Screen "app no verificada" en la ventana. Upgrade storage vía Google One ($1.99/mes 100GB).
- **Implicancia Carpetas Viaje:** NO usar Shared Drives. Todo bajo My Drive de `dev.bmlacumbrecita@gmail.com` con permisos por carpeta. **Cuidar 15GB cap** — fotos + PDFs de viaje suman rápido (5 escuelas × ~30 archivos × promedio 2MB = ~300MB por evento, multiplicado por 5 eventos/año = ~1.5GB anuales, sostenible). OAuth consent screen "app no verificada" sigue como warning — diseñar UX onboarding que advierta a usuarias.
- **Implicancia DAI plan v9:** cero cambios. Modelo "cada escuela dueña 100% de su copia" en su propio My Drive sigue siendo el path. Nota de prueba social entre directoras sigue siendo la mitigación del warning OAuth.
- **Confianza:** ALTA.

### Hallazgo 5 — Res 59/2026 + sistema oficial 2027 Ministerio Córdoba

- **Estado:** SIN INFO en hubs web.
- **Fuente:** [TransFORMAR@Cba resoluciones 2026](https://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SIDPyTE/TransFORMARCba/resoluciones.php?anio=2026) (lista 82-88 y 337/2025 para 2026, sin entries 29-abr a 12-may) + [Boletín Oficial Córdoba](https://boletinoficial.cba.gov.ar/) (sin matches específicos en la ventana).
- **Detalle:** Ni TransFORMAR ni el Boletín Oficial indexan novedades sobre Res 59/2026 o el sistema único 2027 en la ventana de 14 días. NO aparecen reglamentaciones complementarias publicadas. **La ausencia en hubs web no prueba ausencia real** — podría haber circulación interna en papel o canales no indexados.
- **Implicancia Carpetas Viaje:** asumir Res 59/2026 vigente sin modificaciones. Sistema único 2027 sigue siendo intención declarada sin cronograma confirmado. Diseñar con **horizonte realista variable**: el sistema vive hasta que el oficial llegue (podría ser nunca, podría ser 2027, podría ser 2028+).
- **Implicancia DAI plan v9:** cero cambios. DAI no depende de Res 59 (es para gestión interna escolar, no para salidas educativas).
- **Confianza:** BAJA por límite de indexación web, NO por evidencia de cambio.
- **Acción humana pendiente:** verificar directo con Min Educación Córdoba / Supervisora regional Reynoso / mesa de entradas Boletín Oficial.

## 3. Bonus encontrado por el agente

Updates en release notes 2026 que no afectan hoy pero quedan en el radar:

- **Rhino deprecation EOL 31-ene-2026.** V8 sí o sí. DAI ya está V8 (manifest declara `"runtimeVersion": "V8"`). Carpetas Viaje también.
- **Maps `setAuthentication` deprecated sunset junio 2026.** No afecta porque ni DAI ni Carpetas Viaje usan Maps Service.
- **Vertex AI advanced service.** No aplicable hoy. Quedaría en radar si DAI v2 quisiera integrar inferencia IA (e.g. clasificación auto de respuestas Forms, generación de borradores PIE, etc.).
- **Forms `setPublished` nuevo.** Permite togglear publicación de un Form desde código sin abrir UI. **Posible mejora futura** para DAI (publicar/despublicar forms por temporada lectiva) y para Carpetas Viaje (publicar el Form de inscripción al arrancar el evento, despublicar después del deadline).

## 4. Veredicto global

**Ninguno de los 5 cambia la arquitectura.** Los dos hinges potenciales (Hallazgos 1 y 2) siguen exactamente como en abril 2026 cuando se commiteó DAI plan v9. La decisión "API no usable" del plan v9 sigue siendo correcta.

**Se puede descartar como "no afecta hoy":** Hallazgos 3 y 4 — confirmados sin cambios, solo recordar las constraints conocidas al diseñar (100 recipients/día, 15GB Drive personal).

**Único punto abierto:** Hallazgo 5 — confianza BAJA por límite de indexación web. Requiere verificación humana antes del kickoff del proyecto Carpetas Viaje.

**Recomendación operativa:** proceder con arquitectura base idéntica a DAI (Web App + HTML form + `DriveApp` server-side + Gmail drafts + My Drive del owner), y delegar a Fito / Daiana **1 consulta a Min Educación Córdoba** para cerrar Hallazgo 5 antes de commitear el plan técnico v2.

## 5. Implicancia consolidada para DAI plan v9+

Cazada Fito 2026-05-12: "que la info útil quede para proyecto DAI también, no solo Carpetas Viaje".

Hallazgos que afectan DAI:

- **Hallazgo 1 + 2 (deploy programmatic + file upload):** sin cambios. Las decisiones del plan v9 siguen vigentes. **NO levantar deudas técnicas D5-D10 sobre estos puntos.**
- **Hallazgo 3 (cuotas Gmail):** sin cambios. Útil tenerlo persistido como referencia operativa para cualquier feature futura de DAI que mande mails (e.g. F09 Comunicado si se decide reactivar envío automático en v2).
- **Hallazgo 4 (Drive personal):** sin cambios. **Confirma el modelo de distribución DAI** "cada escuela dueña 100% de su copia en su Drive personal" como técnicamente válido al 12-may-2026.
- **Hallazgo 5 (Res 59/2026):** no afecta DAI directamente, pero el sistema oficial 2027 del Ministerio podría eventualmente cubrir solapamiento con DAI si extiende alcance fuera de salidas educativas. Vale anotar como hilo abierto para DAI también.

**Posibles mejoras DAI plan v10+ que el bonus habilita:**

- **Forms `setPublished`** — útil para activar/desactivar forms por temporada lectiva en DAI. Hoy DAI deja todos los forms publicados todo el año. Si surge demanda de "cerrar planificación al final del cuatrimestre", `setPublished(false)` resuelve sin tocar lógica de panel.
- **Vertex AI advanced service** — radar para v2 si emerge necesidad de IA (clasificación de respuestas, generación de borradores PIE, etc.). No aplicable hoy.

## 6. Hilo abierto — Hallazgo 5 → consulta humana

Pregunta a llevar al Ministerio / supervisora / Boletín Oficial:

> "¿Hay reglamentaciones complementarias o aclaratorias publicadas a la Res 59/2026 (Córdoba) entre 29 de abril y la fecha de consulta? ¿Hay cronograma firme del sistema informático único anunciado para el ciclo 2027?"

**Candidatos para llevar la consulta:**

- **Daiana en JI Bartolomé Mitre 12-mayo-2026.** Sumar como duda #11 al doc `Jornada-12mayo-01-Notas-Res-59-2026.md` (que ya tiene 10 dudas listadas).
- **Nely directo a Lic. María Reynoso** (Supervisora Zona 5410, Calamuchita Norte). Mail `zona5410calamuhita@yahoo.com.ar`.
- **Mesa de entradas Boletín Oficial** Provincia de Córdoba (último recurso si los anteriores no responden).

**Bloqueante:** NO para diseño base de Carpetas Viaje. SÍ para confirmar horizonte 12-18 meses vs vida útil más corta o más larga.

## 7. Próxima revisión

Re-correr este landscape cuando:

- Anuncio público del Ministerio sobre el sistema único 2027 (incluyendo specs técnicos).
- Release notes Apps Script con methods nuevos relevantes (`ScriptApp.deployWebApp()`, `FormApp.addFileUploadItem()`, lo que aparezca).
- Cambios en cuotas Gmail / Drive personal.
- Hito macro de Carpetas Viaje (post-piloto AMIJUGANDO 2026, ramp a múltiples escuelas, etc.) o DAI (Fase 4 piloto, publicación landing).
- Default temporal: cada 3-4 meses si no hubo evento macro.

---

*Forja Claude Code — proyecto-dai worktree claude/jovial-aryabhata-2cf2b9 — 2026-05-12 02:04.*
