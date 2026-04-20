# 03 — Arquitectura del producto

## Naming e identidad

**Nombre oficial:** DAI · Dirección Asistida desde el Interior

El acrónimo "DAI" se interpreta como **Dirección Asistida desde el Interior**. Doble sentido deliberado:
- *Interior geográfico*: el producto es para el interior del país (rural argentino). Federalismo explícito en el nombre.
- *Interior institucional*: la asistencia emerge desde adentro de la escuela (directora + docentes + comunidad), no impuesta desde el Ministerio.
- *Asistida*: el producto acompaña, no reemplaza ni fiscaliza.

Bandera identitaria útil al pitchear a Ministerio/gobierno (programas tipo Escuela Precursora, TransFORMAR@Cba).

**Dominio:** `proyectodai.com`.

**Landing pública:** WordPress + Divi, hosting independiente. Contenido: qué es DAI, cómo empezar, nota de prueba social, FAQ, testimonios, link al GitHub MIT, página de privacidad. **Fuera del alcance del backend Apps Script.**

## Decisiones arquitectónicas cerradas (Bloque 1)

### D1 — Distribución: container-bound + open source MIT + puerta abierta a Library

- **Adaptador B (container-bound puro):** se distribuye un **Google Sheet Template público** con Apps Script embebido. Cada escuela hace "Archivo → Crear una copia" → tiene su Sheet + script independiente en su Drive.
- **Código en GitHub público con licencia MIT.** Cualquier actor (gobierno, ONG, programador) puede forkear y empaquetar como Apps Script Library verificada (Adaptador C) sin pedir permiso.
- **El equipo mantenedor NO es SPOF.** Si el equipo original desaparece, las escuelas existentes siguen funcionando; alguien puede retomar el código.

### D2 — Modular con activación en config

- 14 forms base en el código.
- Pestaña `✅ Formularios` del Sheet de config con tabla de activación (ID, nombre, descripción, ☑/☐ activar).
- Al correr "Generar", solo se crean los tildados.
- Desactivar form ya creado: persiste en Drive, pero el panel HTML deja de mostrarlo.
- v1 NO permite creación de forms custom (queda para futuro).

### D2.5 — Adopción sin verificación de Google

- NO se tramita verificación de OAuth Consent Screen.
- La primera vez que una directora corre "Generar", ve el warning "app no verificada" y clickea "Avanzado → Continuar".
- **Nota de prueba social** (archivo `.md` imprimible/compartible) explica por qué el warning no es peligroso, firmada por otra directora que ya lo usa.
- Adopción orgánica: directora → directora, la red de confianza reemplaza al sello de Google.

## Arquitectura del código

### Estructura de archivos

```
apps-script/                             # codigo Apps Script
├── appsscript.json                      # manifest V8, timezone Argentina/Cordoba
├── .clasp.json                          # generado por `clasp create`, scriptId del proyecto (gitignored)
├── .clasp.json.template                 # plantilla sin scriptId real (versionada)
├── src/
│   ├── Main.gs                          # entry points expuestos al IDE + onOpen (menu custom del Sheet)
│   ├── config/
│   │   ├── ConfigRoot.gs                # lee CFG del Sheet de config (nombre escuela, año, etc.)
│   │   ├── ConfigFolders.gs             # arbol fijo de 8 carpetas numeradas
│   │   └── ConfigForms.gs               # array FORMS_CFG con los 14 forms (estructura declarativa)
│   ├── builders/
│   │   ├── FolderBuilder.gs             # getOrCreate carpetas, reentrante
│   │   ├── SheetBuilder.gs              # getOrCreate sheets + tabs
│   │   ├── FormBuilder.gs               # builder generico, traduce config -> FormApp
│   │   └── ConfigSheetBuilder.gs        # crea/actualiza pestañas del Sheet de config (docentes, secciones, etc.)
│   ├── services/
│   │   ├── IdempotencyService.gs        # doble capa: PropertiesRegistry + busqueda por nombre
│   │   ├── PropertiesRegistry.gs        # wrapper sobre PropertiesService (clave -> id de artefacto)
│   │   ├── Logger.gs                    # log a consola + flush a SHEET-Setup-Log (ultimos 5)
│   │   └── PhaseFilter.gs               # filtra FORMS_CFG por fase o por activacion en config
│   ├── orchestration/
│   │   └── SetupOrchestrator.gs         # orquesta el orden: fundaciones -> listas -> forms
│   ├── webapp/
│   │   ├── WebApp.gs                    # doGet() sirve el panel HTML con URLs reales
│   │   └── Panel.html                   # template del panel, inyecta URLs desde Registry
│   └── utils/
│       ├── Types.gs                     # enums FIELD_TYPES, PHASES, ARTIFACT_STATUS
│       └── Guard.gs                     # assertions + retry con backoff
└── tests/
    └── SmokeTests.gs                    # runSmokeTests(): crea 1 form dummy y lo borra
```

### Sheet template (entregable principal)

El Sheet que cada escuela copia. Pestañas (con protección + validaciones donde corresponde):

