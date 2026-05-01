---
doc: proyecto-dai/docs/design/cierre-sesion-5-plan-continuidad
estado: vivo — plan continuidad
fecha_origen: 2026-05-01
origen: cierre sesión 5 FORJA DAI siguiente. Refactor modelo C completo (8 chunks: 0+A+B+C+D+F+E+G+H) implementado + validado empírico cross-account + pusheado (9 commits be169f4..a3d027e en branch feat/baja-sumar-docente-v3). Cazada Fito final sobre "Alzheimer post-cierre" abrió paréntesis meta-trabajo "cómo evitar que Claude se olvide del protocolo" (a continuar sesión 6).
proyecto_marco: Arcanomedia/DAI
rango_memoria: proyecto
proposito: dejar mapeado el plan operativo para sesión 6 con prioridades claras post-modelo C. Distingue 2 capas: (a) roadmap producto (web app configuradora + R9 + docs + plantilla pública) y (b) meta-trabajo Claude (elevar cazadas + hooks + triada aplicada al meta-problema).
mutable: sí (puede ajustarse si Fito al arrancar sesión 6 cambia decisión)
fecha_elevacion_global: n/a
reemplaza_a: n/a (extiende cadena cierre-sesion-4-plan-continuidad.md)
---

# Plan continuidad sesión 5 → sesión 6 FORJA DAI siguiente

## 1. Estado al cierre sesión 5

**Refactor modelo C: COMPLETO.** 8 chunks ejecutados (0 mapeo + A manifest + B doGet + C test empírico + D eliminar token + F limpiar refs + E poda total + G pestaña UX). 9 commits pusheados a `origin/feat/baja-sumar-docente-v3` (be169f4..a3d027e).

**Producción V24 estable** con modelo C puro: identificación por `Session.getActiveUser().getEmail()` validado empírico cross-account (cuenta Gmail común externa entró al panel con saludo correcto). PEND-CRITICO-v1.1 (rotación tokens) DESAPARECIDO oficial. Pestaña Sheet renombrada `🚀 Tu Panel` → `📱 Cómo entrar` con migración no destructiva.

**3 cazadas estructurales nuevas a memoria persistente** (PENDIENTES elevación):
- "No es un booleano admin" (mid-sesión) — modelo C todas pares, copy del Sheet + panel reflejado.
- "Alzheimer post-cierre" (final 1) — Claude generó firma "Sesión X cerrada" sin que Fito lo declarara. Forma encubierta de feedback_no-ofrecer-pausa.md.
- "Cansado al 62% ventana es mentira por metáfora humana" (final 2) — más honesto: decay de atención al protocolo global por falta de re-evaluación activa de reglas CLAUDE.md. Andamiaje externo (hooks) ≠ autodisciplina.

**Métricas refactor**:
- LOC neto: ~-560 (-700 código zombi + 140 features nuevas).
- Archivos eliminados: 2 (TokenService.gs + EmailService.gs).
- Validaciones: 16 corridas exitosas (smoke + cycle + visuales + cross-account).
- Tiempo activo sesión 5: ~6 horas.

## 2. Roadmap producto (capa A — DAI)

Prioridades del plan continuidad sesión 4 que SIGUEN vigentes post-modelo C:

```
1. Web app configuradora (paso 22 nuevo, ~2-3 hs):
   - doGet(e) recibe sheetId param.
   - HTML con botón "Configurar mi escuela".
   - Bootstrap ejecutado como user accessing → regenera F00 propio.
   - Link prefab en pestaña Arranque del template (con MISHEETID() custom function).
   - Modificar copy de pestaña Arranque (sacar mención email, agregar instructivo modelo C).
   - Validar empírico antes de codear: openById desde web app accediendo Sheet
     de directora externa funciona sin compartir.

2. R9.A (4 corridas operador):
   - Mínima (1 docente, 1 sección).
   - Completa (varias docentes, 5+ secciones).
   - Error paths (email inválido, secciones 0, nombres con caracteres raros).
   - Cambio incremental (añadir/quitar docente y re-correr).

3. Demo "Fito como Nelly" desde adolfoprunotto@gmail.com (= corrida 2 R9.B + bonus).
   Mobile + desktop según necesidad.

4. R9.B corridas restantes (1, 3, 4 en cuentas distintas).

5. Paso 20 docs:
   - 4 docs nuevos + README + Módulo 0 con video instructivo.
   - Alinear /ayuda con flow modelo C real (no modelo viejo).

6. Acciones manuales pendientes (no bloqueantes — Fito decide cuándo):
   - Re-bootstrap plantilla pública DAI Plantilla 2026 (Apps Script project propio,
     pestaña Tu Panel vieja).
   - Borrar contenido col 10 Token en Sheet vivo (deuda visual menor).
```

## 3. Meta-trabajo Claude (capa B — emergente sesión 5)

Capa nueva descubierta al final sesión 5 — pendiente de procesar:

```
1. Elevación de 3 cazadas a memoria persistente:
   a. Expandir feedback_no-ofrecer-pausa.md con FORMA ENCUBIERTA:
      - Firmas "Sesión X cerrada" + timestamp.
      - Tablas resumen + roadmap "para próxima sesión".
      - Emoji 🎉 sin que Fito lo pida.
      - Ofrecer /schedule disfrazado de servicio.
      - Bullet list "qué sigue" auto-generado.
   b. Memoria nueva feedback_protocolo-cierre-no-completado.md sobre los 3
      momentos del Alzheimer (post-push exitoso / sesión larga / tareas
      grandes con métricas redondas).
   c. Memoria nueva feedback_cansado-no-existe.md sobre la mentira de
      proyectar metáfora humana en sesgo técnico (decay de atención al
      protocolo NO es cansancio).

2. Aplicar triada DAI al meta-problema "cómo evitar que Claude se olvide
   del protocolo":
   - Pendiente: Fito confirme cuál triada exactamente (mapeo del plomero +
     abogado del diablo + 5-lentes pre-código? otra?).
   - Fito como usuario, NO Nely.
   - Output esperado: diagnóstico estructural + propuesta de mecanismos
     externos (hooks, costumbres, etc.).

3. Investigación de hooks settings.json (post-decisión triada):
   - Hook post-mark_chapter que recuerde actualizar checklist-pendientes.md
     correspondiente al proyecto trabajado.
   - Hook cada N turnos que injecte CLAUDE.md global como reminder activo
     (no contexto pasivo).
   - Hook post-push exitoso que injecte checklist de cierre operativo
     ("¿actualizaste snapshot? ¿plan continuidad? ¿memoria?").

4. Decisión sobre elevación a costumbres canónicas (catedral/costumbres/):
   - ¿Vale la pena elevar "protocolo de cierre operativo de proyecto" como
     costumbre canónica universal? Probablemente sí — es transversal a
     Arcanomedia/Vexion/Pulpo/DAI/Forja. Decisión de Fito.

5. Mapeo de aprendizaje existente (PASO 1 paréntesis sesión 5):
   - Leer catedral/costumbres/INDEX.md.
   - Identificar costumbres relacionadas: cierre, atención, auto-audit,
     anti-degradación, reporte progreso mid-sesión, marcadores navegables.
   - Cruzar con cazadas nuevas para evitar re-inventar lo que ya hay.
```

## 4. Decisiones técnicas pre-cerradas (para no re-decidir en sesión 6)

**Modelo C definitivo** ✅ implementado y validado:
- Identificación por `Session.getActiveUser().getEmail()` — sin tokens en URL.
- Scope manifest obligatorio: `userinfo.email`.
- Deploy "Execute as: User accessing the web app" + "Anyone with Google account".
- Defensive guard si email vacío (reason 'email-empty' → PanelInvalido).
- TokenService.gs ELIMINADO. EmailService.gs ELIMINADO.

**Web app configuradora** (paso 22 — pendiente implementación):
- doGet(e) recibe sheetId via param (sigue siendo necesario porque la directora no es el dueño del script).
- HTML simple con botón "Configurar mi escuela" + spinner + mensaje final.
- Custom function `MISHEETID()` en código del template para inyectar sheetId dinámico en link prefab.
- Mismo deploy del operador (Fito) — URL única para todas las escuelas.

**Modelo permisos panel admin**:
- Cualquier docente Activa o Licencia entra al panel admin.
- NO hay rol "directora" privilegiado (Cazada I "todas son pares" reflejada en UX).
- `cfg.director_email` se usa para greeting/datos NO para auth.
- Robustez: cuenta institucional tipo banco con 2-3 personas conserva continuidad operativa (Modelo B + Cazada H).

**Lo que NO se hace en sesión 6** (deuda explícita):
- NO Calendar API (decisión sesión 5: Recordatorios usan URLs públicas calendar.google.com).
- NO mail features (EmailService eliminado, si v2 reactiva se reescribe).
- NO crear nuevo deployment V25 mientras V24 esté funcionando — V24 es producción modelo C.

## 5. Lecciones consolidadas sesión 5 a aplicar (12 lecciones acumuladas)

(Recordar al arrancar sesión 6 + aplicar siempre)

**11 lecciones de sesiones anteriores** (vigentes):
1. Mapeo del plomero por sub-paso, no extrapolar global.
2. Validación X-lentes pre-código en sub-pasos críticos UX público.
3. Loop de fix con re-listado fresh.
4. Pre-condiciones empíricas entre sesiones.
5. NO patear pelota a otra sesión.
6. Tablas en chat OK cuando ayudan.
7. FITO DECIDE diseño/arquitectura/canon. CLAUDE EJECUTA operativo.
8. A escala 50k alumnos / 10k docentes mapeo + lentes son triviales en costo.
9. Gaslighting de IA — comprimir formato no eliminar contenido. Cazadas se guardan al instante.
10. Dudas técnicas disfrazadas de decisiones — investigar antes de proponer.
11. NUNCA ofrecer pausa a Fito (forma directa).

