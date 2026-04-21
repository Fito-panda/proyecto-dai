/**
 * PhaseFilter.gs — filtra FORMS_CFG por fase + flags contextuales del onboarding.
 *
 * 'all' devuelve todo. Otras fases matchean cfg.phase.
 * 'arranque' es un conjunto explicito (F07 + F02) para quitar el dolor del Word compartido.
 *
 * R1 2026-04-21 (fix B3 = deuda D7): acepta un 2º parámetro `onboardingFlags`
 * con booleans que modulan el resultado. Hoy:
 *   - onboardingFlags.cooperadora_activa === false → omite forms phase='cooperadora'
 *     (F10, F11, F12). Antes se creaban siempre aunque la directora respondiera
 *     "No" en el Form.
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
    if (onboardingFlags.cooperadora_activa === false) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(function(c) { return c.phase !== 'cooperadora'; });
      const removed = beforeCount - filtered.length;
      if (removed > 0 && typeof SetupLog !== 'undefined' && SetupLog.info) {
        SetupLog.info('PhaseFilter: cooperadora_activa=false → ' + removed + ' forms omitidos', {
          phase: phase,
          omitted_count: removed
        });
      }
    }

    return filtered;
  }

};