| Pestaña | Propósito |
|---|---|
| `👋 Arranque` | Instrucciones visuales: "copia, completá, generá, compartí el panel" |
| `⚙️ Configuración` | Datos institución: nombre, año, dirección, email directora, teléfono |
| `👥 Docentes` | Tabla: Apellido, Nombre, Apodo, DNI, Email, Cargo, Tipo (Maestra grado/Docente JE/Directora), Estado (Activo/Licencia/Suplente/Baja), Reemplaza a, Desde, Hasta, Obs |
| `📚 Secciones y grados` | Editable. Default 3 secciones plurigrado pero escalable |
| `📖 Espacios curriculares` | Editable. Default PCI Córdoba 2026 |
| `🔧 Modalidades` | Default: Curricular / Pareja pedagógica / Tutoría / Proyecto Institucional |
| `✅ Formularios` | Tabla 14 forms con checkbox de activación |
| `📋 Estado del sistema` | Log de ejecución generado por el script |
| `🌱 DAI` | Menú custom (no pestaña, menú del Sheet): Generar todo / Actualizar listas / Regenerar panel / Ver panel / Reiniciar registry |

### Flujo de uso (la directora)

```
1. Recibe link del Template (por WhatsApp, mail, landing del proyecto)
2. Abre → "Archivo → Crear una copia" → tiene su Sheet en su Drive
3. Completa pestañas de config
4. Menú "🌱 DAI → Generar todo por primera vez"
5. Primera vez: warning "app no verificada" → nota explicativa → Continuar
6. Acepta permisos (Drive, Forms, Sheets) una sola vez
7. Script corre 3-6 min (con barra de progreso visible)
8. Al final: mensaje con URL del panel HTML público
9. Copia URL → pega en grupo WhatsApp docentes
10. Docentes tocan botones del panel → se abren los forms → responden desde mobile
```

### Orden de ejecución del `SetupOrchestrator`

1. `ensureParentFolder()` — carpeta raíz en My Drive (abort-on-error).
2. `ensureYearFolder()` — subcarpeta del año actual (abort-on-error).
3. `buildFolderTree()` — árbol de 8 subcarpetas numeradas (abort-on-error).
4. `readConfigFromSheet()` — lee docentes/secciones/espacios/forms activos del Sheet de config (abort-on-error).
5. Por cada form activo en el checkbox de config:
   - `getOrCreateSheet()` destino
   - `getOrCreateForm()` y aplicar items (continue-on-error, log en Sheet).
6. `buildWebAppPanel()` — genera el HTML con URLs reales de los forms creados.
7. `deployWebApp()` — publica como web app y devuelve URL pública.
8. `flushLog()` — vuelca log a pestaña `📋 Estado del sistema`.

### Estrategia de reentrancia

- **PropertiesRegistry** guarda `{cfg.id → {formId, sheetId, folderIds...}}`. Lookup O(1).
- **Fallback:** búsqueda por nombre en Drive si el registry está corrupto.
- Items del form se resetean y reconstruyen en cada corrida. Fuente de verdad: `ConfigForms.gs`.
- Correr dos veces no duplica nada.

## Limitaciones conocidas (documentadas como non-goal operativo)

- **`FormApp.addFileUploadItem()` no existe en Apps Script.** Los campos de archivo se convierten a texto con helpText "mandar por WhatsApp al grupo". Validado empíricamente en el piloto inicial.
- **Timeout 6 min.** Mitigación: orchestrator escribe en Properties después de cada paso → reentrante. Si falla a mitad, re-correr retoma sin duplicar.
- **OAuth first-run warning.** Mitigación: nota de prueba social.
- **Dropdowns no sync en vivo con Listas-Maestras.** Mitigación: menú custom "Actualizar listas" regenera items de todos los forms.

## Plan de construcción en 4 fases (fragmentación para mitigar timeout)

### Fase 0 — Scaffold
- Crear proyecto Apps Script container-bound al Sheet template
- Escribir manifest + clasp config
- Estructura de carpetas `src/` según arriba

### Fase 1 — Core sin UI
- Builders (Folder, Sheet, Form), Services (Idempotency, Properties, Logger), Utils
- Test con `runSmokeTests()` creando 1 form dummy

### Fase 2 — Config lectura desde Sheet
- `ConfigSheetBuilder.gs` crea/actualiza las pestañas del Sheet
- `ConfigRoot.gs` lee valores del Sheet (CFG dinámico, no hardcoded)
- Todos los dropdowns de los 14 forms leen de pestañas del Sheet

### Fase 3 — Orchestrator + WebApp
- `SetupOrchestrator.run()` completo con los 14 forms activables
- `WebApp.gs + Panel.html` que sirve el panel HTML
- `deployWebApp()` que publica como web app

### Fase 4 — Piloto
- La directora de la escuela piloto completa pestañas de config con sus datos reales
- Corre "Generar todo"
- Valida feedback con la directora y su equipo docente
- Ajustes emergentes se vuelcan al roadmap del repo

## Referencias externas que debe leer quien construya

- `README.md` del repo — tesis del proyecto + cómo arrancar.
- `docs/design/01-problema.md` — Paso 0: entender el problema.
- `docs/design/02-non-goals.md` — lo que NO se hace.
- `docs/Sheet-Template-Design.md` — especificación del Sheet que cada escuela copia.
- `apps-script/` — código del backend Apps Script.
