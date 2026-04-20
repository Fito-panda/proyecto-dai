# 04 — Landing WordPress — `proyectodai.com`

**Ejecutor:** el equipo mantenedor arma la landing directamente en el theme Divi (no requiere proceso de build).
**Dominio:** `proyectodai.com`.
**Stack:** WordPress + Divi theme.

---

## Objetivo de la landing

**Convertir el tráfico en "escuelas que copian el template"**. No vender, no captar leads. El único CTA real es: *"copiá el template a tu Drive"*. Todo lo demás (FAQ, cómo funciona, testimonios) sirve para bajar el miedo y construir confianza hasta que hagan clic.

## Público objetivo (keep in mind)

- **Directoras de escuelas primarias rurales argentinas.**
- Usan WhatsApp todos los días, Google Forms ocasionalmente, Drive para un Word compartido.
- No son técnicas. Tienen celular + a veces PC prestada.
- Tono: **humano, cálido, cercano**. No corporate, no techy.
- Internet intermitente en muchos casos (zona serrana/rural): **la página tiene que cargar rápido y funcionar desde celular**.

---

## Estructura de páginas

| Página | URL | Prioridad | Objetivo |
|---|---|---|---|
| Home | `/` | 🔴 Crítica v1 | Entender qué es + CTA copiar |
| Cómo empezar | `/como-empezar` | 🔴 Crítica v1 | 7 pasos concretos con screenshots |
| Nota para directoras | `/nota-para-directoras` | 🔴 Crítica v1 | Bajar el miedo del warning de Google |
| Preguntas frecuentes | `/faq` | 🟡 Importante v1 | Responder las dudas típicas |
| Testimonios | `/testimonios` | 🟢 Futuro | Arranca vacío, crece con adopción |
| Para programadores | `/programadores` | 🟡 Importante v1 | Credibilidad técnica + link GitHub |
| Privacidad | `/privacidad` | 🔴 Crítica v1 | Legal, necesaria por OAuth |
| Contacto | `/contacto` | 🟡 Importante v1 | WhatsApp o mail del equipo mantenedor |

---

## HOME (`/`)

### Hero (above-the-fold)

```
[Imagen de fondo: foto cálida de una escuela rural o campo argentino al atardecer, opacidad baja para que el texto lea bien]

H1:  Tu escuela rural, organizada
     sin programador ni cuota mensual.

Subhead:
     Copiá el template, completalo con tus docentes,
     y tu sistema de formularios queda listo en 10 minutos.
     Gratis, tuyo, sin depender de nadie.

[Botón grande primario] → Copiá el template ahora
[Botón secundario]      → Cómo funciona en 2 minutos
```

**Nota:** el botón "Copiá el template" redirige al URL del Sheet en Drive con `/copy` al final (ejemplo: `https://docs.google.com/spreadsheets/d/XXXX/copy`). Hace que Google abra directamente el diálogo "Crear copia en tu Drive".

### Sección 2 — "Qué resuelve" (3 columnas con íconos)

**Título:** *El caos del Word compartido, resuelto.*

| Antes | Con DAI | Después |
|---|---|---|
| 📄 Word compartido que se pisa entre docentes | 📋 14 formularios con dropdowns centralizados | ✨ Todo ordenado, buscable, sin pérdidas |
| Actas en cuaderno que después hay que pasar | Registros que se guardan solos en una planilla | Reportes automáticos para supervisión |
| Planificaciones en WhatsApp que se pierden | Planilla por semana, todas en un lugar | Seguimiento real del PIE |

### Sección 3 — "Cómo funciona" (4 pasos con íconos grandes)

**Título:** *En 10 minutos tenés tu sistema andando.*

1. **📥 Copiás el template** — un click en tu Drive, sin instalar nada.
2. **✏️ Completás tus datos** — docentes, secciones, qué formularios querés activar. Todo desde una planilla.
3. **🌱 Apretás "Generar"** — el sistema crea tus formularios, carpetas y panel.
4. **📱 Compartís el link** — pegás el panel en el grupo WhatsApp de docentes y listo.

[Botón] → Ver los 7 pasos detallados

### Sección 4 — "Los 14 formularios" (grid visual)

**Título:** *14 formularios cubren todo el día a día de una escuela rural.*

Grid de 3 columnas, cada card con ícono + nombre + descripción corta:

- 📋 Planificación semanal
- 📝 Registro de clase
- 👤 Seguimiento de alumno
- ✅ Evaluación formativa
- 📃 Acta de reunión
- 🌱 Avance del PIE
- 🌅 Novedades diarias
- 📢 Comunicado
- ✍️ Autorización familia
- 💵 Caja cooperadora
- 📒 Acta cooperadora
- 🛒 Solicitud de compra
- 📤 Pre-carga SGE
- 🗂️ Legajo interno

Nota debajo: *"Activás solo los que tu escuela necesita. Si mañana tu escuela cambia, cambiás la config y listo."*

### Sección 5 — "Por qué es gratis y por qué siempre va a ser tuyo"

**Título:** *Sin servidor central. Sin cuota mensual. Sin lock-in.*

Texto corto (150-200 palabras):

> DAI corre 100% en tu Google Drive. Nada vive en un servidor externo que pueda caerse. Si mañana el equipo mantenedor original desaparece, tu sistema sigue funcionando porque tu copia es tuya.
>
> El código es **open source con licencia MIT** en GitHub. Cualquiera puede leerlo, mejorarlo, adaptarlo. Hasta el Ministerio de Educación, si algún día quiere, puede tomar DAI y distribuirlo oficialmente.
>
> ¿Por qué es gratis? Porque creemos que la gestión digital en una escuela rural es un derecho, no un producto.

[Botón secundario] → Ver el código en GitHub

### Sección 6 — Testimonios (vacío al principio)

**Título:** *Directoras que ya lo usan.*

Placeholder: *"Pronto acá testimonios de las primeras escuelas que adoptaron DAI."*

Cuando haya 3+ testimonios, arrancar con carrusel o grid de 3.

### Sección 7 — CTA final

```
¿Tu escuela sigue peleando con un Word compartido que se rompe?

[Botón grande primario] → Copiá el template ahora

(Es gratis. Es tuyo. No te pedimos mail.)
```

### Footer

- Link a todas las páginas
- Link al GitHub
- Mail de contacto
- Año

---

## CÓMO EMPEZAR (`/como-empezar`)

**Formato:** 7 pasos numerados en cards grandes, cada uno con screenshot + texto + GIF corto si se puede.

### Paso 1 — Copiá el template

- **Qué hacés:** click en el botón de abajo. Google te pregunta "¿Querés copiar este archivo a tu Drive?". Decís que sí.
- **Resultado:** tenés una planilla nueva en tu Drive.
- [Botón] → Copiá el template

### Paso 2 — Aceptá los permisos (una sola vez)

- **Qué hacés:** entrás al menú "🌱 DAI" arriba y le das "Generar todo por primera vez".
- **Qué vas a ver:** Google te va a pedir permisos para que el script cree carpetas y formularios en tu Drive. **Va a aparecer una pantalla que dice "esta app no está verificada". Es normal. Seguí los pasos de la [nota para directoras](/nota-para-directoras).**
- **Screenshot del warning + pasos exactos a clickear.**

### Paso 3 — Completá tus datos de escuela

- **Qué hacés:** entrás a la pestaña "⚙️ Configuración" y escribís nombre de tu escuela, año, dirección, email.

### Paso 4 — Cargá tus docentes

- **Qué hacés:** pestaña "👥 Docentes". Agregás una fila por cada docente: apellido, nombre, apodo, cargo, etc.
- **Tip:** si más adelante un docente se enferma, en la columna "Estado" lo marcás como "Licencia" y agregás un suplente. Los formularios se actualizan solos.

### Paso 5 — Cargá secciones y espacios curriculares

- **Qué hacés:** pestañas "📚 Secciones" y "📖 Espacios curriculares". Editás lo que viene por defecto para que coincida con tu escuela.

### Paso 6 — Elegí qué formularios activar

- **Qué hacés:** pestaña "✅ Formularios". Tildás los 14 que quieras. No hace falta activar todos — por ejemplo si no tenés cooperadora, desactivás esos 3.

### Paso 7 — Generá y compartí

- **Qué hacés:** menú "🌱 DAI → Generar todo". Esperás unos minutos. Al final aparece un link al panel.
- **Qué hacés con el link:** lo copiás y lo pegás en el grupo WhatsApp de tus docentes.
- Los docentes tocan los botones del panel, responden los formularios desde el celular, y las respuestas quedan en tu Drive organizadas.

---

## NOTA PARA DIRECTORAS (`/nota-para-directoras`)

**Esta es la página más importante. Convierte el warning de Google en confianza interpersonal.**

### Título
*Por qué aparece "esta app no está verificada" y por qué no es peligroso.*

