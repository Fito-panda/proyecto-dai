# 📋 Sheet Template — Spec de diseño

> **Alcance:** este documento describe el ARTEFACTO PRINCIPAL del producto DAI — el Google Sheet que cada escuela copia a su Drive. La implementación programática (quien construye estas pestañas en código) es `ConfigSheetBuilder.gs`.
>
> **Nombre del Sheet:** `DAI-Template-v1`
> **Ubicación en Drive (producción):** compartido público "cualquiera con el enlace puede ver".
> **Flujo del usuario:** Archivo → Crear una copia → Sheet personal con Apps Script container-bound vinculado.

---

## 🎨 Sistema de diseño del template

Antes de entrar a cada pestaña, reglas transversales que aplican a todas:

| Elemento | Especificación |
|---|---|
| Fuente | Google Sans / default del Sheet (sin overrides raros que rompen en mobile) |
| Header row | Fondo `#1F3864` (azul navy oscuro), texto blanco bold, altura 40px, **frozen row 1** |
| Filas alternadas | Blanco `#FFFFFF` y gris muy claro `#F5F7FA` (banded rows nativo de Sheets) |
| Texto "ejemplo, borrar" | Italic, color `#888888`. Filas con placeholder incluyen literalmente `(ejemplo)` al lado del nombre y `← borrá esta fila` en la última columna. Quedan visualmente obvias para el usuario que copia el template |
| Pestañas protegidas | `📋 Estado del sistema` read-only (solo el script escribe ahí). El resto editable |
| Celdas de fórmula | Fondo `#FFF4C5` (amarillo claro) — indica "no editar, calculado" |
| Anchos de columna | auto-fit después de sembrar defaults; el script re-aplica autoResizeColumns al final |
| Orden de pestañas | Izquierda a derecha según tabla abajo. Al abrir el Sheet se activa `👋 Arranque` con cursor en `A1` |
| Emoji en nombre de pestaña | SÍ — da identidad visual. UTF-8 full, sin fallback ASCII |

---

## 📑 Pestaña 1 — `👋 Arranque`

**Propósito:** pantalla de bienvenida. La directora llega, lee, sabe qué hacer. Cero jerga técnica.

**Layout:** una sola columna de texto (A2:A20), columna B vacía. Header row oculto o fusionado.

**Contenido (literal, para copiar/pegar al builder):**

```
BIENVENIDA A DAI — Dirección Asistida desde el Interior

Hola. Este Sheet es el centro de control de tu escuela.
Todo lo que cargues acá se convierte en formularios digitales
que tus docentes responden desde el celular.

PASOS PARA ARRANCAR (no te saltees ninguno):

1. Completá la pestaña ⚙️ Configuración con los datos de tu escuela.
2. Cargá tu equipo en 👥 Docentes. Hay 2 filas de ejemplo marcadas
   "(ejemplo - borrar)" para que veas cómo se completa. Borralas
   y cargá tus docentes reales.
3. Revisá 📚 Secciones, 📖 Espacios curriculares y 🔧 Modalidades.
   Vienen con defaults del PCI Córdoba 2026, ajustalos si hace falta.
4. En ✅ Formularios tildá los que querés activar. Los 14 vienen
   tildados — destildá lo que no uses.
5. Arriba en el menú, cuando cargue todo, vas a ver:
   🌱 DAI → Generar todo por primera vez
6. La primera vez Google te va a mostrar un warning "app no verificada".
   Es esperado. Click en "Avanzado" → "Continuar". Leé la nota que te
   pasaron por WhatsApp si tenés dudas.
7. El script corre 3 a 6 minutos. Al final te deja un link a un panel
   web con todos los formularios. Copiá ese link y pegalo en el grupo
   de WhatsApp de docentes.

IMPORTANTE:
- No borres ni renombres ninguna pestaña.
- Todo lo que cargues podés editarlo después — no es definitivo.
- Si algo falla, en la pestaña 📋 Estado del sistema hay un log.
```

**Formato visual:**
- Celda A2: título grande, 24pt, bold, color `#1F3864`.
- A4–A20: 14pt, line-height 1.5, color `#333333`.
- "PASOS PARA ARRANCAR" en bold, 16pt.
- "IMPORTANTE:" en rojo oscuro `#8B0000` bold.
- Anchura columna A: 800px.

**Protección:** read-only (el usuario solo lee, no edita acá).

---

## 📑 Pestaña 2 — `⚙️ Configuración`

**Propósito:** datos institucionales básicos. El script lee estos valores en cada corrida.

