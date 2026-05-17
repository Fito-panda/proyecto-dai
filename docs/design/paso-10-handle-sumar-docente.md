# Paso 10/20 plan v3 — handleSumarDocente (spec)

> **Estado:** spec ejecutable. Escrito al cierre de la sesión 2026-04-28 (post paso 9) por FORJA DAI siguiente. Para uso en próxima sesión FORJA DAI siguiente.
>
> **Pre-requisitos:** pasos 1-9 cerrados Y validados end-to-end (ver snapshot-015).

---

## 1. Qué reemplaza

`handleSumarDocenteStub` en `OnSubmitDispatcher.gs`. El stub actual solo loggea a OperacionesLog. El handler real ejecuta la transacción lógica completa.

## 2. Flujo (transacción lógica — Loop 3 hallazgo 4-B)

Recibe `e` con `e.namedValues` que incluye:
- `'Apellido y nombre': ['Aguirre Carmen']`
- `'DNI': ['30123456']` (opcional, puede estar vacío)
- `'Email': ['carmen.aguirre@gmail.com']`
- `'Tipo': ['Suplente']` (opcional, puede estar vacío)

Pasos en orden estricto:

1. **Extraer y validar inputs:**
   - `apellidoNombre` (required) — parse: primera palabra = apellido, resto = nombre.
   - `dni` (opcional) — String, sin trim/sin validación de formato.
   - `email` (required) — `_isValidEmail()` regex existing en SetupOrchestrator (reutilizable).
   - `tipo` (opcional) — string del dropdown.
   - Si email inválido o falta: log ERROR a OperacionesLog + return early. NO writes.

2. **Verificar duplicado por email:**
   - Leer pestaña `👥 Docentes` del **template** (NO del active spreadsheet — cazada arquitectónica del paso 9).
   - Si email ya existe en una fila: log WARN "email duplicado" + return early. NO writes.
   - Si NO existe: continuar.

3. **Generar token PRIMERO** (Loop 3 hallazgo 4-B):
   - `const token = TokenService.generate();`
   - Si falla: throw + log ERROR. NO writes parciales.

4. **Escribir fila completa en `👥 Docentes`** (única operación atómica):
   - `[apellido, nombre, dni, email, tipo, 'Activa', new Date(), new Date(), 'Sumada via Panel Directora', token]`
   - Usar `tab.appendRow(...)` — atomic en Google Sheets.

5. **Compartir Drive yearFolder con email** (best-effort, continue-on-error):
   - `const yearFolder = DriveApp.getFolderById(<yearFolder-id>);`
   - `try { yearFolder.addEditor(email); } catch(err) { log WARN }`.
   - Si falla: log WARN pero NO revertir la fila escrita (la docente sigue registrada, solo no tiene Drive yet — Nely lo arregla manual).

6. **refreshDocentes()** (paso 14 plan v3 — pendiente, stub por ahora):
   - Si paso 14 no implementado todavía: skip + log INFO "refreshDocentes() pendiente paso 14".
   - Si implementado: invocar para regenerar dropdowns de los 6 forms con `choicesFromList: 'docentes'`.

7. **Loguear éxito a OperacionesLog:**
   - `OperacionesLog.info('Docente sumada', {apellido, nombre, email, tokenLast4: token.slice(-4)}, '<email-de-quien-disparo>')`.
   - El "Quién" idealmente sería el email de la directora que tocó el botón. Hoy: vacío (paso 15 plan v3 trae VERIFIED + email captura).

8. **Mensaje post-submit con URL admin de la nueva docente** (FUTURO — Loop 3 hallazgo de UX):
   - `const urlAdmin = base + '?role=admin&token=' + token;`
   - "Listo. Mandale este link a Carmen por WhatsApp: <urlAdmin>"
   - **Hoy NO se puede hacer** porque el handler corre en contexto de trigger (sin UI). El mensaje al usuario lo da el Form post-submit, configurado al crear el form.
   - **Workaround para v1:** la URL queda en `📋 Estado del sistema` como log INFO. Nely la copia de ahí. v1.1 puede agregar mejor UX.

## 3. Cazadas potenciales (anticipadas — patrón paso 9)

### Cazada anticipada A — `getActiveSpreadsheet()` retorna Sheet del trigger, NO template

**Mismo patrón que cazada #2 del paso 9.** El handler corre en contexto de trigger Sheet-bound apuntando a `SHEET-Sumar-Docente-2026`. `getActiveSpreadsheet()` retorna ESE Sheet, no el template `DAI-Template-v1-2026`.

Pero el handler NECESITA escribir a `👥 Docentes` que está en el **template**. Si llama `SpreadsheetApp.getActiveSpreadsheet().getSheetByName('👥 Docentes')` falla silencioso.

**Fix anticipado:** mismo patrón que `OperacionesLog._resolveTemplate()`. Crear helper análogo en SetupOrchestrator o utility shared:
```javascript
function _getTemplateSpreadsheet() {
  // 1: active first
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss && ss.getSheetByName('👥 Docentes')) return ss;
  // 2: PropertiesRegistry cache
  const cached = PropertiesRegistry.get('template:container');
  if (cached && cached.id) {
    ss = SpreadsheetApp.openById(cached.id);
    if (ss && ss.getSheetByName('👥 Docentes')) return ss;
  }
  return null;
}
```

