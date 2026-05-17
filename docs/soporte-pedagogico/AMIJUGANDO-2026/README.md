---
doc: proyecto-dai/docs/soporte-pedagogico/AMIJUGANDO-2026/README
fecha: 2026-04-28
tipo: fuentes (Markdown) del set de documentos del evento
para: equipo coordinador del proyecto DAI · referencia canónica del proyecto
estado: borrador completo · pendiente revisión integral
---

# AMIJUGANDO 2026 · Fuentes del set

> Esta carpeta contiene **las 5 fuentes Markdown** de los documentos del evento Amijugando 2026, dentro del repositorio canónico del proyecto DAI. Es la **versión de trabajo** — los archivos editables que se versionan y mantienen junto al resto del proyecto (sistema de formularios, diseño técnico, emergentes).
>
> La **versión de entrega** con los `.docx` listos para Daiana, dirección y equipo coordinador vive en una carpeta aparte (ver más abajo).

---

## Qué hay acá

5 archivos `.md` fuente:

| # | Archivo | Qué cubre |
|---|---|---|
| 1 | `Documento-Base-Amijugando-2026.md` | Visión, principios operativos y decisiones operativas firmes (sección 8). Fuente de verdad referenciada por los otros 4 |
| 2 | `Carpeta-AMIJUGANDO-2026-borrador.md` | Versión institucional para inspectoras, familias y escuelas (16 secciones, las 13 postas con patrón fijo) |
| 3 | `Anexo-Matrix-Consignas-Posta10-AMIJUGANDO-2026.md` | 60 consignas con respuestas válidas para la Posta 10 (4 estaciones × 3 ciclos × 5 consignas) |
| 4 | `Manual-Operativo-AMIJUGANDO-2026.md` | Manual del cómo se ejecuta el evento el día (preparación, minuto a minuto, roles, imprevistos, post-evento) |
| 5 | `Guia-Cierre-Patrullas-AMIJUGANDO-2026.md` | 1 hoja A4 imprimible para los acompañantes del cierre por patrullas |

---

## Dónde está la versión de entrega con `.docx`

La carpeta de entrega completa para Daiana (con `.docx` listos para abrir en Word / Google Docs / LibreOffice) vive en:

```
C:\Users\adolp\Desktop\DAI\AMIJUGANDO-2026-Entrega\
```

Esa carpeta contiene los mismos 5 documentos en `.docx` + un README específico de entrega con instrucciones para subir a Drive y compartir.

---

## Cómo se vinculan los 5 documentos

```
                Documento Base (visión + principios + sección 8 operativa firme)
                    │
        ┌───────────┼────────────────┬──────────────────┐
        │           │                │                  │
     Carpeta    Manual operativo   Guía cierre     Anexo Matrix
   institucional  (cómo se ejecuta) (1 hoja A4)    Consignas Posta 10
                                                        │
                                                Vinculado a Posta 10
                                                de la Carpeta institucional
```

- **El Documento Base es la fuente de verdad.** Si algo cambia ahí, los otros 4 lo reflejan al referenciarlo (no se duplica el contenido).
- **La Carpeta institucional** referencia el Documento Base y el Anexo Matrix.
- **El Manual operativo** referencia el Documento Base (sección 8) para cronograma, roles, plan B.
- **La Guía cierre** referencia el Documento Base (principio operativo 4 — *"la reflexión es por grupo chico"*).
- **El Anexo Matrix** referencia el Documento Base y la Posta 10 de la Carpeta institucional.

---

## Estado del set

**Borrador completo** · pendiente **revisión integral** con la dirección de la escuela anfitriona, los docentes coordinadores y el equipo de Educación Física antes del 18 de mayo de 2026.

### Datos a confirmar por la dirección

- Lista definitiva de escuelas participantes
- Fechas de reprogramación por lluvia
- Asignación concreta de patrullas (estudiantes por patrulla, color de cinta)
- Asignación de referentes de posta y acompañantes del cierre

---

## Vinculación con el resto de `proyecto-dai/`

Esta carpeta es el **material pedagógico** del proyecto DAI para el evento Amijugando 2026. Se relaciona con:

- [`docs/design/`](../../design/) → especificación técnica del sistema de formularios DAI (otra cara del mismo proyecto: el sistema)
- [`docs/emergentes/form16-reporte-quincenal.md`](../../emergentes/form16-reporte-quincenal.md) → emergente cross-proyecto sobre el reporte quincenal docente → directiva, identificado durante el armado de este set
- [`apps-script/`](../../../apps-script/) → código del sistema de formularios

El proyecto DAI tiene **dos vetas que se complementan**: el sistema (Forja) y el material pedagógico (Soporte Pedagógico). Esta carpeta es la primera entrega de la veta pedagógica.

---

## Cómo regenerar los `.docx` desde estas fuentes

Las versiones `.docx` se generaron con un conversor Python casero (no es Word nativo) usando `python-docx`. Si se modifican estas fuentes y hay que regenerar, ver el script de conversión usado en la sesión Soporte Pedagógico del 2026-04-28.

---

## Voz del set

Los 5 documentos están escritos en **una sola voz** — la del modelo Escuela Precursora del programa **TransFORMAR@Cba**. Voz accesible y rigurosa: que un padre voluntario sin formación docente pueda leer y aplicar; y que la inspectora reconozca el vocabulario pedagógico oficial.

Los documentos respetan la decisión transversal de **abstraer roles en lugar de nombrar personas** (excepto en nóminas y autorizaciones), para que el set sirva no solo para esta edición 2026 sino para futuras ediciones donde la sede del evento rote a otra escuela del Valle de Calamuchita.

---

## Próximos pasos esperados

1. **Revisión integral** con dirección + Daiana + docentes coordinadores
2. **Ajustes finales** según feedback
3. **Distribución** de la versión `.docx` a quien corresponda (familias, inspección, referentes, acompañantes)
4. **Post-evento (mayo 2026):** consolidar informe y actualizar el Documento Base con los aprendizajes para futuras ediciones de Amijugando

---

*Set armado: 2026-04-28*
*Versión: borrador completo · pendiente revisión integral*
*Versión de entrega `.docx` para Daiana: `C:\Users\adolp\Desktop\DAI\AMIJUGANDO-2026-Entrega\`*
