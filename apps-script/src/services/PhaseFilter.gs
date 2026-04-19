/**
 * PhaseFilter.gs — filtra FORMS_CFG por fase.
 * 'all' devuelve todo. Otras fases matchean cfg.phase.
 * 'arranque' es un conjunto explicito (F07 + F02) para quitar el dolor del Word compartido.
 */

const PhaseFilter = {

  filter(formsCfg, phase) {
    phase = phase || PHASES.ALL;

    if (phase === PHASES.ALL) return formsCfg.slice();

    if (phase === PHASES.ARRANQUE) {
      const arranqueIds = ['F07', 'F02'];
      return formsCfg.filter(function(c) { return arranqueIds.indexOf(c.id) !== -1; });
    }

    return formsCfg.filter(function(c) { return c.phase === phase; });
  }

};
