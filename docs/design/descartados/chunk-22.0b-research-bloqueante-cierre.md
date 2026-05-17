---
doc: proyecto-dai/docs/design/chunk-22.0b-research-bloqueante-cierre
estado: histórico — research bloqueante pre-código cerrado
fecha_origen: 2026-05-02
origen: sesión 6 FORJA DAI siguiente, cierre chunk 22.0b. Research bloqueante pre-código sobre 2 problemas estructurales emergidos del mapeo del plomero chunk 22.0: (1) triggers cross-Sheet en arquitectura multi-tenant Apps Script + (2) propagación de updates a copias del template. 2 agentes background lanzados en paralelo, ambos con verdict convergente.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: cerrar chunk 22.0b documentando verdict de los 2 agentes + decisiones arquitectónicas tomadas (con frame de cadencia anual aclarado por Fito) + ajustes al plan de chunks 22.1..22.6 + mitigación de bug crítico mid-año + cazada estructural sobre dudas técnicas disfrazadas de decisiones.
mutable: no (snapshot del cierre)
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# Chunk 22.0b — Research bloqueante pre-código cierre

## 1. Big picture

Chunk 22.0b emergió del mapeo del plomero (chunk 22.0) que cazó 3 riesgos críticos del mismo nodo: triggers cross-Sheet en modelo X distribuido. La hipótesis sesión 6 era "convertir `onFormSubmitDispatcher` (instalable) → `onFormSubmit` (simple trigger nativo) resuelve el problema". Antes de codear, research bloqueante con agente background.

Durante el research, Fito aclaró frame fundamental no explícito hasta entonces: **cadencia anual del producto** (no continua tipo SaaS Notion). Updates rutinarios se acumulan en versión nueva del año lectivo siguiente. Re-copia de template natural por cambio de año actúa como ventana de propagación.

2 agentes background corrieron en paralelo investigando: (1) viabilidad simple triggers cross-Sheet, (2) Apps Script Library como mecanismo de propagación cross-tenant. Ambos verdicts convergen.

## 2. Verdict agente 1 — Simple triggers cross-Sheet

**Hipótesis sesión 6 ERRÓNEA**: `onFormSubmit` NO es simple trigger reservado en Google Apps Script. Solo 6 simple triggers existen: `onOpen`, `onInstall`, `onEdit`, `onSelectionChange`, `doGet`, `doPost`. Doc oficial confirmada en `developers.google.com/apps-script/guides/triggers`. Renombrar `onFormSubmitDispatcher` → `onFormSubmit` NO dispara automáticamente — requiere instalación explícita vía `ScriptApp.newTrigger`.

**Pero hay path viable — Opción B del agente**: aprovechar que `onOpen` SÍ es simple trigger reservado y SÍ se copia con el contenedor del script bound. Bootstrap configura un menú custom con botón "Activar sistema" en `onOpen` del script template. Cuando la directora abre su Sheet copiado por primera vez, ve el menú DAI. Click "Activar sistema" → ese código corre EN SU script copiado bajo SU identidad → ahí sí puede ejecutar `ScriptApp.newTrigger("onFormSubmitDispatcher").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create()` para instalar el trigger en su propio script.

Patrón documentado por Kanshi Tanaike (Apps Script Product Expert reconocido) en gist público: "Workaround: Automatically Installing OnEdit Trigger to Copied Spreadsheet". Aplica al caso onFormSubmit con la misma lógica.

**Tradeoff UX**: la directora hace UN click extra "Activar sistema" la primera vez (consent OAuth + instalación trigger). Acceptable para self-service rural (es similar al consent ya existente del Web App configurador).

**Hallazgos adicionales relevantes** (no en las 6 preguntas pero críticos):
- Triggers instalables NO se transfieren con `Make a copy`. Cada directora arranca sin trigger.
- Simple triggers NO pueden acceder a servicios con OAuth scope (`FormApp.openById`, `UrlFetchApp`, etc.). Limitados al contenedor.
- `onOpen` simple trigger SÍ permite construir menú custom + setear handler que después la directora invoca con click → ese handler ejecuta como user accessing con scopes completos autorizados via consent.

## 3. Verdict agente 2 — Apps Script Library multi-tenant

**Library técnicamente VIABLE para propagación pero con riesgos arquitectónicos altos**:

- Library con `HEAD` version propaga automáticamente. PERO Google explícitamente dice "Use head deployments to test code, but don't use head deployments for public use" — cualquier `Cmd+S` accidental rompe simultáneamente a todas las escuelas sin rollback.
- Library con versión numerada NO propaga automáticamente — cliente queda pinned hasta que entre al editor (imposible mobile).
- Re-consent OBLIGATORIO cuando se agregan scopes nuevos. Directora rural ve pop-up adicional → fricción + tickets de soporte.
- Limitación crítica de sharing a 1k-10k tenants: "view access" del script project requiere o (a) direct user sharing limitado a 100 usuarios, o (b) link sharing público — esta última NO documentada oficialmente como patrón blessed para libraries.
- Google desaconseja libraries para performance: "doesn't run as quickly as it would if all the code were contained within a single script project".
- No existe patrón blessed Google para multi-tenant Apps Script a 1k+ tenants. La solución oficial es Editor Add-on en Marketplace — migración arquitectónica considerable (single-script publicado vía Marketplace + verificación OAuth + manifest scopes explícitos).

**Recomendación del agente**: NO invertir en migrar a Library ahora. Mantener bound script copiado + propagación anual vía re-copia natural en cambio de año lectivo, alineado con la cadencia real del producto.

**Mitigación de bug crítico mid-año sin Library**:

- Web App como kill-switch: el operador puede sacar el Web App de servicio (deja de responder) si emerge bug grave. Las escuelas quedan en estado "no operativo" pero no en estado "datos corruptos".
- Remote config flag vía PropertiesService: bound script consulta endpoint del operador antes de operación crítica. Si el operador setea flag "modo seguro", el bound script aborta operación. NO propaga código pero permite gating.
- Comunicación humana: mail a las directoras + tutorial de re-copia. Operacionalmente molesto a 1k+ pero hacible.

## 4. Decisiones arquitectónicas tomadas

**4.1 Multi-tenant via bootstrap "Activar sistema" — Opción B agente 1**

Conversión `onFormSubmitDispatcher` (instalable global del operador) → función standalone que se invoca desde menú custom "Activar sistema" creado en `onOpen` del script bound al template. La directora hace click una vez post-bootstrap → instala trigger local en su script copiado. Resuelve riesgos R9/R10/R11 del mapeo del plomero.

**4.2 NO migrar a Apps Script Library ahora**

Frame de cadencia anual aclarado por Fito + verdict del agente 2 convergen. Library introduce más overhead que beneficio para nuestra cadencia. Mantener bound script copiado + re-copia anual natural en cambio de año lectivo (versionado por año lectivo ya está como deuda v3 del proyecto).

**4.3 Mitigación de bug crítico mid-año sin Library**

Tres niveles de mitigación documentados como deuda explícita post-paso-22:
- Nivel 1 (kill-switch): Web App fuera de servicio si bug grave compromete datos.
- Nivel 2 (remote config flag): PropertiesService endpoint del operador con flag "modo seguro" que bound script consulta pre-operación crítica.
- Nivel 3 (comunicación humana): mail a directoras + tutorial de re-copia.

A documentar en `checklist-pendientes.md` como decisión con fecha de revisión 2027-03 (cambio de año lectivo natural).

**4.4 Editor Add-on Marketplace como deuda futura — fuera de scope DAI 2026**

Si DAI escala a 1k+ escuelas con cadencia real más continua que anual, el path documentado oficial Google es migrar a Editor Add-on en Marketplace. Decisión arquitectónica grande, requiere verificación OAuth + manifest scopes + deploy a Marketplace. Fuera de scope DAI 2026. Anotar en checklist v3.

## 5. Plan de chunks ajustado 22.1..22.6

| Chunk | Nombre | Cambio respecto a plan v2 | LOC est | ETA |
|---|---|---|---|---|
| 22.0 | Mapeo del plomero | ✅ COMPLETADO chunk 22.0 | 0 | ~1 h |
| 22.0b | Research bloqueante | ✅ COMPLETADO este doc | 0 | ~1 h |
| 22.1 | Test empírico `_testOpenById` cross-Sheet | Sin cambio. Bloqueante de 22.2. | ~30 LOC temporal | ~30 min |
| 22.2 | Backend modelo C distribuido | **AJUSTADO**: agregar `installSubmitDispatcher_local()` (función invocada por menú "Activar sistema", instala trigger en script local de directora). Eliminar instalación global del operador. Agregar `onOpen()` simple trigger con menú custom "DAI → Activar sistema". | ~180-220 LOC (+30 vs estimación pre-fase v2) | ~2.5-3 h |
| 22.3 | Frontend `PanelConfigurador.html` + `_renderConfigurador` + `runBootstrapForExternalSheet` | Sin cambio. | ~100-130 LOC | ~1 h |
| 22.4 | `TuPanelTabBuilder` + `MISHEETID()` custom function | Sin cambio. | ~30-50 LOC | ~30 min |
| 22.4b | **NUEVO**: PropertiesService endpoint remote config flag (mitigación nivel 2) | Endpoint en WebApp.gs `getRemoteConfig()` + bound script consulta pre-operación crítica. | ~30-50 LOC | ~30 min |
| 22.5 | Test empírico cross-Sheet end-to-end | **AJUSTADO**: incluir validación del flow "Activar sistema" — directora copia template → abre Sheet → click "Activar sistema" → instala trigger local → ejecuta operación Sumar → trigger local procesa → handler escribe a SU Sheet. | 0 | ~45 min |
| 22.6 | Smoke + cycle + commit + push | **AJUSTADO**: documentar mitigación 3 niveles en checklist como decisión arquitectónica con fecha revisión 2027-03. | 0 | ~30 min |