Better aún: extraer `OperacionesLog._resolveTemplate()` a un helper compartido (ej. `TemplateResolver.gs`) y reutilizar en todos los handlers + OperacionesLog. Refactor para v1.1 si la duplicación se vuelve dolor.

### Cazada anticipada B — yearFolder ID

Para `addEditor(email)` necesitamos el `yearFolder` de Drive. Hoy se resuelve via `PropertiesRegistry.get('folder:2026')` que está poblado por setupAll. Pero si setupAll todavía no corrió en el ambiente del template + el handler se dispara → fallo.

Mitigation: defensive — si no encuentra `folder:2026` en registry, log WARN + skip share. La fila en `👥 Docentes` queda escrita igual. Nely puede compartir manual.

### Cazada anticipada C — concurrencia (PEND-PROD-1 ya conocida)

Si 2 directoras (futuras) sumarn docentes simultáneamente, el `appendRow` puede tener race condition. Mitigación: `LockService.getScriptLock().tryLock(timeout)` al inicio de `handleSumarDocente`. Try/finally para liberar.

Decisión v1: **omitir LockService** porque el demo es 1 directora. Documentar en comentario "TODO escala 956 escuelas". Anotado ya en checklist como PEND-PROD-1.

### Cazada anticipada D — DocGen para forms operativos

Los 4 forms operativos NO tienen `DOC_TEMPLATES[formId]` entry. **NO necesitan DocGen** (a diferencia de F05/F06/F08-F14). Confirmar que el dispatcher NO intenta llamar `processFormalSubmit` para SHEET-Sumar-Docente-2026 — el DISPATCH_TABLE actual ya lo confirma (el handler stub es `handleSumarDocenteStub`, NO delegation a `processFormalSubmit`).

## 4. Estimación de complejidad

| Paso | Tiempo |
|---|---|
| Diseño + lectura SetupOrchestrator (referencia para upsertByEmail + isValidEmail) | 5 min |
| Implementación `handleSumarDocente` real | 15 min |
| Refactor extract `_resolveTemplate` o crear `TemplateResolver.gs` (cazada A) | 10 min |
| clasp push + smoke + dale | 5 min |
| Test integración: enviar form F-baja-01, verificar fila nueva en `👥 Docentes` con token + Estado=Activa + share OK | 5 min |
| Verificar URL admin nueva (copiar token de la fila + abrir panel admin con el token) | 5 min |
| Commit local | 2 min |

**Total: ~50 min.** Ojo cazadas potenciales pueden agregar ~20 min cada una.

## 5. Orden de items para próxima sesión (siguiendo protocolo de reparación)

Aplicar el loop de CLAUDE.md global. Vueltas anticipadas:

1. **Vuelta 1** (más causal): refactor extract `_resolveTemplate` a helper compartido (utility) — NO porque urge, sino porque va a usarse en handlers 10-13. DRY desde el inicio.
2. **Vuelta 2:** `handleSumarDocente` real reemplaza `handleSumarDocenteStub`.
3. **Vuelta 3:** test integración + cazadas que aparezcan.
4. **Vuelta 4-N:** fixes de cazadas reales.

## 6. Pre-condiciones que la próxima sesión debe verificar al arrancar

1. **Estado git:** `proyecto-dai` debería estar en branch `feat/baja-sumar-docente-v3` HEAD `8375259` (o más reciente si hay commits posteriores).
2. **Apps Script driveproyectodai:** 16 triggers, deploy v11, `template:container` cacheado en registry.
3. **Smoke 16/16 PASS** como baseline.
4. **`📋 Estado del sistema` fila 3:** primera ejecución del dispatcher en vivo (Lopez Maria del paso 9). Confirma que el plomero del paso 9 sigue funcionando.

Si alguna no se cumple → diagnosticar antes de tocar paso 10.

## 7. Archivos a tocar (paso 10)

| Archivo | Cambio |
|---|---|
| `OnSubmitDispatcher.gs` | Reemplazar `handleSumarDocenteStub` por handler real (mismo nombre o renombrar a `handleSumarDocente`). Mantener referencia en DISPATCH_TABLE. |
| (nuevo opcional) `utils/TemplateResolver.gs` | Helper compartido `_resolveTemplate()` extraído de OperacionesLog. |
| `OperacionesLog.gs` | Si hay refactor extract: usar `TemplateResolver.resolve()` en lugar de `_resolveTemplate` interno. |
| `Main.gs` | Sin cambios (a menos que el helper requiera entry point). |

## 8. Ojo decisiones que necesitan dale Fito antes de codear

1. **Dónde poner el helper de resolve template:** ¿`utils/TemplateResolver.gs` (mejor para DRY) o inline en cada handler (peor, duplicación)? Recomiendo extraerlo.
2. **Mensaje post-submit con URL admin:** ¿en log only (v1) o también editar el form para mostrar el mensaje custom? Form custom es más complicado de mantener, log alcanza para demo.
3. **LockService:** ¿agregamos ahora o esperamos PEND-PROD-1? Recomiendo esperar — agrega complejidad sin beneficio en demo 1 directora.

---

**Spec escrita por FORJA DAI siguiente al cierre 2026-04-28. Para uso en próxima sesión.**