**Layout:** 2 columnas — `clave` | `valor`. Estilo tipo "hoja de definiciones".

**Headers (row 1, frozen):**

| Clave | Valor |
|---|---|

**Contenido sembrado (placeholders genéricos — el usuario los completa con sus datos):**

| Clave | Valor (placeholder) |
|---|---|
| `nombre_escuela` | *(completar — ej: "Escuela N° 123 Nombre")* |
| `nivel` | *(completar — ej: "Primario" / "Inicial" / "Secundario")* |
| `modalidad_jornada` | *(completar — ej: "Jornada Simple" / "Jornada Completa" / "Jornada Única Modelo A 25hs")* |
| `anio_lectivo` | 2026 |
| `localidad` | *(completar — ej: "Ciudad, Provincia")* |
| `direccion_calle` | *(completar)* |
| `email_directora` | *(completar)* |
| `telefono_escuela` | *(completar)* |
| `cue` | *(completar — código único de establecimiento)* |
| `zona_inspeccion` | *(completar)* |

Todos los valores llegan como texto italic gris `#888888` con el formato `(completar — ...)`. Cuando el usuario escribe encima, el italic se convierte en texto normal automáticamente (no hace falta que cambie formato).

**Validaciones:**
- Columna `Clave` → protegida (solo el script puede modificarla).
- Columna `Valor`:
  - `anio_lectivo` → número entero entre 2026 y 2100 (data validation).
  - `email_directora` → regex email básico.
  - Resto: texto libre.

**Formato:**
- Columna A (claves): fondo `#E8EEF7`, font-family monospace (para que se vean como variables).
- Columna B (valores): fondo blanco, ancho 400px.
- Placeholders italic gris `#888888` con patrón `(completar — ...)`.

**Lógica para ConfigRoot.gs (Fase 1):**
```javascript
// Lectura en Apps Script:
const cfg = readConfigSheet('⚙️ Configuración');
// cfg.nombre_escuela === 'Escuela N° 123 (lo que haya cargado la directora)'
// cfg.anio_lectivo === 2026
```

---

## 📑 Pestaña 3 — `👥 Docentes`

**Propósito:** nómina docente. Alimenta el dropdown `docentes` y variantes (`docentes_plus_directora`, etc.) en los 11 forms.

**Headers (row 1, frozen):** 12 columnas.

| # | Apellido | Nombre | Apodo | DNI | Email | Cargo | Tipo | Estado | Reemplaza a | Desde | Hasta | Obs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

**Contenido sembrado (2 filas de ejemplo genéricas + resto vacío — criterio "el template sirve al 100% del mercado, no al 1%"):**

| Apellido | Nombre | Apodo | DNI | Email | Cargo | Tipo | Estado | Reemplaza a | Desde | Hasta | Obs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pérez *(ejemplo)* | Juan | Don Juan | — | — | Maestra de grado 1°/2° | Maestro de grado | Activo | — | 2026-03-01 | — | ← borrá esta fila |
| Gómez *(ejemplo)* | María | Seño Mari | — | — | Directora | Directora | Activo | — | 2026-03-01 | — | ← borrá esta fila |
| *(vacío)* | | | | | | | | | | | |
| *(vacío)* | | | | | | | | | | | |
| *(vacío)* | | | | | | | | | | | |

Total: 2 filas sembradas visibles como ejemplo + ~20 filas vacías para que el usuario complete sin agregar filas manualmente (escalable: si necesita más, las agrega).

**Validaciones de datos:**
- `Tipo` → dropdown: `Maestro de grado` / `Docente JE` / `Directora` / `Preceptor/a` / `Auxiliar` / `Otro`.
- `Estado` → dropdown: `Activo` / `Licencia` / `Suplente` / `Baja`.
- `Reemplaza a` → dropdown dinámico con la columna `Apellido + Nombre` de esta misma pestaña (solo se habilita si `Estado = Suplente`).
- `Desde` y `Hasta` → formato fecha ISO.
- `DNI` → regex solo números 7-8 dígitos (warning, no bloqueante).
- `Email` → regex email básico (warning, no bloqueante).

**Formato:**
- Row 1 header azul navy oscuro.
- Banded rows blanco/gris.
- Columna `Estado = Licencia` → fila fondo `#FFF4E5` (naranja claro).
- Columna `Estado = Baja` → fila fondo `#F0F0F0` + tachado en apellido/nombre.
- Anchos: Apellido 140px, Nombre 140px, Apodo 120px, DNI 120px, Email 220px, Cargo 200px, Tipo 160px, Estado 120px, Reemplaza a 180px, Desde/Hasta 110px, Obs 250px.

