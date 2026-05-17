---
doc: proyecto-dai/docs/emergentes/form16-reporte-quincenal
fecha_origen: 2026-04-28
origen: sesión "Soporte Pedagógico" (carpeta legacy Desktop/DAI/)
destino: sesión Forja-DAI — para procesar en este proyecto
estado: hallazgo — NO ejecutado
mutable: sí (Forja decide aceptar / rechazar / ajustar)
prioridad: media — no bloquea el deploy actual del producto
ref_mapa_origen: C:/Users/adolp/Desktop/DAI/Soporte-Pedagogico-MAPA-2026-04-28.md
---

# 🟡 Emergente — Form 16: Reporte Quincenal Docente → Directiva

> **Para la sesión Forja-DAI.** Esto es un hallazgo cruzado de la sesión paralela "Soporte Pedagógico" mientras trabajaba con Daiana en material pedagógico real. Lo dejo asentado para que Forja lo evalúe — **no se ejecutó nada del lado del código**.

---

## 1. Contexto del hallazgo

Mientras armaba un reporte quincenal real para que Daiana le pase a Nelly información de cómo está el grupo desde Educación Física (cada 15 días), revisé los 14 forms vigentes en `proyecto-dai/apps-script/src/config/ConfigForms.gs` para ver si el caso de uso ya estaba cubierto.

**Resultado: NO está cubierto. Hay un gap entre F03 (alumno individual) y F06 (macro PIE).**

## 2. El caso de uso real (Daiana → Nelly)

Daiana (docente Ed. Física) tiene que reportarle a Nelly (directora) **cada 15 días** sobre cómo está el grupo desde su área. Información que tiene que mandar:

- Cómo participan los estudiantes (engagement, dificultades de enganche)
- Cómo están en lo motriz (coordinación, movimientos, avances)
- Cómo se relacionan (respeto de normas, trabajo en equipo)
- Qué actitudes tienen (interés, predisposición, autonomía)
- Casos puntuales (quiénes necesitan más acompañamiento, quiénes se destacan)
- Qué está haciendo Daiana para ayudarlos
- Avances o dificultades del período
- Frecuencia: **quincenal**
- Interlocutor: **directora** (interno), no inspección externa

**Y este caso de uso NO es exclusivo de Daiana — es transversal a todos los docentes de todas las áreas.** Es la lógica del nuevo modelo Escuela Precursora donde el liderazgo es distribuido y la directora necesita visibilidad continua del grupo desde cada área.

## 3. Cobertura actual de los 14 forms (revisión)

| Form | Cubre | ¿Cubre este caso? |
|---|---|---|
| F01 Planificación | Plan a futuro | ❌ es input, no reporte |
| F02 Registro de clase | Una clase puntual | ❌ granularidad clase, no período |
| F03 Seguimiento alumno | **Un alumno** individual | ❌ granularidad alumno, no grupo |
| F04 Evaluación formativa | Cierre de unidad | ❌ granularidad unidad, no período fijo |
| F05 Acta de reunión | Reunión | ❌ input distinto |
| F06 Avance del PIE | Mensual o etapa, **macro institucional** | ⚠️ cerca pero no — es PIE, no por área/grupo |
| F07 Novedades diarias | Día a día | ❌ granularidad día |
| F08-F09 Comunicados | Familias | ❌ otro interlocutor |
| F10-F12 Cooperadora | Plata | ❌ |
| F13 Pre-carga SGE | Trámite | ❌ |
| F14 Legajo interno | Alumno | ❌ |
| F15 (propuesto) Evidencia Supervisión | **Supervisora externa** | ⚠️ cerca pero distinto interlocutor |

## 4. Propuesta de Form 16 (a discutir con Fito)

### Naming sugerido

`Reporte Quincenal Docente → Directiva` o `Estado del Grupo por Área`.

### Granularidad

**Una entrada = un docente × una sección × un período de 15 días.** Si Daiana da Ed. Física en las 3 secciones, llena 3 entradas (una por cada sección) cada 15 días.