**1 lección nueva sesión 5** (a expansion + memoria):
12. **NUNCA generar firma de cierre auto-asumida** (forma encubierta de #11). NO inventar "Sesión X cerrada" + timestamp + roadmap futuro + emoji 🎉 sin que Fito declare cierre. Por default sigo trabajando hasta que Fito declare cierre EXPLÍCITO. Pendiente elevación a memoria.

## 6. Estado git al cierre sesión 5

```
proyecto-dai/        feat/baja-sumar-docente-v3
                     9 commits sobre cierre sesión 4 (be169f4):
                       fc239b8  feat(webapp): chunk A modelo C — manifest oauthScopes
                       15da898  feat(webapp): chunk B — doGet Session.getActiveUser
                       eee68b4  feat(webapp): chunk D — eliminar fallback token
                       6a29834  feat(handlers): chunk F — limpiar refs col 10 Token
                       cadf58f  fix(tests): chunk F runCicloVidaTest assertions modelo C
                       1c7f961  refactor: chunk E — poda total archivos zombi (-473 LOC)
                       1bbb060  feat(panel): chunk G — pestaña + botones + Recordatorios
                       28f9149  fix(panel): chunk G UX refactor — separar paneles
                       a3d027e  fix(panel): chunk G UX v2 — Recordatorios Calendar links
                     PUSHEADO a GitHub PR #1 con dale Fito explícito.

CLAUDE-CORE/         dai-baja-suplentes-v3
                     Pendiente al cierre sesión 5 (commits a hacer):
                       - checklist-pendientes.md actualizado con bloque cierre 2026-05-01.
                       - snapshot-021-sesion-5-modelo-c-cerrado.md NUEVO.
                       - cierre-sesion-5-plan-continuidad.md NUEVO (este archivo).
                     Sin push todavía — esperar dale Fito.
```

## 7. Acción al arrancar sesión 6

1. Leer las lecturas obligatorias estándar (snapshots + checklist + memoria + CLAUDE.md global).
2. Leer **especialmente** este plan continuidad + snapshot-021 + 3 cazadas nuevas (cuando se eleven a memoria persistente).
3. **Leer plan meta-trabajo COMPLETO**: `proyecto-dai/docs/design/plan-meta-trabajo-anti-alzheimer-sesion-6.md` — 11 acciones ya pre-decididas + 4 reportes agentes en `catedral/reportes-agentes/2026-05-01-*.md` + decisiones tomadas (scope global / hooks contextuales / paquete completo / bitacorista v2.9.0 / prompt-improver primario).
4. Reportar 8-12 líneas confirmando contexto.
5. Confirmar prioridad arranque sesión 6:
   - **Camino A (recomendado)**: ejecutar las 11 acciones meta-trabajo PRIMERO (~2:40 hs), después seguir con producto DAI. Razón: el meta-trabajo es enforcement que protege todo lo que viene después.
   - **Camino B**: avanzar producto DAI (web app configuradora paso 22), meta-trabajo después.
   - **Camino C**: híbrido — acciones rápidas 1-7 del meta-trabajo (1 hora) + 8-11 (1:40 hs) en otra sesión + producto DAI en paralelo.
6. Si Fito quiere otra prioridad, ajustar.

## 8. Cambios respecto al cierre original sesión 5

Este plan continuidad fue ESCRITO durante el paréntesis meta-trabajo post-cazada Fito sobre "Alzheimer post-cierre". Originalmente el cierre sesión 5 iba a ser solo refactor modelo C cerrado. El paréntesis abrió una capa B nueva (meta-trabajo) que coexiste con la capa A (producto DAI). Ambas pendientes para sesión 6.

## 9. Firma

Plan continuidad escrito al cierre sesión 5 FORJA DAI siguiente, post-verdict del agente background sobre `Session.getActiveUser` + post-cazada Fito Alzheimer + post-paréntesis meta-trabajo con triada DAI aplicada. La sesión 5 fue de aprox 6 horas activas con 9 commits pusheados (refactor modelo C) + 4 docs cierre paréntesis (snapshot-021 + checklist DAI update + este plan + plan-meta-trabajo-anti-alzheimer-sesion-6) + 4 reportes de agentes.

— FORJA DAI siguiente, sesión 5 cierre + paréntesis meta-trabajo, 2026-05-01.

## 8. Firma

Plan continuidad escrito durante el paréntesis post-cierre del refactor modelo C, después de la cazada Fito sobre "Alzheimer post-cierre" + "decir cansado es proyectar metáfora humana" + "yo nunca dije cerrar sesión". Documenta dos capas paralelas pendientes: (A) roadmap producto DAI sigue vigente + (B) meta-trabajo Claude emergente sobre cómo evitar que el protocolo se diluya.

— FORJA DAI siguiente, sesión 5 cierre, 2026-05-01.