**Nota al lector del template** (fila fija arriba del header, italic gris `#888888`):
> "Las filas marcadas *(ejemplo)* son solo para que veas cómo se completa. Borralas y cargá los docentes reales de tu escuela."

---

## 📑 Pestaña 4 — `📚 Secciones y grados`

**Propósito:** define las secciones plurigrado de la escuela. Alimenta dropdown `secciones` y `secciones_plus_todas`.

**Headers (row 1, frozen):**

| # | Sección | Ciclo | Grados | Titular | Cantidad alumnos (aprox) | Obs |
|---|---|---|---|---|---|---|

**Contenido sembrado (3 secciones genéricas típicas de primaria plurigrado — editables):**

| Sección | Ciclo | Grados | Titular | Cantidad alumnos (aprox) | Obs |
|---|---|---|---|---|---|
| Sección 1 *(ejemplo)* | 1er ciclo | 1° y 2° | *(elegir docente)* | — | ← editá o borrá |
| Sección 2 *(ejemplo)* | 2do ciclo | 3° y 4° | *(elegir docente)* | — | ← editá o borrá |
| Sección 3 *(ejemplo)* | 3er ciclo | 5° y 6° | *(elegir docente)* | — | ← editá o borrá |
| *(vacío)* | | | | | |
| *(vacío)* | | | | | |

Tres secciones es el caso típico de escuela rural argentina (1°-2° / 3°-4° / 5°-6°). Si tu escuela tiene más/menos, editá estas filas o agregá.

**Validaciones:**
- `Ciclo` → dropdown: `1er ciclo` / `2do ciclo` / `3er ciclo` / `Único ciclo`.
- `Titular` → dropdown dinámico con `Apellido + Nombre + (Apodo)` de la pestaña `👥 Docentes` (solo docentes con Estado = Activo).
- `Cantidad alumnos` → número entero >= 0.

**Formato:**
- Columnas: Sección 140px, Ciclo 120px, Grados 120px, Titular 220px, Cantidad 180px, Obs 250px.
- Notas italic gris al final: "Si tu escuela es de un solo grado por sección, completá `Grados` con un solo número (ej: `1°`)."

---

## 📑 Pestaña 5 — `📖 Espacios curriculares`

**Propósito:** espacios curriculares oficiales. Alimenta dropdown `espacios` y `espacios_plus_general` (11 forms).

**Headers (row 1, frozen):**

| # | Espacio curricular | Ciclos aplicables | Tipo | Docente a cargo (sugerido) | Obs |
|---|---|---|---|---|---|

**Contenido sembrado (PCI Córdoba 2026 — 15 espacios):**

Default de arranque = marco curricular oficial Córdoba 2026. Escuelas de otras provincias (Santa Fe, Mendoza, etc.) pueden editar/reemplazar por su propio PCI. Los "Docente a cargo" llegan vacíos como genéricos (Maestro de grado / Especialista) — se completan cuando la escuela cargue sus docentes reales.

| Espacio curricular | Ciclos aplicables | Tipo | Docente a cargo (sugerido) | Obs |
|---|---|---|---|---|
| Lengua y Literatura | 1, 2, 3 | Curricular | Maestro de grado | — |
| Lengua Extranjera — Inglés | 1, 2, 3 | Curricular | Especialista | — |
| Matemática | 1, 2, 3 | Curricular | Maestro de grado | — |
| Ciencias | 1 | Curricular | Maestro de grado | Solo 1er ciclo |
| Ciencias, Tecnología y Ciudadanía | 1 | Curricular | Maestro de grado | Nombre oficial PCI 1er ciclo |
| Ciencias Naturales y Ciudadanía | 2, 3 | Curricular | Maestro de grado | — |
| Ciencias Sociales y Ciudadanía | 2, 3 | Curricular | Maestro de grado | — |
| Ciudadanía y Participación | 3 | Curricular | Maestro de grado | Solo 3er ciclo |
| Educación Tecnológica y Ciencias de la Computación | 1, 2, 3 | Curricular | Especialista | — |
| Educación Física | 1, 2, 3 | Curricular | Especialista | — |
| Educación Artística — Artes Visuales | 1, 2, 3 | Curricular | Especialista | — |
| Educación Artística — Música | 2, 3 | Curricular | Especialista | Verificar si aplica a tu escuela |
| Literatura y TIC | 2, 3 | Curricular | Especialista | — |
| Tutoría | 1, 2, 3 | Modalidad | Maestro de grado | Transversal |
| Proyecto Institucional | 1, 2, 3 | Modalidad | Maestro de grado | El PIE operativo |

