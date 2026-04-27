# Baja y suma de docentes — diseño v3 final ejecutable

> **Estado:** plan v3 ejecutable. Pasó 3 audits adversariales (Loop 1.5 modelo conceptual + verificación técnica WebSearch CT1-CT3 + Loop 3 plan ejecutable). 10 enmiendas críticas/major incorporadas. Listo para implementar próxima sesión FORJA DAI.
>
> **Reemplaza:** versión parcial v1 del 2026-04-27 que tenía modelo B con 7 columnas, sin tokens, sin dispatcher consolidado.

---

## 1. Problema

La directora de una escuela rural maneja docentes que entran y salen en cualquier momento del año por razones distintas: licencias, traslados, fallecimientos, suplencias, fin de contrato, refuerzos eventuales. El sistema DAI tiene que dejarla resolver esas operaciones **desde el celular**, sin abrir IDE, sin programar.

Hoy (pre-implementación) no existe forma directa: hay que editar manualmente la pestaña Docentes del Sheet y compartir/revocar permisos del Drive a mano. Inviable para una directora rural en su día a día.

## 2. Filosofía base (cazadas que aplican)

- **Puertas no muros** — schema mínimo + 1 puerta libre (`Notas`).
- **Autoridad humana, no candados tecnológicos** — todas las docentes registradas tienen los mismos poderes administrativos.
- **Ni la directora es SPOF** — si falta o fallece, el sistema perdura porque cualquier docente registrada puede operar.
- **Solo registradas operan** — `👥 Docentes` actúa como lista de control de acceso (token único por docente).
- **Lenguaje de Nely, no del Ministerio** — `Activa / Licencia / No disponible` (no `Activo/Licencia/Suplente/Baja` del plan v9).
- **Mobile-first para 4 ops cotidianas** — el Sheet es para casos esporádicos desde compu.

## 3. Schema final — pestaña `👥 Docentes` (10 columnas)

| # | Columna | Tipo | Quién la llena | Obligatorio |
|---|---|---|---|---|
| 1 | Apellido | texto | Form / Nely | sí |
| 2 | Nombre | texto | Form / Nely | sí |
| 3 | DNI | texto | Form / Nely | opcional |
| 4 | Email | texto | Form / Nely | sí |
| 5 | Tipo | dropdown (Titular/Suplente/JE/Otro) | Form / Nely | opcional |
| 6 | Estado | dropdown (Activa/Licencia/No disponible) | Sistema (auto) | sí |
| 7 | Fecha alta | fecha | Sistema (auto) | sí |
| 8 | Fecha cambio Estado | fecha | Sistema (auto) | sí |
| 9 | Notas | texto libre | Nely directo en Sheet | opcional |
| 10 | Token | UUID generado | Sistema (oculta para Nely) | sí |

**Pestaña nueva `📋 Estado del sistema`** — log auditable. 5 columnas: Fecha, Tipo, Quién, Qué, Detalle.

## 4. Modelo de seguridad

```
PanelDirectora (administración)
   └─ Anyone with the link
   └─ Valida ?token= contra 👥 Docentes (Estado != No disponible)
   └─ Si OK → panel completo + saludo "Hola, [nombre]"
   └─ Si NO → "este link no es válido, pedile a la directora un link nuevo"

PanelDocentes (los 14 botones para forms)
   └─ Anyone with the link sin verificación
   └─ Solo botones que abren forms

11 forms de docentes + 4 forms operativos
   └─ Modo VERIFIED (NO setRequireLogin que está deprecated)
   └─ Captura email del que envió
   └─ Trigger único onFormSubmitDispatcher en el Sheet
   └─ Dispatcher → handleAuthCheck verifica email contra 👥 Docentes
   └─ Si autorizado: pasa al handler correcto
   └─ Si NO autorizado: borra fila + log a 📋 Estado del sistema
```

## 5. Las 4 operaciones del Panel (UX desde el celular de Nely)

```
👥 MIS DOCENTES

   [ + Sumar una docente ]
   [ ↻ Marcar de licencia ]
   [ ✓ Volvió de licencia ]
   [ − Dar de baja ]
```

Cada botón abre un Google Form nativo en pestaña nueva.

### 5.1 Sumar docente

**Form (4 campos):**
```
+ Sumar una docente
├ Apellido y nombre *
├ DNI (opcional)
├ Email *
├ Tipo: [Titular ▼] (opcional)
└ Cargo / Notas (opcional)
[ Enviar ]
```

