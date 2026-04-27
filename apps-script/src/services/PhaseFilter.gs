/**
 * PhaseFilter.gs — filtra FORMS_CFG por fase + flags contextuales del onboarding.
 *
 * 'all' devuelve todo. Otras fases matchean cfg.phase.
 * 'arranque' es un conjunto explicito (F07 + F02) para quitar el dolor del Word compartido.
 *
 * R1 2026-04-21 (fix B3 = deuda D7): acepta un 2º parámetro `onboardingFlags`
 * con booleans que modulan el resultado.
 *
 * 2026-04-26 — cooperadora invisible por default (decisión de scope: la maneja
 * la comisión de padres por afuera del sistema, no la directora):
 *   - onboardingFlags.cooperadora_activa !== true → omite forms phase='cooperadora'
 *     (F10, F11, F12). Default = omitir. Solo se crean si caller pasa el flag
 *     explícitamente como `true` (vía edición de código por un programador que
 *     reactive cooperadora en su fork MIT).
 *
 * Extensible: futuros flags pueden agregarse acá (ej. pei_activo → omitir F06).
 */

const PhaseFilter = {

  /**
   * filter(formsCfg, phase, onboardingFlags) — retorna array filtrado.
   *
   * Params:
   *   formsCfg:         array de cfgs a filtrar (típicamente FORMS_CFG).
   *   phase:            string 'all' | 'arranque' | 'pedagogica' | ... (default 'all').
   *   onboardingFlags:  objeto opcional con booleans. Shape actual:
   *                     { cooperadora_activa: boolean }
   *                     (extensible a futuros flags — ver tabla arriba).
   *
   * Retorna: nuevo array, no muta el input.
   */
  filter(formsCfg, phase, onboardingFlags) {
    phase = phase || PHASES.ALL;
    onboardingFlags = onboardingFlags || {};

    // Paso 1: filtrar por fase (lógica legacy).
    let filtered;
    if (phase === PHASES.ALL) {
      filtered = formsCfg.slice();
    } else if (phase === PHASES.ARRANQUE) {
      const arranqueIds = ['F07', 'F02'];
      filtered = formsCfg.filter(function(c) { return arranqueIds.indexOf(c.id) !== -1; });
    } else {
      filtered = formsCfg.filter(function(c) { return c.phase === phase; });
    }

    // Paso 2: filtrado contextual por flags del onboarding (R1 fix B3).
    // 2026-04-26: cooperadora invisible por default. Solo se crea si el flag
    // viene explícitamente como true. undefined/null/false/cualquier-otra-cosa → omite.
    if (onboardingFlags.cooperadora_activa !== true) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(function(c) { return c.phase !== 'cooperadora'; });
      const removed = beforeCount - filtered.length;
      if (removed > 0 && typeof SetupLog !== 'undefined' && SetupLog.info) {
        SetupLog.info('PhaseFilter: cooperadora omitida (flag !== true) → ' + removed + ' forms omitidos', {
          phase: phase,
          omitted_count: removed
        });
      }
    }

    return filtered;
  }

};
