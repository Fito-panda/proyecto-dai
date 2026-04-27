# 01 — Definición del problema

> Paso 0 del proceso de diseño: **entender el problema + research del landscape, antes de diseñar.**

## El problema en 3 frases

1. Las escuelas primarias rurales argentinas gestionan lo informal (planificaciones, actas, novedades, seguimiento de alumnos) con un **Word compartido en Google Drive** que se pisa entre docentes y pierde información.
2. Los sistemas oficiales (SGE Córdoba, SInIDE Nacional) cubren solo lo formal (matrícula, calificaciones) y son cerrados sin API pública.
3. Las soluciones edtech disponibles apuntan a colegios grandes con Google Workspace pago y no sirven para una escuela rural con Gmail gratis y celulares básicos.

## Usuarios reales (no tipos abstractos)

**Usuaria primaria:** la directora de la escuela piloto — cargo combinado de directora + docente titular del ciclo superior. Usa Gmail personal, celular, internet intermitente por ser zona serrana, no es programadora. Recibe inspección de supervisora de zona y tiene que mostrar evidencias de implementación del Proyecto Institucional Escolar (PIE).

**Usuarias secundarias:** el equipo docente completo — típicamente 7 a 10 docentes entre maestros titulares de grado y especialistas de Jornada Extendida (Inglés, Educación Física, Artística, etc.). Cada una con celular, algunas con cuenta Google, otras usando solo WhatsApp.

## El "trabajo a contratar" (JTBD)

No es "gestionar la escuela". Es: **ordenar el caos del Word compartido sin que las maestras tengan que aprender nada nuevo.**

Corolario: el producto tiene que sentirse como "un Google Form con una pestaña de contactos del grupo", no como "un sistema de gestión educativa".

## Research landscape resumido

### Los 5 datos que importan

1. **No hay competidor directo** para escuela rural con Gmail gratis. SGE (oficial Córdoba) cubre solo lo formal. Edtech pagas apuntan a colegios grandes. Word compartido + WhatsApp = la realidad actual. **Hueco real.**

2. **El warning "app no verificada" de Google** es la principal fricción técnica conocida. Tiene solución conocida (patrón Apps Script Library verificada), pero la verificación tarda 2-4 semanas. **Resuelto con nota de prueba social entre directoras** — canal de adopción boca a boca reemplaza sello de Google.

3. **Cuota dura de 6 minutos** por ejecución de Apps Script. Generar 11 forms + sheets + carpetas puede rozar el límite. **Mitigación:** fragmentar "Generar sistema" en 3-4 pasos visibles.

4. **SGE Córdoba no tiene API pública.** DAI vive **al lado**, no pretende integrarse ni reemplazar. Posicionamiento político: no compite con lo oficial del Ministerio.

5. **Mercado:** 969 escuelas primarias rurales en Córdoba + 2.600+ en Argentina. Sub-atendido. Ventana política abierta: programa "Escuela Precursora" hasta junio 2026.

### Gap del research sin cerrar

- Cuota específica de `FormApp.create()` en Gmail gratis (no documentada). **Se cierra con test empírico en la escuela piloto** — generar los 11 forms y medir tiempo + fallos.
