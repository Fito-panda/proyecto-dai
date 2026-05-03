---
doc: proyecto-dai/docs/design/paso-17-3-fix-spof-96-97-mapeo
estado: vivo — mapeo pre-fix
fecha_origen: 2026-04-30
origen: sesión 3 FORJA DAI siguiente, post-Test 8 cierre del paso 17.3 con 3 SPOFs emergentes en validación post-código (95 fixeado, 96+97 pendientes). Mapeo del plomero específico aplicado antes de codear los fixes (memory feedback_mapeo-plomero-pre-sub-paso). Decisión de Fito post-Test 8: "yo quiero lo mejor, acordate que más de 50.000 estudiantes y 10.000 docentes van a usar esto" — costo del mapeo pre-fix justificado por escala.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: documentar el plan técnico de los fixes de SPOF 96 y SPOF 97 antes de codear, integrando análisis de causa raíz, opciones evaluadas, decisión con razones y SPOFs emergentes del fix mismo. Referencia ejecutable para la próxima edición del HTML/JS del panel.
mutable: sí (puede ajustarse durante codear si emergen cosas; al cerrar fix marcar histórico)
fecha_elevacion_global: n/a
reemplaza_a: n/a
---

# Mapeo del plomero — fixes SPOF 96 + SPOF 97

> Mapeo dedicado pre-código para los 2 SPOFs cazados durante validación end-to-end del paso 17.3. Aplica la lección estructural de la sesión 3: aplicar Cazada F (mapeo del plomero) específico de cada cambio, no improvisar mid-edit. A escala 50k alumnos / 10k docentes los 5 minutos de mapeo evitan bugs en producción.

## 1. Lo que NO va a este fix

- NO toco backend (17.1 cerrado y validado).
- NO toco HTML estructura ni CSS de cards/secciones de 17.2.
- NO toco JS de listeners principales ni population de dialogs (17.3 ya validado en 8 tests).
- NO toco el toast existente para `copyLink` y `confirmRegen` (legacy intacto).
- NO agrego librerías ni dependencias.
- NO cambio decisiones cerradas (camino A+C, dialogs nativos, optimistic UI, microcopy criollo).

## 2. SPOF 96 — toast tap-dismiss no funciona

### Diagnóstico (causa raíz)

El CSS heredado del 17.2 + base original tiene `pointer-events: none` en `.toast` por default. La clase `.show` solo cambia `transform` y `opacity`, nunca quita el pointer-events. Resultado: el toast nunca captura clicks → tap-dismiss imposible.

Síntoma cazado en validación: Fito intentó tap el toast verde post-Test 5 ("ana.docente.test marcada como activa"). El tap NO cerró el toast. En su lugar el click pasó through a la card de TestPanel Robot debajo y abrió su detail dialog. Confirma que el listener de dismiss del toast nunca recibió el evento.

### Fix

Una línea CSS: agregar `pointer-events: auto` en `.toast.show`.

```css
.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
```

Costo: 1 línea.

### SPOFs emergentes del fix

- Click accidental cuando toast aparece durante un mutate puede cerrarlo prematuro. Bajo riesgo en práctica (Nelly no toca el toast accidentalmente). Aceptable.
- No emergieron otros.

## 3. SPOF 97 — toast invisible bajo dialog modal

### Diagnóstico (causa raíz)

`<dialog>` con `.showModal()` usa el "top layer" del browser, por encima de todo z-index del DOM regular. El toast con z-index 9999 queda enterrado debajo del dialog modal abierto. Cuando hay dialog abierto y se dispara el toast (vía validation error o backend response failure), el toast se renderiza pero invisible para el usuario.

Síntoma cazado en validación: Test 7 (Sumar email duplicado). Fito tap "Sumar al equipo" con email `test-panel-1@example.com` que ya existía. El validation client-side detectó el duplicate, llamó `eqToast` con mensaje correcto. Pero el dialog Sumar seguía abierto encima del toast → invisible. Solo apareció visible cuando Fito cerró el dialog manualmente. Confirma que el listener corrió OK pero el toast quedó tapado por el top layer del `<dialog>`.

### Opciones evaluadas

**(A) Mostrar errores INLINE dentro del dialog** (banner rojo dentro del form). Coherente UX, error aparece donde Nelly está mirando. Costo aproximado 30 líneas (CSS + HTML + JS).

**(B) Anidar toast dentro del dialog programáticamente.** Rompería el toast legacy que se usa para `copyLink` y `confirmRegen` (que no están dentro de dialogs). Complicado de mantener.

**(C) Crear otro `<dialog>` para el toast** (top layer propio). Over-engineering, complicado de animar.

