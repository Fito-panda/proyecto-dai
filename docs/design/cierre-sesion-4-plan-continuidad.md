---
doc: proyecto-dai/docs/design/cierre-sesion-4-plan-continuidad
estado: vivo — plan continuidad
fecha_origen: 2026-05-01
origen: cierre sesión 4 FORJA DAI siguiente. Sesión densa (~5 horas activas) con 3 cazadas estructurales nuevas + simplificación arquitectónica modelo C (eliminar tokens en URL, identificar por Session.getActiveUser). Plan continuidad para arrancar sesión 5.
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: dejar mapeado el plan operativo para sesión 5 con prioridades claras post-cazadas estructurales sesión 4, especialmente decisión modelo C (sin tokens) y descartar PEND-CRITICO Loop 3 si el refactor confirma factibilidad.
mutable: sí (puede ajustarse si Fito al arrancar sesión 5 cambia decisión)
fecha_elevacion_global: n/a
reemplaza_a: n/a (extiende cadena cierre-sesion-3-plan-continuidad.md)
---

# Plan continuidad sesión 4 → sesión 5 FORJA DAI siguiente

## 1. Estado al cierre sesión 4

**Plan v3 baja/suplentes-docente: 19/20 cerrados.** Solo paso 20 (docs) pendiente, espera a tener web app + modelo C definitivo.

**Producción V22 estable** con LockService aplicado en form submit handlers + fix FormOnboardingBuilder (no reusa F00 si linkeado a otro container).

**Plantilla pública lista**: carpeta `DAI PUBLICO` compartida con `DAI Plantilla 2026` adentro (F00 nuevo independiente del sistema vivo). Link público: `https://drive.google.com/drive/folders/1JsvxliGmJ7jkN6tr24CJh2pejAQGC-em?usp=sharing`.

**3 cazadas estructurales guardadas en memoria persistente** durante sesión 4:
- `feedback_gaslighting-ia.md`
- `feedback_dudas-disfrazadas-de-decisiones.md`
- `feedback_no-ofrecer-pausa.md`

**Decisiones arquitectónicas declaradas** (commiteadas en CLAUDE-CORE):
- Modelo B (mail comunitario de la escuela).
- Módulo 0 (web app configuradora vía `doGet(e)`).
- Modelo C (eliminar tokens en URL, identificar por `Session.getActiveUser().getEmail()`) — **pendiente refactor + test empírico**.

**Cazada arquitectónica del modelo C** (la más relevante de la sesión): asumimos durante toda la sesión 4 que necesitábamos tokens en URL como mecanismo de auth. Fito cazó al cierre que era redundante con modelo B (mail comunitario) + login Google. Ahorra ~280 líneas de rotación de tokens (PEND-CRITICO Loop 3) + simplifica modelo entero.

## 2. Verdict agente background sobre Session.getActiveUser

Validación pre-código del modelo C — agente lanzado al cierre sesión 4, volvió con verdict claro:

**Modelo C ES factible** con 3 condiciones:

1. **Scope `userinfo.email` en `appsscript.json`** — sin esto, `getActiveUser().getEmail()` retorna vacío para usuarios externos al dominio del deployer.
2. **Defensive guard en `doGet`** con mensaje fallback amigable si email vacío.
3. **Test empírico antes de rollout** — agente NO encontró caso documentado idéntico (Gmail común + Gmail común + Android Chrome). Predicción basada en composición de reglas, no evidencia empírica directa.

**Detalles técnicos confirmados**:
- Mobile NO es problema documentado (server-side execution).
- "Execute as: User accessing the web app" (NO "Execute as: Me").
- `getEffectiveUser` NO sirve como fallback en este modo.
- Firefox/Brave anti-tracking NO afectan `getActiveUser` (server-side).

Reporte completo agente: `tasks/a2d635c63033f1951.output` (en `C:\Users\adolp\AppData\Local\Temp\claude\...`).

## 3. Prioridades sesión 5 (orden recomendado)