**Validaciones:**
- `Ciclos aplicables` → texto libre con hint "escribir 1, 2, 3 separados por coma. Ej: `1, 2` para 1er y 2do ciclo".
- `Tipo` → dropdown: `Curricular` / `Modalidad`.
- `Docente a cargo` → dropdown dinámico con docentes activos (opcional).

**Formato:**
- Filas cuyo `Ciclos aplicables` contiene solo `1` → fondo `#E8F5E9` (verde muy claro).
- Filas cuyo `Ciclos aplicables` contiene solo `3` → fondo `#E3F2FD` (azul muy claro).
- Nota italic gris al final: "Los espacios marcados para varios ciclos están disponibles en los dropdowns de todas las secciones correspondientes. Modalidad `Tutoría` y `Proyecto Institucional` son transversales."

---

## 📑 Pestaña 6 — `🔧 Modalidades`

**Propósito:** modalidades didácticas disponibles. Alimenta Form 1 (campo `Modalidad`).

**Headers (row 1, frozen):**

| # | Modalidad | Descripción | Activa |
|---|---|---|---|

**Contenido sembrado:**

| Modalidad | Descripción | Activa |
|---|---|---|
| Curricular (un solo docente) | Docente titular da el espacio solo | ☑ |
| Pareja pedagógica | Dos docentes dan simultáneamente, integrando espacios | ☑ |
| Tutoría | Espacio de acompañamiento personalizado | ☑ |
| Proyecto Institucional (PIE) | Proyecto transversal que atraviesa ciclos | ☑ |

**Validaciones:**
- `Activa` → checkbox (Sheets nativo).
- Solo modalidades con `Activa = true` aparecen en los dropdowns de Form 1.

**Formato:**
- Modalidad 250px, Descripción 500px, Activa 80px centrado.

---

## 📑 Pestaña 7 — `✅ Formularios`

**Propósito:** activación modular. Cada escuela tilda los forms que quiere generar.

**Headers (row 1, frozen):**

| # | ID | Nombre | Descripción | Fase | Activar | URL pública (auto) | Sheet destino (auto) |
|---|---|---|---|---|---|---|---|

**Contenido sembrado (11 forms base + Form 15 opcional desactivado por default):**

| ID | Nombre | Descripción | Fase | Activar | URL pública | Sheet destino |
|---|---|---|---|---|---|---|
| F01 | Planificación semanal/quincenal | Completar al inicio del período | Pedagógica | ☑ | *(se llena al correr)* | *(se llena)* |
| F02 | Registro de clase | Después de cada clase | Pedagógica | ☑ | — | — |
| F03 | Seguimiento de alumno | Observaciones sobre un alumno | Pedagógica | ☑ | — | — |
| F04 | Evaluación formativa | Al cerrar una unidad o proyecto | Pedagógica | ☑ | — | — |
| F05 | Acta de reunión | Después de cada reunión | Institucional | ☑ | — | — |
| F06 | Avance del PIE | Mensual o cierre de etapa | Institucional | ☑ | — | — |
| F07 | Novedades diarias | 1 vez por día al abrir la escuela | Institucional | ☑ | — | — |
| F08 | Autorización para familias | Plantilla para copiar por actividad | Comunicación | ☑ | — | — |
| F09 | Comunicado / Circular | Registro interno de cada comunicado | Comunicación | ☑ | — | — |
| F13 | Pre-carga SGE | Staging de datos al SGE provincial | Admin | ☑ | — | — |
| F14 | Legajo interno | Ingreso o actualización de legajo | Admin | ☑ | — | — |
| F15 | Evidencia para Supervisión | Carpeta inspectora en un solo lugar | Institucional | ☐ | — | — |

**Validaciones:**
- `Activar` → checkbox (Sheets nativo).
- `URL pública` y `Sheet destino` → protegidos (solo el script escribe).
- `ID`, `Nombre`, `Fase` → protegidos (solo el script escribe/reemplaza al actualizar código).

**Formato:**
- Filas agrupadas por Fase con separadores visuales (border top más gruesa al cambiar de fase).
- Color de fila por Fase:
  - Pedagógica → `#E8F5E9` (verde muy claro)
  - Institucional → `#FFF4E5` (naranja muy claro)
  - Comunicación → `#E3F2FD` (azul muy claro)
  - Admin → `#F3E5F5` (violeta muy claro)
- `URL pública` → fondo `#FFF4C5` (amarillo "calculado, no editar").

