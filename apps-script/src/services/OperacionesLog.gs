/**
 * OperacionesLog.gs — escribe a la pestaña '📋 Estado del sistema' del Sheet
 * template con severidad (INFO/WARN/ERROR).
 * Paso 9/20 plan v3 baja/suplentes-docente (2026-04-28).
 * Refactor paso 10.1 plan v3 (2026-04-28): la resolucion del template se
 * delega a TemplateResolver (utils/TemplateResolver.gs) — helper compartido
 * con los handlers operativos pasos 10-13.
 *
 * Diferencia con SetupLog (Logger.gs):
 *   - SetupLog: log batch en memoria + flush al final (volcado a
 *     'Log-{timestamp}'). Usado por setupAll/bootstrapTemplate (operaciones
 *     grandes acumuladas).
 *   - OperacionesLog: log atomico directo (1 fila por llamada en
 *     '📋 Estado del sistema'). Usado por OnSubmitDispatcher + handlers
 *     operativos (operaciones del dia a dia).
 *
 * Schema de la pestaña (definido en ConfigSheetBuilder.gs:93-97):
 *   col 1=Fecha, 2=Tipo, 3=Quién, 4=Qué, 5=Detalle
 *
 * Defensive: si el template no resuelve (pre-bootstrap, cache no poblado,
 * contexto raro), loguea a SetupLog.warn como fallback en lugar de throw.
 *
 * NO re-throw nunca: el log debe ser best-effort, no romper el flujo del
 * dispatcher ni del handler que lo invoca.
 */

const OperacionesLog = {

  TAB_NAME: '📋 Estado del sistema',

  /**
   * info(que, detalle, quien) — log INFO.
   *
   * Params:
   *   que: string corto descriptivo (col Qué).
   *   detalle: object opcional (se serializa a JSON, va a col Detalle).
   *   quien: string opcional (email u otro identificador, va a col Quién).
   *          Si no se pasa, queda vacío.
   */
  info(que, detalle, quien) {
    this._write('INFO', que, detalle, quien);
  },

  /**
   * warn(que, detalle, quien) — log WARN. Misma signature que info.
   * Usar para situaciones esperadas pero atípicas (ej. form desconocido en
   * dispatcher).
   */
  warn(que, detalle, quien) {
    this._write('WARN', que, detalle, quien);
  },

  /**
   * error(que, detalle, quien) — log ERROR. Misma signature que info.
   * Usar para fallos que pueden requerir acción manual (ej. removeEditor
   * falló).
   */
  error(que, detalle, quien) {
    this._write('ERROR', que, detalle, quien);
  },

  _write(tipo, que, detalle, quien) {
    try {
      const ss = TemplateResolver.resolve(this.TAB_NAME);
      if (!ss) {
        if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
          SetupLog.warn('OperacionesLog: no se pudo resolver template (active no es template y cache no existe — correr installSubmitDispatcher para cachear)', {
            tabName: this.TAB_NAME, tipo: tipo, que: que
          });
        }
        return;
      }
      const tab = ss.getSheetByName(this.TAB_NAME);
      if (!tab) {
        if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
          SetupLog.warn('OperacionesLog: pestaña no existe en template resuelto', {
            tabName: this.TAB_NAME, tipo: tipo, que: que
          });
        }
        return;
      }

      const fecha = new Date();
      const quienStr = String(quien || '').trim();
      const detalleStr = detalle ? JSON.stringify(detalle) : '';

      tab.appendRow([fecha, tipo, quienStr, String(que || ''), detalleStr]);
    } catch (err) {
      if (typeof SetupLog !== 'undefined' && SetupLog.warn) {
        SetupLog.warn('OperacionesLog._write fallo', {
          err: String(err), tipo: tipo, que: que
        });
      }
      // NO re-throw — log debe ser best-effort.
    }
  }

};