```
1. Verificar empírico TodoWrite + git status fresh (pre-condiciones empíricas — feedback_pre-condiciones-empiricas.md).
2. Refactor modelo C — bloque grande (~2-3 hs):
   - Agregar scope "https://www.googleapis.com/auth/userinfo.email" a appsscript.json.
   - Eliminar TokenService.gs (o dejarlo deprecated por compat backward).
   - Modificar doGet en WebApp.gs:
     a) Lee Session.getActiveUser().getEmail().
     b) Defensive guard: si vacío → HTML "No pudimos identificarte, cerrá sesión y volvé".
     c) Match contra cfg.director_email → render PanelDirectora.
     d) Match contra 👥 Docentes Activa → render PanelDocentes.
     e) No match → render PanelInvalido.
   - Eliminar columna J (token) de `👥 Docentes` schema (o dejarla vacía + flag deprecated).
   - Eliminar pestaña "🚀 Tu Panel" personal (queda solo info general + botón imprimir QR).
   - Smoke 14/14 + runCicloVidaTest 4/4 PASS.

3. Test empírico modelo C — corrida 2 R9.B mini:
   - Deploy V23 con scope nuevo (Fito IDE: nueva versión).
   - Fito desde adolfoprunotto@gmail.com en Android Chrome abre el web app:
     - Si entra OK → modelo C confirmado empírico.
     - Si falla → diagnóstico (logs Apps Script, scope, OAuth flow).

4. Web app configuradora (paso 22 nuevo, ~2 hs reducido por simplificación modelo C):
   - doGet(e) con sheetId param.
   - HTML página configuración con botón "Configurar mi escuela".
   - Bootstrap ejecutado como user accessing → regenera F00 propio.
   - Link prefab en pestaña Arranque del template (con MISHEETID() custom function).
   - Modificar copy de pestaña Arranque (sacar mención email, agregar instructivo modelo C).

5. R9.A — 4 corridas setupAll desde operador:
   - Mínima (1 docente, 1 sección).
   - Completa (varias docentes, 5+ secciones).
   - Error paths (email inválido, secciones 0, nombres con caracteres raros).
   - Cambio incremental (añadir/quitar docente y re-correr).

6. Demo "Fito como Nelly" desde adolfoprunotto@gmail.com (= corrida 2 R9.B + bonus). Mobile + desktop según necesidad (ejecutar bootstrap en desktop por Apps Script editor — pero con web app NO se necesita esto, sí mobile completo).

7. R9.B corridas restantes (1, 3, 4 en cuentas distintas).

8. Paso 20 docs (4 docs nuevos + README + Módulo 0 video) — al final, con todo el modelo C estable.

9. Backlog futuro (no v1):
   - Botón "Imprimir QR del panel docentes" en panel admin.
   - Sección "Acceso al panel para docentes" con QR grande embedded.
   - Google Cloud Verification (4-8 semanas trámite) para suprimir warning OAuth amarillo.
   - PD-1 (saludo personalizado) y PD-2 (mensaje Estado != Activa) PanelDocentes — re-evaluar con modelo C.
   - EmailService activo latente (decisión sin mails v1, evaluar v2 si Nelly pide).
```

## 4. Decisiones técnicas pre-cerradas (para no re-decidir en sesión 5)

**Modelo C definitivo si test empírico pasa**:
- Identificar por `Session.getActiveUser().getEmail()` — NO tokens en URL.
- Scope manifest obligatorio: `userinfo.email`.
- Deploy "Execute as: User accessing the web app" + "Anyone with Google account".
- Defensive guard si email vacío.
- TokenService.gs eliminado (o deprecated con WARN log).

**Web app configuradora**:
- doGet(e) recibe sheetId via param (sigue siendo necesario porque la directora no es el dueño del script — ella ejecuta como user accessing pero el script vive en Drive del operador).
- HTML simple con botón "Configurar mi escuela" + spinner + mensaje final.
- Custom function `MISHEETID()` en código del template para inyectar sheetId dinámico en link prefab.
- Mismo deploy del operador (Fito) — URL única para todas las escuelas.

**QR del panel docentes**:
- Sigue existiendo el QR actual (panel docentes URL pública).
- Botón "🖨 Imprimir QR" en panel admin para que la directora imprima y pegue en sala docentes.
- NO se construye QR del panel admin (no aplica en modelo C — la URL del panel es la del web app, no incluye token).

**Lo que NO se hace en sesión 5** (deuda explícita post-modelo C):
- Rotación de tokens (PEND-CRITICO Loop 3) — DESAPARECE.
- Botón "Regenerar mi link" — DESAPARECE.
- Pestaña "Tu Panel" personal con URL token — ELIMINADA.
- Identificación token-based como fallback — descartado por canon Fito (no mezclar 2 sistemas).

