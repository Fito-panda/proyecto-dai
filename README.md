# DAI · Dirección Asistida desde el Interior

**Sistema gratuito de formularios digitales para escuelas rurales argentinas.**

Un template de Google Sheet con Apps Script embebido. Cualquier escuela hace "Archivo → Crear una copia", completa 3 pestañas con sus datos, corre un menú, y tiene un sistema completo: 11 formularios digitales + estructura Drive + panel público para docentes, accesible desde cualquier celular.

Cero-programación. Cero-costo. Cero-Workspace-pago. Gmail personal alcanza.

---

## Empezar en 5 minutos

1. Abrir el Sheet template (pendiente de publicar — link se agrega acá cuando el primer release esté listo).
2. Archivo → Crear una copia.
3. Completar las pestañas `⚙️ Configuración`, `👥 Docentes`, `📚 Secciones`.
4. Menú `🌱 DAI → Generar todo por primera vez`.
5. Compartir el link del panel generado con el grupo WhatsApp de docentes.

---

## Qué hace exactamente

En una sola corrida, DAI genera en tu Google Drive:

- **11 Google Forms** cubriendo planificación, registro de clase, seguimiento de alumnos, evaluación, actas, novedades diarias, comunicados, autorizaciones para familias, pre-carga SGE, legajos.
- **Estructura de carpetas** organizada por año y tipo de material (8 carpetas numeradas).
- **Sheets de respuestas**, una por formulario, con las respuestas de los docentes cargándose automáticamente.
- **Panel HTML público** con un link que se comparte por WhatsApp — los docentes acceden desde el celular a todos los formularios.
- **Dashboard vacío** donde la directora pega fórmulas `IMPORTRANGE` para ver resúmenes.

Todo idempotente: correr "Generar todo" dos veces no duplica nada.

---

## Documentación

- [📐 Arquitectura](docs/design/03-arquitectura.md) — decisiones técnicas (container-bound, MIT, no verificación OAuth).
- [🎯 Problema](docs/design/01-problema.md) — qué resuelve DAI y por qué existe.
- [🚫 Non-goals](docs/design/02-non-goals.md) — qué NO hace (delimita el scope).
- [🌐 Landing WordPress](docs/design/04-landing-wordpress.md) — spec del sitio público.
- [📋 Sheet Template Design](docs/Sheet-Template-Design.md) — spec de las 8 pestañas del template que cada escuela copia.
- [⚙️ Apps Script](apps-script/README.md) — cómo desarrollar / desplegar el código.

---

## Stack

| Componente | Tecnología |
|---|---|
| Backend | Google Apps Script (V8) |
| Storage | Google Drive / Sheets / Forms |
| Panel público | HTML servido como Web App de Apps Script |
| Distribución | Google Sheet template público con script container-bound |
| CI/CD local | [clasp](https://github.com/google/clasp) |
| Landing | WordPress + Divi (separado de este repo) |

---

## Licencia

**[MIT](LICENSE).** Forkeá, adaptá, empaquetá como quieras. Si el equipo mantenedor original desaparece, el producto sigue funcionando (cada escuela tiene su copia) y cualquiera puede retomar el código. Incluso el Ministerio de Educación, si algún día quiere, puede tomar DAI y distribuirlo oficialmente.

---

## Contribuir

El repo es open source pero el proceso de contribución es informal (todavía). Si querés:

- **Reportar un bug** → abrí un issue con pasos para reproducir.
- **Proponer una mejora** → abrí un issue primero para discutir el scope.
- **Mandar un PR** → escribinos por mail/WhatsApp antes, para coordinar.
- **Usarlo en tu escuela** → no hace falta avisar, el template está para que lo copies. Si querés contar cómo te fue, nos interesa.
- **Empaquetarlo como Apps Script Library verificada por Google** → podés hacerlo sin pedir permiso (forkeá, publicá tu Library con verificación, distribuí el template que la use).

---

## Contexto

Diseñado en 2026 a partir del trabajo con una escuela rural de Córdoba, Argentina. Compatible con el PCI Córdoba 2026 por default, editable para otras provincias. El naming "Dirección Asistida desde el Interior" apunta al doble sentido de "interior": geográfico (el interior del país) e institucional (la asistencia emerge desde adentro de la escuela, no se impone desde arriba).

Landing pública: [proyectodai.com](https://proyectodai.com) — pendiente de publicación.
