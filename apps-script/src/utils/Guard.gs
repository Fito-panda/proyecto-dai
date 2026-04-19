/**
 * Guard.gs — assertions + retry con backoff exponencial para llamadas flaky a FormApp/DriveApp.
 */

const Guard = {

  assert(condition, message) {
    if (!condition) {
      throw new Error('Assertion failed: ' + (message || 'condition is false'));
    }
  },

  assertType(value, expectedType, paramName) {
    const actual = typeof value;
    if (actual !== expectedType) {
      throw new Error(
        'Parameter "' + paramName + '" must be ' + expectedType + ', got ' + actual
      );
    }
  },

  assertNonEmpty(value, paramName) {
    if (value === null || value === undefined || value === '') {
      throw new Error('Parameter "' + paramName + '" must be non-empty');
    }
  },

  /**
   * retry(fn, opts) — corre fn() hasta maxAttempts veces con backoff exponencial.
   * opts: { maxAttempts=3, baseDelayMs=500, onRetry(err, attempt) }
   */
  retry(fn, opts) {
    const config = Object.assign({ maxAttempts: 3, baseDelayMs: 500 }, opts || {});
    let lastError = null;
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return fn();
      } catch (err) {
        lastError = err;
        if (config.onRetry) config.onRetry(err, attempt);
        if (attempt < config.maxAttempts) {
          Utilities.sleep(config.baseDelayMs * Math.pow(2, attempt - 1));
        }
      }
    }
    throw lastError;
  }

};