### Campos sugeridos

| Campo | Tipo | Notas |
|---|---|---|
| Fecha de reporte | DATE | requerido |
| Docente que reporta | DROPDOWN | choicesFromList: docentes |
| Período reportado (desde) | DATE | requerido |
| Período reportado (hasta) | DATE | requerido — default +14 días |
| Sección | DROPDOWN | choicesFromList: secciones — una sola por entrada |
| Área / Espacio curricular | DROPDOWN | choicesFromList: espacios — el área del docente que reporta |
| Modalidad | DROPDOWN | curricular / pareja pedagógica / tutoría / proyecto institucional |
| Pareja pedagógica (si aplica) | DROPDOWN | choicesFromList: docentes_plus_sin |
| Participación general del grupo | DROPDOWN | Excelente / Buena / Regular / Necesita acompañamiento |
| Avances motrices/cognitivos del grupo | PARAGRAPH | requerido — texto libre |
| Vínculos y trabajo en equipo | PARAGRAPH | requerido |
| Actitudes (interés, autonomía, predisposición) | PARAGRAPH | requerido |
| Estudiantes destacados (positivamente) | SHORT_TEXT | nombres separados por coma |
| Estudiantes que necesitan más acompañamiento | SHORT_TEXT | nombres + por qué (breve) |
| Acciones que está implementando el docente | PARAGRAPH | requerido |
| Dificultades observadas | PARAGRAPH | opcional |
| Vinculación con objetivo del PIE | DROPDOWN | los 4 objetivos del PIE |
| Pedido / consulta a la directora | PARAGRAPH | opcional — para escalamiento |
| Adjunto (foto/video) | SHORT_TEXT | "mandar por WhatsApp al grupo" — limitación FormApp |

### Destino

- Sheet: `SHEET-Reportes-Quincenales-2026` en `06-Sheets-Maestros/`
- Carpeta: `02-Gestion-Institucional/Reportes-Quincenales/`

### Trigger automático sugerido

Al completar un reporte: se podría enviar email automático a la directora con el resumen (usando `EmailService.gs` que ya existe). **Decisión de Fito.**

## 5. Por qué este Form NO se solapa con los existentes

| Form | Diferencia con F16 |
|---|---|
| F03 | F03 es por alumno individual; F16 es por grupo/sección entera |
| F06 | F06 es macro PIE institucional; F16 es por área/grupo |
| F15 propuesto | F15 es para inspección externa; F16 es para directora interna, frecuencia fija |
| F02 | F02 es una clase; F16 consolida 15 días |

## 6. Implicancia para el modelo Escuela Precursora

El Form 16 **materializa el eje "Liderazgo distribuido"** del modelo: la directora deja de depender de pasillo y reuniones casuales para tener visibilidad continua del grupo desde cada área. Es **un mecanismo de feedback regular del claustro hacia la conducción**, alineado con el "Nuevo Perfil Docente Innovador" del modelo.

## 7. Lo que NO se decidió (queda para Forja + Fito)

- ¿Es Form nuevo (F16) o se extiende F06? *(recomiendo nuevo — distinto interlocutor, distinta frecuencia)*
- ¿Cuándo entra al sistema? *(¿v1 inicial o v2 después del piloto?)*
- ¿Trigger de email a directora automático o manual?
- ¿Naming definitivo?

## 8. Cómo procesar este emergente desde Forja-DAI

1. Leer este archivo en sesión Forja.
2. Validar con Fito si entra al alcance del producto.
3. Si entra: agregar a `Checklist-Sistema-Formularios-Modulos.md` como **Módulo 7 — Form 16**.
4. Si no entra: archivar este emergente con motivo del rechazo.
5. Actualizar este `.md` con el estado final.

---

*Emergente registrado: 2026-04-28 — sesión Soporte Pedagógico*
*Movido a `proyecto-dai/docs/emergentes/` el 2026-04-28 (antes estaba en `Desktop/DAI/`, lugar incorrecto)*
*Pendiente de revisión: sesión Forja-DAI*