**Nota para el usuario** (fila italic gris al final):
> "Tildá/destildá según los forms que quieras usar. La primera corrida crea solo los tildados. Si luego destildás uno, el form permanece en Drive pero deja de aparecer en el panel público. Para reactivar: tildá y corré 'Regenerar panel'."

**Form 15** llega desactivado por default porque es opcional (solo escuelas que rinden evidencia a supervisor).

---

## 📑 Pestaña 8 — `📋 Estado del sistema`

**Propósito:** log de ejecución. Solo el script escribe; la directora lee para debugging.

**Headers (row 1, frozen):**

| # | Timestamp | Nivel | Evento | Detalles |
|---|---|---|---|---|

**Contenido inicial:** vacío. Se llena al correr `Generar todo`.

**Formato:**
- `Nivel = INFO` → texto color `#1565C0` (azul).
- `Nivel = WARN` → texto color `#F57C00` (naranja).
- `Nivel = ERROR` → texto color `#C62828` (rojo) + fila fondo `#FFEBEE`.
- `Timestamp` → formato `YYYY-MM-DD HH:MM:SS`.
- Columna `Detalles` wrapping activado, ancho 500px.

**Protección:** **toda la pestaña read-only para el usuario**. Solo el script (vía `SetupLog.flushTo`) tiene permiso de escritura.

**Arriba de la tabla** (fila 1 de descripción, sobre el header):
> "Log de la última corrida. Si algo falló, buscá la línea `ERROR` y reportalo al equipo de soporte. Antes de reportar, copiá las últimas 20 filas."

**Fila especial "Panel público"** — al pie de la pestaña:
```
Panel público de la escuela: [URL generada por deployWebApp()]
Copiá este link y pegalo en el grupo WhatsApp de docentes.
```

---

## 🧩 Pestaña especial (no es pestaña, es menú) — `🌱 DAI`

**Propósito:** menú custom que aparece arriba del Sheet, entre "Extensiones" y "Ayuda". Construido vía `onOpen()` en `Main.gs`.

**Items del menú:**

1. `🌱 Generar todo por primera vez` → `setupAll()`
2. `🔄 Actualizar listas (docentes, secciones, espacios)` → `refreshListasMaestras()`
3. `🌐 Regenerar panel público` → `regenerateWebPanel()`
4. `🔗 Ver panel público` → abre la URL en nueva pestaña
5. `🔁 Reiniciar registry (advanced)` → `resetRegistry()` (con confirmación)
6. `❓ Ayuda` → muestra un modal con instrucciones básicas

---

## 🏗️ Implementación en ConfigSheetBuilder.gs

`ConfigSheetBuilder.gs` va a:

1. Abrir el Spreadsheet container (el Sheet al que está bound el script).
2. Para cada pestaña de esta spec:
   - `getOrCreateTab(ss, tabName)` (idempotente).
   - Si la pestaña está vacía (lastRow === 0), aplicar headers + defaults + validaciones + formato.
   - Si ya tiene datos, NO tocar datos del usuario, solo re-aplicar formato de headers y validaciones.
3. Aplicar protecciones de celdas/rangos read-only.
4. Aplicar banded rows y conditional formatting.
5. Escribir el menú custom vía `onOpen()` trigger.

**Reentrancia:** correr `ConfigSheetBuilder.build()` dos veces no toca nada de lo que el usuario editó. Solo completa lo que falta y re-aplica formato/validaciones.

---

## ✅ Criterio de aceptación de esta spec

- [ ] Las 8 pestañas cubren 100% de lo que el código necesita leer (ConfigRoot + FORMS_CFG activables + docentes/espacios/secciones/modalidades).
- [ ] Defaults sembrados son **placeholders genéricos marcados `(ejemplo)`** — no datos reales de una escuela particular. El template sirve al 100% del mercado, no al 1%.
- [ ] Toda fila de ejemplo incluye al final `← borrá esta fila` para que sea obvio que no es dato oficial.
- [ ] Todas las validaciones son opinadas (dropdowns, checkboxes, formatos) — no se le pide al usuario "escribí bien".
- [ ] La pestaña `👋 Arranque` es legible sin conocimientos técnicos y **no menciona escuelas específicas**.
- [ ] La pestaña `📋 Estado del sistema` es read-only para el usuario.
- [ ] El Sheet se ve pulido (colores, frozen rows, anchos) — no parece un esqueleto ni una hoja en blanco.

---

**Fin del diseño.** Este doc es el input directo de `ConfigSheetBuilder.gs`.