### Contenido (texto en primera persona, tono directora-a-directora)

> Cuando corrés DAI por primera vez, Google te muestra una pantalla grande que dice *"Esta aplicación no está verificada"*. Abajo te ofrece volver atrás.
>
> **No cierres esa pantalla.** Esta nota te explica por qué aparece y qué hacer.
>
> ---
>
> ### Por qué aparece
>
> Google le pide a todo desarrollador de aplicaciones un trámite formal (papeles, política de privacidad, video explicativo, verificación de identidad) antes de "certificar" que la app es segura. Ese trámite tarda entre 2 y 4 semanas.
>
> DAI es un proyecto hecho por un equipo pequeño para escuelas rurales. Decidimos **no hacer ese trámite** porque lo que importa no es el sello de Google, sino la confianza entre directoras que ya lo usan.
>
> En lugar de pedirle permiso a Google, te pedimos permiso a vos: leé esta nota, y si confiás, seguí adelante.
>
> ---
>
> ### Qué hace DAI exactamente
>
> - Crea 14 formularios de Google en tu Drive (los que vos activaste).
> - Crea una carpeta "Escuela" con subcarpetas ordenadas por tipo de material.
> - Crea planillas donde se guardan las respuestas de los formularios.
>
> **No toca nada fuera de tu Drive.** No lee tu Gmail. No accede a nada tuyo que no sea DAI.
>
> ---
>
> ### Qué hacer cuando veas la pantalla del warning
>
> 1. **Click en "Avanzado"** (abajo a la izquierda del warning).
> 2. Click en **"Ir a [nombre del proyecto] (no seguro)"** — "no seguro" es solo porque Google no hizo el trámite, no porque haya algo malicioso.
> 3. Click en **"Permitir"** cuando te muestre la lista de permisos.
>
> Después de esto, **nunca más te va a aparecer el warning**. Queda autorizado en tu cuenta.
>
> ---
>
> ### ¿Y si preferís no confiar?
>
> Totalmente válido. Tenés dos opciones:
>
> 1. **Esperar a que una directora conocida te lo recomiende.** Si ya lo usan en otra escuela de tu zona, preguntale a esa directora.
> 2. **Mirar el código tú misma (o alguien técnico cercano).** DAI es [open source en GitHub](https://github.com/...). Cualquier programador lo puede leer y confirmar que no hace nada raro.
>
> ---
>
> ### Firmas
>
> *(A medida que más directoras adopten DAI, sumamos firmas acá. Hoy esta página arranca sin firmas — se llena con el primer caso validado.)*

### Botones al final

- [Botón primario] → Volver a copiar el template
- [Botón secundario] → Ver el código en GitHub

---

## FAQ (`/faq`)

### Preguntas y respuestas

**¿Cuánto cuesta?**
Nada. Es gratis para siempre. No hay cuota mensual, no hay "versión premium".

**¿Necesito saber de programación?**
No. Se maneja desde una planilla de Google. Si podés usar Google Forms, podés usar DAI.

**¿Qué pasa si se cae el servidor del equipo mantenedor?**
Nada. DAI no tiene servidor central. Tu copia corre 100% en tu Google Drive. Si el equipo original desaparece, tu sistema sigue andando.

**¿Puedo agregar o quitar docentes?**
Sí. Editás la pestaña "Docentes" del Sheet y le das al menú "🌱 DAI → Actualizar listas". Los formularios se actualizan con los cambios.

**¿Los datos de mis alumnos y docentes van a quedar en manos de alguien más?**
No. Todos los datos viven en tu Google Drive. Nadie los ve. Son tuyos.

**¿Funciona desde el celular?**
Los formularios sí — los docentes los responden desde el celular, es de hecho el uso principal. La configuración la hacés desde una PC o tablet porque es una planilla.

**¿Qué pasa en 2027 cuando empiece un año nuevo?**
Cambiás un número en la pestaña de configuración (`2026` → `2027`) y corrés "Generar" de nuevo. Se crea una carpeta nueva para 2027 sin tocar la de 2026.

**¿Puedo darme de baja?**
Sí. Borrás la carpeta DAI de tu Drive y listo. No te pedimos nada, no hay proceso, no hay formulario.

**¿Por qué dice "DAI"? ¿Qué significa?**
**D**irección **A**sistida desde el **I**nterior. *Interior geográfico* (para el interior del país, rural argentino) e *interior institucional* (la asistencia emerge desde adentro de la escuela, no se impone desde arriba).

**¿Puedo adaptarlo a mi escuela si es secundaria / urbana / distinta?**
v1 está pensado para primaria rural. Si querés adaptarlo, [el código es open source](https://github.com/...). Si nos escribís contando tu caso, vemos.

**Mi escuela quiere usarlo pero la directora no sabe computación. ¿Pueden ayudarnos a instalarlo?**
Sí, escribinos por [WhatsApp](/contacto).

---

## PARA PROGRAMADORES (`/programadores`)

Texto corto:

> DAI es open source con **licencia MIT**. El código vive en [github.com/...](https://github.com/...).
>
> La arquitectura: template de Google Sheet con Apps Script embebido (container-bound). Cada escuela copia el template y ejecuta localmente en su Drive — **sin servidor central**.
>
> Si querés empaquetarlo como Apps Script Library con verificación Google (para distribuir sin el warning "app no verificada"), podés hacerlo sin pedir permiso. Forkeá, publicá tu Library, distribuí el template modificado que la use.
>
> Issues, pull requests y forks son bienvenidos. No tenemos un process formal — si querés contribuir, escribinos primero por [mail/WhatsApp](/contacto) y coordinamos.

---

## PRIVACIDAD (`/privacidad`)

Texto legal mínimo:

> **DAI no recolecta ningún dato tuyo ni de tu escuela.**
>
> Todos los datos que se cargan en DAI (docentes, alumnos, respuestas de formularios) viven exclusivamente en el Google Drive de la escuela que usa el producto. Ni el equipo mantenedor ni ningún tercero tiene acceso a esos datos.
>
> Los permisos OAuth que DAI pide a Google Drive, Google Forms y Google Sheets **se usan únicamente para que el script pueda crear carpetas, formularios y planillas en tu propio Drive**. No se leen ni envían datos a ningún servidor externo.
>
> No usamos cookies de tracking en `proyectodai.com`. No tenemos Google Analytics ni pixel de Facebook.
>
> Si tenés dudas sobre qué permisos pide DAI, el código es open source y podés revisarlo en [GitHub](https://github.com/...).
>
> Contacto para cuestiones de privacidad: [mail del equipo mantenedor]

---

## CONTACTO (`/contacto`)

Formato simple:

> **¿Tenés dudas? ¿Querés que te ayudemos a instalarlo en tu escuela?**
>
> Escribinos:
> - WhatsApp: [número de contacto]
> - Email: [mail del equipo mantenedor]
>
> Respondemos rápido en horario de día.

---

## Notas visuales para Divi

- **Paleta:** tonos cálidos, tierra. Evitar azul tech-corporate. Sugerencia: verde tierra (`#2e7d6b`), crema (`#faf7f2`), gris oscuro (`#1a2332`) para texto.
- **Tipografía:** una serif para headlines (ej. Lora, Merriweather), sans legible para cuerpo (ej. Inter, Open Sans).
- **Fotos:** si usás stock, priorizar imágenes de escuelas rurales argentinas o latinoamericanas, no stock genérico USA. Rostros reales si conseguís permisos.
- **Íconos:** set consistente. Sugerencia: Phosphor Icons o Heroicons (ambos libres, ambos con estilo cálido disponible).
- **Mobile-first:** validar cada página en pantalla de celular antes de publicar. La directora probablemente la lea desde WhatsApp → clickea link → abre en mobile.

---

## Checklist pre-lanzamiento de la landing

- [ ] Dominio `proyectodai.com` apunta al hosting
- [ ] WordPress instalado + Divi activado
- [ ] 8 páginas creadas con contenido
- [ ] Link del "Copiá el template" apunta al Sheet template real (con `/copy` al final)
- [ ] Link al GitHub apunta al repo real (cuando esté creado)
- [ ] Probado desde celular y desktop
- [ ] SSL activo (HTTPS)
- [ ] SEO básico: title + meta description en cada página
- [ ] Favicon
- [ ] Política de privacidad publicada (URL para OAuth si algún día se verifica)

---

## Qué falta para completar esta especificación

- **Video de 2 minutos "Cómo funciona"** para el home. Se graba cuando el producto esté listo (screencast del flujo completo).
- **Screenshots del flujo** para la página `/como-empezar`. Se toman en la escuela piloto inicial.
- **Testimonios** reales. Arrancan vacíos, se suman cuando haya 3 escuelas adoptando.
- **Link real al Sheet template** — hasta que el producto tenga su primer release, el botón "Copiá el template" puede apuntar a una página de "Próximamente" o similar.