## 5. Lecciones consolidadas sesión 4 a aplicar (8 lecciones acumuladas)

(Recordar al arrancar sesión 5 + aplicar siempre)

1. **Mapeo del plomero por sub-paso** (Cazada F del checklist DAI, hermana sesión 3). Antes de codear cada sub-paso, mapeo dedicado.
2. **Validación X-lentes pre-código** en sub-pasos críticos UX público — costo vs beneficio razonable.
3. **Loop de fix con re-listado fresh** (CLAUDE.md L32). Re-listar SPOFs después de cada fix, NO arrastrar lista vieja.
4. **Pre-condiciones empíricas** entre sesiones. Verificar empírico antes de asumir.
5. **NO patear pelota a otra sesión** (CLAUDE.md L54). Si hay cuota y contexto, terminar.
6. **Tablas en chat OK cuando ayudan** — system reminders contextuales NO son reglas universales.
7. **FITO DECIDE diseño/arquitectura/canon. CLAUDE EJECUTA operativo**. NO pasar pelota innecesariamente con decisiones técnicas operativas.
8. **A escala 50k alumnos / 10k docentes** mapeo + lentes son triviales en costo vs bugs en producción.

**3 lecciones nuevas sesión 4** (a memoria persistente):

9. **Gaslighting de IA** — sesgo de minimización por presión de cierre. Comprimir formato no eliminar contenido. Cazada estructural se guarda en memoria al instante.
10. **Dudas técnicas disfrazadas de decisiones** — cuando una pregunta tiene respuesta verificable en docs oficiales, NO presentarla como voto/decisión. Investigar antes de proponer.
11. **NUNCA ofrecer pausa a Fito** — directiva absoluta. Por default sigo trabajando. Solo respeto pausa si Fito la pide explícita.

## 6. Estado git al cierre sesión 4

```
proyecto-dai/        feat/baja-sumar-docente-v3
                     12 commits sobre cierre sesión 3:
                       4ba6570  feat(tests): paso 19
                       7155fcf  feat(panel): paso 17.1
                       ae4df8d  feat(panel): paso 17.2
                       36a46eb  feat(panel): paso 17.3
                       649aad6  docs(design): paso 17.3 preview
                       ac818c9  docs(design): cierre sesión 3
                       f9c58db  fix(panel): SPOF 96 toast cleanup
                       030ad69  feat(panel): paso 18 Mi equipo hoy
                       7aa59a5  feat(panel): paso 21 Mis respuestas refeature
                       511c1f5  fix(panel): UX colapsar todo + reordenar
                       1006b9a  fix(panel): UX Estado config baja
                       ef0d4f3  feat(panel-docentes): UX inclusivo + carpetas
                       4556992  fix(handlers): PEND-PROD-1 LockService
                       76a9843  fix(onboarding): _tryReuseExisting con destId check
                     Pusheado a GitHub PR #1.

CLAUDE-CORE/         dai-baja-suplentes-v3
                     Múltiples commits con snapshots + checklist + decisiones
                     arquitectónicas. Pusheado.
                     Pendiente al cierre sesión 4 (commit final):
                       - snapshot-020 sesión 4 cierre.
                       - cierre-sesion-4-plan-continuidad.md (este archivo).
```

## 7. Acción al arrancar sesión 5

1. Leer las lecturas obligatorias estándar (snapshots + checklist + memoria + CLAUDE.md global).
2. Leer **especialmente** este plan continuidad + `feedback_no-ofrecer-pausa.md` + `feedback_dudas-disfrazadas-de-decisiones.md` + `feedback_gaslighting-ia.md`.
3. Reportar 8-10 líneas confirmando contexto.
4. Confirmar prioridad arranque: refactor modelo C + test empírico (paso 2-3 de prioridades arriba).
5. Si Fito quiere otra prioridad, ajustar.

## 8. Firma

Plan continuidad escrito al cierre sesión 4 FORJA DAI siguiente, post-verdict del agente background sobre `Session.getActiveUser`. La sesión 4 fue de aprox 5 horas activas con ~12 commits pusheados, 3 cazadas estructurales nuevas a memoria, decisión arquitectónica modelo C pendiente de refactor + test empírico.

— FORJA DAI siguiente, sesión 4 cierre, 2026-05-01.