**Handler (transacción lógica — fix Loop 3 enmienda 4):**
1. Validar email formato + duplicado en `👥 Docentes`.
2. **Generar UUID PRIMERO** (no después de appendRow).
3. **`upsertByEmail`** — si email existe: skip. Si no: appendRow con todos los campos incluido el token.
4. `yearFolder.addEditor(email)`.
5. `refreshDocentes()` (regenera dropdowns de los 6 forms con docentes).
6. `OperacionesLog.escribir("Carmen sumada por [quien-tiene-el-token]")`.
7. Mensaje post-submit: *"Listo. Mandale este link a Carmen por WhatsApp: https://script.google.com/.../exec?role=admin&token=k7f9a2x3pq. Aclará que use ESTA cuenta Google: caguirre@gmail.com"*

### 5.2 Marcar licencia

**Form (1 campo):** dropdown docentes con Estado=Activa.

**Handler:**
1. Encontrar fila en `👥 Docentes`.
2. Cambiar `Estado` a `Licencia` + `Fecha cambio Estado` = hoy.
3. **NO toca permisos del Drive** (puede volver).
4. `refreshDocentes()`.
5. Log a `📋 Estado del sistema`.
6. Mensaje post-submit: *"Listo. Beatriz queda con licencia. Cuando vuelva, tocá 'Volvió de licencia'."*

### 5.3 Volvió de licencia

**Form (1 campo):** dropdown docentes con Estado=Licencia.

**Handler:**
1. Encontrar fila.
2. Cambiar `Estado` a `Activa` + `Fecha cambio Estado` = hoy.
3. **NO toca permisos** (ya tenía).
4. **NO desactiva al suplente** (decisión humana de la directora).
5. `refreshDocentes()`.
6. Log.
7. Mensaje post-submit con recordatorio del suplente.

### 5.4 Dar de baja

**Form (1 campo + checkbox confirmación):** dropdown docentes (Activa o Licencia) + checkbox "Sí, dar de baja".

**Handler (con manejo defensivo de fallos — fix Loop 3 enmienda 5):**
1. Encontrar fila.
2. Cambiar `Estado` a `No disponible` + `Fecha cambio Estado` = hoy.
3. **NO borra fila** (caso "vuelve" — Opción B PEND2).
4. **Invalida el token** (vacía la columna Token).
5. Try `yearFolder.removeEditor(email)`:
   - Si OK: log normal.
   - Si FAILS: log ERROR con flag *"ACCION MANUAL REQUERIDA: revocar acceso a [email]"* en `📋 Estado del sistema`.
6. `refreshDocentes()`.
7. Mensaje post-submit.

## 6. Panel "Mi equipo hoy" + "Mis docentes" en PanelDirectora

```
HEADER — "Hola, [nombre del que entró con el token] — [Escuela]"

📋 Estado de tu configuración (existente)
   ✓ 11 formularios activos
   ✓ 3 secciones configuradas

👥 MI EQUIPO HOY (nuevo)
   ✓ N activas
   ↻ N de licencia
   ✗ N no disponibles (este año)
   [Ver detalle →]

👥 MIS DOCENTES (nuevo)
   [+ Sumar una docente]
   [↻ Marcar de licencia]
   [✓ Volvió de licencia]
   [− Dar de baja]

⚙️ Acciones principales (existente)
   [Cambiar mi configuración]
   [Regenerar sistema]

📱 Link para compartir con maestras (existente)
   QR + botón copiar

📂 Mis respuestas por formulario (existente)
```

Vista detalle ("Ver detalle →"): tarjetas agrupadas por Estado.

## 7. Mapeo de plomero — flujo de datos

