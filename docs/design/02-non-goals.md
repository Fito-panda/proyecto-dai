# 02 — Non-goals definitivos

> **Define what you won't do. No non-goals = scope creep.**

## Lo que DAI NO hace (v1)

### Arquitectura / distribución

- ❌ **No multi-tenancy centralizado.** Cada escuela es dueña de su copia 100%. No hay "instancia central" ni panel admin que vea a todas las escuelas.
- ❌ **No soporte para Google Workspace pago.** Target explícito = Gmail personal gratuito.
- ❌ **No backend propio.** Todo corre sobre infra de Google (Drive + Apps Script). Cero servidor propio.
- ❌ **No app móvil nativa.** Panel HTML mobile-first + Google Forms nativo. Se accede desde el navegador del celular.

### Funcionalidad

- ❌ **No integración con SGE ni SInIDE.** SGE es cerrado y no tiene API pública. DAI vive al lado, no reemplaza lo oficial.
- ❌ **No soporte para nivel secundario.** Solo primaria rural.
- ❌ **No multi-idioma.** Solo español argentino rioplatense.
- ❌ **No analytics ni dashboards ejecutivos.** El "dashboard de la directora" es un Google Sheet con fórmulas `IMPORTRANGE` que ella pega a mano — no producto.
- ❌ **No creación de forms custom desde la directora en v1.** El producto trae 11 forms base; la escuela activa/desactiva en config, pero no crea forms propios. Queda para futuro si emerge demanda real.
- ❌ **No histórico con audit log.** Quién-cambió-qué-cuándo no se registra. Versionado light con columnas `Estado / Desde / Hasta` en pestaña Docentes, sin log de cambios.
- ❌ **No envío automático de emails.** Form 9 (Comunicado) registra el comunicado en Sheet; quien lo manda por WhatsApp/email es un humano.
- ❌ **No alertas push** (Slack/WhatsApp/SMS). Las alertas se resuelven con formato condicional en Sheet.

### Proceso / delivery

- ❌ **No verificación con Google** del OAuth Consent Screen. Se resuelve con nota de prueba social entre directoras. La verificación se evalúa solo si el volumen de adopción lo justifica.
- ❌ **No soporte estilo SaaS.** Si una escuela tiene un problema, se resuelve por el canal de quien se lo pasó (otra directora) o por contacto directo via WhatsApp. No hay ticketing ni SLA.
- ❌ **No deploy centralizado de actualizaciones.** Cada escuela tiene su copia independiente. Si sale una versión nueva del Template, cada escuela decide si re-copia (el contenido de sus respuestas históricas se preserva).

### Mantenimiento

- ❌ **No versionado más allá del año lectivo.** El Sheet de config tiene `CFG.YEAR`. Al pasar a 2027, se re-ejecuta "Generar sistema" con año nuevo y se crea carpeta paralela. Los datos de 2026 quedan como archivo, no se migran automáticamente.

## Lo que sí hace (reafirmación del scope v1)

- ✅ 11 forms estructurados cubriendo: pedagógica (4), institucional (3), comunicación (2), administración (2). (Cooperadora queda como código dormido para forks que la reactiven — la maneja la comisión de padres por afuera del sistema.)
- ✅ Pestañas de config editables por la directora: docentes (con estado Activo/Licencia/Suplente/Baja), secciones, espacios curriculares, modalidades, activación de forms.
- ✅ Panel HTML público con URLs de los forms para compartir por WhatsApp.
- ✅ Estructura de carpetas Drive organizada por año.
- ✅ Idempotencia: correr "Generar" dos veces no duplica nada.
- ✅ Código open source en GitHub con licencia MIT.
- ✅ Puerta abierta a empaquetamiento como Apps Script Library verificada por terceros (gobierno, ONG) sin intervención del equipo mantenedor original.

## Revisión de non-goals

Este documento se revisa cuando:
- El equipo mantenedor propone explícitamente cambiar scope.
- Aparece evidencia de que un non-goal era "simplification disguise".
- Una escuela piloto reporta necesidad bloqueante de algo en la lista de NO.
