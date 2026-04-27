# DAI — Apps Script backend

Apps Script que crea automáticamente **11 Google Forms + estructura de Drive + 11 Sheets destino + 1 Sheet de Listas Maestras + Dashboard** en la cuenta Google que lo corra.

---

## Qué hace

1. Busca (o crea) la carpeta `Escuela/` en My Drive.
2. Adentro crea `<AÑO>/` con 8 subcarpetas numeradas.
3. Crea `SHEET-Listas-Maestras` con alumnos, docentes, espacios curriculares, familias.
4. Crea 11 Google Forms, cada uno linkeado a su Sheet destino.
5. Publica un panel HTML como Web App y devuelve el link público.
6. Guarda un log de ejecución en la pestaña `📋 Estado del sistema` del Sheet de config.

Todo es **idempotente**: correr dos veces no duplica nada.

---

## Primer deploy (una sola vez)

### 1. Instalar Node.js y clasp

Windows — PowerShell:

```powershell
# Instalar Node (si no lo tenés)
winget install OpenJS.NodeJS.LTS

# Instalar clasp globalmente
npm install -g @google/clasp
```

Linux / macOS:

```bash
# Con tu gestor de paquetes preferido para Node LTS, después:
npm install -g @google/clasp
```

Verificar:
```bash
clasp --version
```

### 2. Loguearte a Google

```bash
clasp login
```

Se abre el navegador. Logueate con la cuenta donde querés que viva el proyecto.

### 3. Crear el proyecto Apps Script (container-bound al Sheet template)

Parado en `apps-script/`:

```bash
clasp create --type sheets --title "DAI - <nombre de tu escuela>"
```

Esto genera el Sheet template nuevo + proyecto Apps Script bound al Sheet, y graba el `scriptId` real en `.clasp.json` (gitignored).

> **Nota:** `clasp create` sobreescribe `appsscript.json`. Restaurá la versión del repo (`git checkout appsscript.json`) después de crear.

### 4. Subir el código

```bash
clasp push
```

### 5. Abrir el IDE

```bash
clasp open
```

Abre el proyecto en `script.google.com`. Ahí es donde corrés las funciones.

---

## Cómo correr `setupAll`

En el IDE de Apps Script:

1. En el selector de funciones (arriba), elegí `setupAll`.
2. Click **Run** (▶).
3. La primera vez te pide permisos. Aparece un warning scary "app no verificada":
   - Click **Avanzado**
   - Click **Ir a [nombre de tu proyecto] (no seguro)**
   - Click **Permitir**
4. Se ejecuta. En la consola (abajo) vas viendo el log en vivo.
5. Cuando termine, abrí tu Drive → `Escuela/<AÑO>/` → revisá que esté todo.

---

## Fases

`setupAll()` admite un parámetro de fase para crear solo un subconjunto:

- `setupAll()` o `setupAll('all')` — crea todo.
- `setupAll('arranque')` — solo Form 7 (Novedades) + Form 2 (Registro de clase).
- `setupAll('pedagogica')` — Forms 1, 2, 3, 4.
- `setupAll('institucional')` — Forms 5, 6, 7.
- `setupAll('admin')` — Forms 13, 14.
- `setupAll('comunicacion')` — Forms 8, 9.

Para cambiar la fase desde el IDE: el botón Run no admite args. Usá `runArranque`, `runPedagogica`, etc. (wrappers preconfigurados en `Main.gs`).

---

## Actualizar después de cambios en código

Editás un archivo local (ej. agregás un campo a un form). Después:

```bash
clasp push
```

Volvés al IDE y corrés `setupAll()` — los forms se actualizan sin duplicar.

---

## Refrescar Listas Maestras

Si la directora edita `SHEET-Listas-Maestras` (agrega un alumno, cambia un nombre), los dropdowns de los forms creados **no se actualizan solos**. Correr:

```
refreshListasMaestras()
```

desde el IDE. Regenera los dropdowns afectados.

---

## Estructura del código

```
apps-script/
├── appsscript.json              # manifest (timezone Argentina/Cordoba, scopes, runtime V8)
├── .clasp.json                  # generado por `clasp create` (gitignored)
├── .clasp.json.template         # plantilla sin scriptId real (versionada)
├── src/
│   ├── Main.gs                  # setupAll(), runArranque(), refreshListasMaestras(), ...
│   ├── config/
│   │   ├── ConfigRoot.gs        # CFG global (lee del Sheet de config)
│   │   ├── ConfigFolders.gs     # árbol de 8 carpetas
│   │   └── ConfigForms.gs       # los 11 forms (fuente única de verdad)
│   ├── builders/
│   │   ├── FolderBuilder.gs
│   │   ├── SheetBuilder.gs
│   │   ├── ListasMaestrasBuilder.gs
│   │   ├── ConfigSheetBuilder.gs  # construye las 8 pestañas del Sheet template
│   │   └── FormBuilder.gs         # builder genérico declarativo
│   ├── services/
│   │   ├── PropertiesRegistry.gs
│   │   ├── IdempotencyService.gs
│   │   ├── Logger.gs
│   │   └── PhaseFilter.gs
│   ├── orchestration/
│   │   └── SetupOrchestrator.gs
│   ├── webapp/
│   │   ├── WebApp.gs              # doGet() — rutea por ?role=admin (Fase 3a)
│   │   ├── PanelDirectora.html    # dashboard directora con links a sheets
│   │   └── PanelDocentes.html     # 14 botones mobile-first agrupados por fase
│   └── utils/
│       ├── Types.gs
│       └── Guard.gs
└── tests/
    └── SmokeTests.gs              # runSmokeTests(): crea 1 form dummy y lo borra
```

---

## Cómo agregar o modificar un form

Editar `src/config/ConfigForms.gs`. Cada form es un objeto en el array `FORMS_CFG`. Agregar/modificar items. Después:

```bash
clasp push
```

Y correr `setupAll()` en el IDE.

---

## Non-goals (lo que NO hace este sistema)

- No envía emails. Form 9 registra, no manda.
- No sincroniza con el SGE provincial.
- No tiene app móvil propia (se usa Google Forms nativo en celular).
- No maneja múltiples años simultáneos. Para 2027: cambiar `anio_lectivo` en la pestaña `⚙️ Configuración` del Sheet y correr `setupAll()`.
- No tiene alertas push (WhatsApp/Slack/SMS).

Para el detalle completo de non-goals, ver [`docs/design/02-non-goals.md`](../docs/design/02-non-goals.md).

---

## Troubleshooting

**"Authorization required"** → Correr cualquier función y aceptar los permisos.

**Timeout después de ~6 minutos** → Apps Script tiene ese límite. Correr por fase: `runArranque()` primero, después `runPedagogica()`, etc.

**"Form not found"** tras borrar algo manualmente → Correr `setupAll()` otra vez; detecta el hueco y recrea.

**Dropdowns con nombres viejos** → Editar `SHEET-Listas-Maestras`, después `refreshListasMaestras()`.

**El warning "app no verificada" asusta a la directora** → Mandarle la [nota para directoras](../docs/design/04-landing-wordpress.md#nota-para-directoras-nota-para-directoras) antes del primer uso.