```
FUENTE 1 — Form de onboarding (1 vez, primer setup)
   └─→ pestaña _respuestas_config
          └─→ SetupOrchestrator siembra inicial (UPSERT, no append) →
              vuelca director_email + teacher_emails a 👥 Docentes con tokens UUID

FUENTE 2 — 4 forms operativos del Panel
   └─→ trigger único onFormSubmitDispatcher en el Sheet
          └─→ dispatch por nombre de pestaña de respuestas (NO por e.source.getTitle)
                 └─→ handleSumarDocente / Licencia / Volvió / Baja

FUENTE 3 — 11 forms de docentes (operación cotidiana)
   └─→ mismo trigger dispatcher
          └─→ handleAuthCheck (verifica email contra 👥 Docentes)
                 ├─ Si autorizado: pasa al flujo normal (form formal → DocGenerator Fase 2.5)
                 └─ Si NO autorizado: borra fila + log

FUENTE 4 — Edición manual de Nely en el Sheet (esporádico)
   └─→ Notas, cleanup ocasional, lectura de logs — no dispara nada del sistema

DESTINOS:
- 👥 Docentes (fuente única)
- 📋 Estado del sistema (logs auditables)
- 11 sheets de respuestas
- Drive yearFolder (permisos addEditor/removeEditor)
- 🚀 Tu Panel (URLs personalizadas)
```

## 8. Cableado — archivos a tocar

### Modificados (10)

| # | Archivo | Cambio principal |
|---|---|---|
| 1 | `ConfigSheetBuilder.gs` | Nuevo schema `👥 Docentes` (10 cols) + agregar pestaña `📋 Estado del sistema` |
| 2 | `ListasMaestrasBuilder.gs` | `_buildSnapshot` lee de `👥 Docentes`, filtra Estado=Activa, **elimina key `docentes_plus_directora` y `DEFAULT_DIRECTORA`**. Eliminar creación de pestaña Docentes plana en `build()`. |
| 3 | `SetupOrchestrator.gs` | Siembra inicial idempotente (`upsertByEmail`) + share lee de `👥 Docentes` + paso 8.5 explícito de desinstalación de triggers viejos antes de instalar dispatcher |
| 4 | `ConfigForms.gs` | 6 ocurrencias `docentes_plus_directora` → `docentes` (líneas 133, 210, 237, 267, 473, 504) + 4 forms operativos nuevos con `phase='operativa'` |
| 5 | `FormBuilder.gs` | Modo VERIFIED para captura email (NO `setRequireLogin` deprecated) |
| 6 | `WebApp.gs` | Validación `?token=` en doGet para PanelDirectora con fallback cálido si no autorizado |
| 7 | `PanelDirectora.html` | Secciones "Mi equipo hoy" + "Mis docentes" + vista detalle |
| 8 | `Main.gs` | Función `refreshDocentes()` + **marcar `installFormalFormTriggers()` como `@deprecated`** con comentario |
| 9 | `TuPanelTabBuilder.gs` | URL admin construida con token de Nely de `👥 Docentes` |
| 10 | `SmokeTests.gs` | Nuevo test ciclo completo + assertion explícita "snapshot.docentes_plus_directora === undefined" + ajuste count pestañas (8) |

### Nuevos (4)

| Archivo | Función |
|---|---|
| `BajaSumarDocenteHandlers.gs` | `handleSumarDocente`, `handleMarcarLicencia`, `handleVolvioLicencia`, `handleDarDeBaja` (funciones, NO triggers — son llamadas por dispatcher) |
| `TokenService.gs` | `generate()` (UUID v4), `validate(token)`, `invalidate(token)`, `_findByToken(token)` |
| `OnSubmitDispatcher.gs` | **1 SOLO trigger en Sheet**, dispatch por `e.range.getSheet().getName()` (NO `e.source.getTitle()`) + branch `default` explícito que loguea sin throw |
| `OperacionesLog.gs` | Escribe a `📋 Estado del sistema` con severidad (INFO/WARN/ERROR) |

### Eliminados (1)

- Pestaña **`Docentes` plana** de SHEET-Listas-Maestras → no se crea más.

## 9. Trigger consolidado — implementación correcta (post-Loop 3 enmienda 2)

**Problema descubierto en Loop 3:** `e.source.getTitle()` en un Sheet-bound trigger retorna el nombre del Spreadsheet, no del Form. Sería inoperativo.

**Implementación correcta:**