**ETA total revisado**: 6.5-8 h (sin cambio significativo respecto a pre-fase v2 — el chunk 22.4b agrega 30 min, compensado por simplificación del 22.2 al usar patrón "Activar sistema" vs trigger global complicado).

**LOC total revisado**: ~370-500 LOC (chunk 22.4b agrega ~30-50 LOC, dentro del rango pre-fase v2).

## 6. Cazada estructural personal — sesión 6

**Reconocimiento honesto**: cuando armé el mapeo del plomero (chunk 22.0), asumí "onFormSubmit es simple trigger nativo" sin verificar la doc oficial Apps Script. Era duda técnica disfrazada de decisión (feedback `dudas-disfrazadas-de-decisiones.md`) — la respuesta era verificable en docs y yo inferí en lugar de investigar. El research bloqueante 22.0b cazó mi error pre-código, costo ~30-60 min vs codear ~150 LOC con base errónea + descubrir bug en R9.

**Aplicación de feedback en memoria al meta-nivel**: el chunk 22.0b research no estaba en el plan de chunks pre-fase v2. Emergió SOLO al hacer el mapeo del plomero (chunk 22.0). Es decir: aplicar mapeo del plomero post-cuestionar-plan-pre-fase es lente complementaria que cazó issues que la primera no podía cazar (scope vs plomería). Costumbre `mapeo-plomero-pre-sub-paso.md` aplica al meta-nivel — no solo a sub-pasos de código.

**Caso seminal del proyecto similar**: sesión 5 chunk 0 mapeo cazó 11 SPOFs pre-código con ~5 min adicionales — valor demostrado. Ahora sesión 6 chunk 22.0 + 22.0b cazó error arquitectónico mío de ~150 LOC con ~1.5 h adicionales — valor demostrado a otra escala.

## 7. Próximo paso

**Post-dale Fito al cierre de chunk 22.0b**:

1. Sesión 6 arranca chunk 22.1 — test empírico `_testOpenById(sheetId)` cross-Sheet.
   - Setup: Fito crea Sheet vacío en cuenta externa adolfoprunotto@gmail.com sin compartir.
   - Sesión 6 deploya función temporal en WebApp.gs.
   - Fito invoca desde browser logged como cuenta externa.
   - 3 ramas resueltas (success / no-permission / scope).
2. Si test 22.1 pasa: arranca chunk 22.2 backend modelo C distribuido + patrón "Activar sistema".
3. Si test 22.1 falla con scope: agregar scope `https://www.googleapis.com/auth/spreadsheets` al manifest, retest.
4. Si test 22.1 falla con no-permission: re-arquitectura — el modelo "execute as user accessing + openById" no funciona cross-Sheet. Path alternativo: la directora comparte explícito Sheet con cuenta operador via Drive sharing en flow inicial (UX agrega 1 paso pero resuelve permission). Pero eso es decisión Fito.

## 8. Firma

Chunk 22.0b cierre escrito post-research bloqueante consolidado de 2 agentes background. Aplica costumbre `cuestionar-plan-pre-fase.md` (research empírico ANTES de codear, no después) + feedback `dudas-disfrazadas-de-decisiones.md` (reconocimiento honesto del error mío sobre simple triggers + corrección via research) + feedback `gaslighting-ia.md` (no minimizar la cazada del error propio, documentar honesto). Aplica filosofía operativa CLAUDE.md L17 ("Buscá lo que existe antes de construir") + L19 ("Lo nuevo reemplaza, no apila") via decisión de NO migrar a Library.

— FORJA DAI siguiente, sesión 6, chunk 22.0b research bloqueante cierre, 2026-05-02.