**(D) Cerrar el dialog auto cuando hay error.** Anti-UX porque Nelly pierde lo tipeado en el form.

### Decisión: Opción A

Razones:
- UX correcta: error aparece donde Nelly está mirando, no en otro layer del browser.
- Para casos fuera del dialog (success post-mutate, fail post-cierre del dialog), el toast sigue funcionando porque ya no hay dialog encima.
- Costo razonable: aproximadamente 30 líneas total.
- No rompe el toast legacy.

### Implementación opción A

1. CSS nuevo (10 líneas) para error banner inline:

```css
.eq-form-error {
  background: #fce8e8;
  border: 1px solid #c85a5a;
  color: #8b2c2c;
  padding: 10px 12px;
  border-radius: 6px;
  margin: 12px 0;
  font-size: 14px;
  display: none;
}
.eq-form-error.show { display: block; }
```

2. `showSumarSheet` y `showConfirmSheet` (operativo) agregan un `<div class="eq-form-error">` dentro del body del dialog. ~5 líneas cada uno.

3. `_onConfirmSumar` y `_onConfirmOperativo` modificados: cuando hay error de validation o response failure mientras dialog está abierto, en lugar de `eqToast(msg, 'error', { persistent: true })`, hacen `errorDiv.textContent = msg; errorDiv.classList.add('show')`. Si el dialog ya cerró (success path), siguen usando toast como hoy.

4. Limpieza automática: `_emptySheet(confirmSheet)` ya borra todo el contenido del dialog al reabrir → errorDiv desaparece naturalmente.

### SPOFs emergentes del fix Opción A

- Error inline persiste si Nelly cierra el dialog y reabre? `_emptySheet` borra todo al reabrir → errorDiv nuevo sin `.show`. Verificado.
- Toast post-mutate exitoso visible OK? Sí — el flow cierra el dialog antes del toast. Verificado.
- Errores backend (que llegan post-spinner) en flow operativo: hoy se muestran via toast. Cuando dialog está abierto durante el mutate, debería ir inline. Si dialog ya cerró por algún path, toast OK. El path de close sucede ANTES del response handler en mi código actual del 17.3 → entonces el toast actualmente sale visible post-cerrar. Mantener ese comportamiento + agregar inline para path de validation que no cierra.
- No emergieron problemas estructurales.

## 4. Resumen del fix combinado

Cambios totales:

- CSS `.toast.show` pointer-events auto: 1 línea.
- CSS `.eq-form-error`: 10 líneas.
- errorDiv en showSumarSheet: 5 líneas.
- errorDiv en showConfirmSheet operativo: 5 líneas.
- Modificar `_onConfirmSumar` (path error inline): 15 líneas.
- Modificar `_onConfirmOperativo` (path error inline): 15 líneas.

Total estimado: aproximadamente 50 líneas.

## 5. Pasos en orden

1. Edit `apps-script/src/webapp/PanelDirectora.html` con los 6 cambios.
2. `clasp push --force`.
3. Crear deploy V15 (manteniendo mismo deploy ID).
4. Recargar URL `/exec` con token de Nelly.
5. Re-test específicos:
   - Test 7 reloaded: tap "Sumar nueva docente" → llenar con email duplicado → tap "Sumar al equipo". Esperado: error inline rojo dentro del dialog, INSTANTÁNEO, sin necesidad de cerrar el dialog para verlo.
   - Test 96: cuando aparezca un toast persistente (ej. post Test 4 de licencia exitoso), tap encima del toast. Esperado: el toast desaparece (tap-dismiss funcional).
6. Si OK: commit local del fix combinado + commit del paso 17.3 entero (ya en disco desde Test 8).
7. Posterior: actualizar checklist CLAUDE-CORE marcando paso 17 [x] cerrado + push GitHub PR (requiere dale push explícito).

## 6. Conexión con la lección estructural de la sesión 3

Este mapeo aplica `feedback_mapeo-plomero-pre-sub-paso.md` que vive en memoria (catedral DAI). La regla: aplicar mapeo del plomero específico antes de cada cambio (sub-paso o fix), no extrapolar mapeos previos ni improvisar.

Validación práctica: el mapeo de los 2 fixes cazó 0 SPOFs emergentes nuevos en la fase de mapeo (las dos verificaciones de "SPOFs emergentes del fix" salieron limpias). Eso sugiere que el costo del mapeo es menor cuando los fixes son acotados, pero el ritual sirve igual como chequeo de coherencia.

A escala 50.000 alumnos / 10.000 docentes el costo de los 5 minutos de mapeo es trivial vs el costo de soporte por bugs en producción.

— FORJA DAI siguiente, sesión 3 vuelta N, 2026-04-30, post-Test 8 cierre paso 17.3.