```javascript
// OnSubmitDispatcher.gs
function onFormSubmitDispatcher(e) {
  // try/catch global obligatorio (SPOF interno mitigado)
  try {
    const sheetName = e.range.getSheet().getName();  // ← FIX: pestaña de respuestas, no spreadsheet
    const handler = DISPATCH_TABLE[sheetName];

    if (handler) {
      handler(e);
    } else {
      // FIX: branch default explícito sin throw
      OperacionesLog.warn('Form desconocido recibido', {
        sheetName: sheetName,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    OperacionesLog.error('Dispatcher error', {
      err: String(err),
      stack: err.stack
    });
    // NO re-throw — el trigger queda en estado healthy
  }
}

const DISPATCH_TABLE = {
  'SHEET-Sumar-Docente-2026': handleSumarDocente,
  'SHEET-Marcar-Licencia-2026': handleMarcarLicencia,
  'SHEET-Volvio-Licencia-2026': handleVolvioLicencia,
  'SHEET-Dar-De-Baja-2026': handleDarDeBaja,
  // F02-F14 → handleAuthCheck con dispatch interno a DocGenerator si formal
  'SHEET-Registro-Clase-2026': (e) => handleAuthCheck(e, 'F02'),
  'SHEET-Acta-Reunion-2026': (e) => handleAuthCheck(e, 'F05'),
  // ... etc para los 11 forms
};
```

**Total triggers post-implementación: 3.**
- 1 onFormSubmit consolidado en Sheet (este dispatcher)
- 1 onOpen Sheet (existente)
- 1 onFormSubmit en form de onboarding (existente, separado porque escribe a `_respuestas_config`)

## 10. Pre-deploy (operación manual una vez)

1. **Branch git nueva** (no tocar master).
2. **Borrar manualmente pestaña `👥 Docentes` vieja** en `driveproyectodai` (CT4 — `_matchesSchema` no migra schemas distintos).
3. **Re-bootstrap** con código nuevo.

## 11. Orden de ejecución — 20 pasos (1 cambio + smoke test entre cada)

```
1. Schema 👥 Docentes (10 cols) + 📋 Estado del sistema → smoke (idempotency)
2. ListasMaestrasBuilder lee de 👥 Docentes
   → smoke (snapshot OK + assertion: docentes_plus_directora ELIMINADA)
3. ConfigForms cambia 6 ocurrencias a 'docentes' → smoke (forms se crean OK)
4. SetupOrchestrator siembra inicial idempotente (upsertByEmail) + share desde 👥 Docentes
   → smoke (correr setupAll() 2 VECES, contar filas — debe ser N, no 2N)
5. TokenService.gs (nuevo) → unit test (generate, validate, invalidate)
6. WebApp valida ?token= en doGet
   → PRECONDICIÓN: paso 4 completado con al menos 1 fila con token → test mobile
7. TuPanelTabBuilder con URL personalizada → test visual (URL admin con token de Nely)
8. 4 forms operativos creados via ConfigForms phase='operativa' → smoke
8.5. **DESINSTALAR triggers de FormalFormsTriggerManager**
   → verificar ScriptApp.getProjectTriggers().length === 0 antes del paso 9
9. OnSubmitDispatcher.gs — 1 trigger consolidado
   → unit test con e.range.getSheet().getName() simulado
   → branch default explícito tested
10. handleSumarDocente (transacción lógica: token PRIMERO, después upsertByEmail)
    → test funcional
11. handleMarcarLicencia → test
12. handleVolvioLicencia → test
13. handleDarDeBaja con manejo defensivo de removeEditor fallido → test
14. refreshDocentes() + benchmark
    → NOTA: verificar que VERIFIED mode persiste post-refresh en los 4 forms operativos
15. VERIFIED + email captura → test envío form con/sin login
16. handleAuthCheck → test envío autorizado vs no autorizado
17. Sección "Mis docentes" en Panel → test mobile
18. Sección "Mi equipo hoy" + vista detalle → test mobile
19. runSmokeTests completos → 5/5 PASS + el ciclo nuevo
20. Docs (alinear landing 04-landing-wordpress.md + README.md + 02-non-goals.md + 03-arquitectura.md)
```

## 12. Pendientes capturados

### Resueltos en plan v3
- PEND1 email change → manual (Dar de baja + Sumar)
- PEND2 acumulación entre años → mantener filas (caso "vuelve")
- PEND3 plurality → caso conocido
- PEND4 editar Tipo/DNI → manual desde Sheet (raro)
- PEND5 criterio éxito demo → definir antes del demo Nely
- PEND6 rollback → branch nueva + greenfield mitigan
- PEND7 token visible en historial → coherente con "puerta no muro"
- PEND8 token compartido → voluntad humana
- PEND-NUEVO cuenta Google equivocada → mensaje aclaratorio en alta de docente

### Pendientes para producción (escala 956 escuelas) — descubiertos en Loop 3

- **PEND-PROD-1 (Loop 3 hallazgo 3-A)** — Agregar `LockService.getScriptLock()` en handlers que escriben a `👥 Docentes` cuando el sistema escale. Probabilidad de corrupción concurrente baja con Nely sola, real con múltiples ops paralelas.
- **PEND-PROD-2 (Loop 3 hallazgo 5-C)** — NO usar `resetRegistry()` en producción. Si se hace, los Form IDs cambian y los bookmarks de las maestras quedan apuntando a forms huérfanos. Documentar en runbook operativo.
- **PEND-CRITICO-v1.1 (Loop 3 hallazgo 6-A)** — Mecanismo de **rotación de tokens**. Hoy los tokens nunca rotan; aparecen en historial del navegador, en pestaña 🚀 Tu Panel del Sheet, en posibles screenshots. Si se compromete uno, no hay forma para Nely de revocarlo sin ir al Sheet a mano. **Agregar botón "Regenerar mi link" + "Regenerar todos los links de la escuela" en el panel admin via `google.script.run`.** El agente del Loop 3 elevó esto de PEND a PEND-CRITICO.

### Diferidos
- CT5 timeout 6 min de setupAll → benchmark al implementar; fallback partir setupAll en sub-fases.
- CT6 fallos parciales en siembra → try/catch + retry granular ya incorporado en plan v3.
- E5 footgun non-goal explícito → documentar en `02-non-goals.md` cuando hagamos el demo.
- UX1-UX4 (mensajes detallados, esquemas, transiciones) → resolver en demo Nely.

## 13. Cazadas estructurales que generó esta sesión (para FORJA TALLER)

Anotadas en `catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/emergentes.md` sección 2026-04-27 cazadas F-K. La más fuerte para elevación inmediata: **Cazada F — "Mapeo de plomero como herramienta del taller"** (Fito explícitamente declaró que vale para el taller).

## 14. Estimación de tiempo (post-Loop 3 honesto)

- Schema + cableado: 4-5 hs
- TokenService + seguridad panel: 2-3 hs
- 4 forms operativos + handlers + dispatcher correcto: 4-6 hs
- VERIFIED + email exacto + handleAuthCheck: 1-2 hs
- refreshDocentes + benchmark: 2-3 hs
- Panel "Mi equipo hoy" + "Mis docentes" + vista detalle: 1-2 hs
- Tests + docs: 2-3 hs

**Total honesto: 16-24 hs** de implementación + 2-3 hs de demo + iteración con Nely.

## 15. Próximos pasos al despertar próxima sesión FORJA DAI

```
1. Leer este plan v3 completo (estás acá).
2. Confirmar con Fito si arrancamos implementación o si quiere demo conceptual previo.
3. Si arrancamos:
   3.1 Crear branch git nueva (proyecto-dai + CLAUDE-CORE).
   3.2 Borrar pestaña 👥 Docentes vieja en driveproyectodai (CT4).
   3.3 Re-bootstrap.
   3.4 Ejecutar 20 pasos del orden documentado, smoke test entre cada uno.
4. Demo con Fito como Nely en su carpeta pública.
5. Si pasa el demo: instalar en cuenta real de Nely + presentar a ella.
```

## 16. Referencias cruzadas

- **Snapshot del cierre:** `catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/snapshot-011-cierre-sesion-2026-04-27-plan-v2-baja-suplentes.md`
- **Reportes adversariales:**
  - Loop 1.5 modelo conceptual: `catedral/reportes-agentes/2026-04-27-abogado-del-diablo-sobre-modelo-baja-suplentes-dai.md`
  - Verificación técnica CT1-CT3: `catedral/reportes-agentes/2026-04-27-verificacion-cegueras-apps-script.md`
  - Loop 3 plan ejecutable: `catedral/reportes-agentes/2026-04-27-abogado-del-diablo-loop3-plan-a-v2.md`
- **Cazadas frescas:** `catedral/proyectos-anexos/dai-escuelas-rurales/analisis-patrones-dai/emergentes.md` sección 2026-04-27 cazadas F-K
- **Checklist activo:** `catedral/proyectos-anexos/dai-escuelas-rurales/checklist-pendientes.md`

---

**Diseñado por FORJA DAI · 2026-04-27 · plan v3 final post 3-loops + verificación técnica + 2 audits adversariales con modelo distinto.**

**Convergencia honesta alcanzada — listo para implementación.**
