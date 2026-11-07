/**
 * Loads sql.js in the browser. The engine is big, so it is loaded once, and only when
 * the first query needs it. The build copies it to `vendor/`, and the development server
 * serves it from the same path.
 */

const ENGINE_BASE = './vendor/';

/** Adds the script of the engine to the page and waits for it. */
function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${source}`));
    document.head.append(script);
  });
}

/**
 * Creates the access to the engine.
 *
 * @returns {function(): Promise<object>} Function that returns the sql.js module. If the
 *   load fails, a later call tries again.
 */
export function createSqlRuntime() {
  let engine = null;
  return () => {
    engine ??= loadScript(`${ENGINE_BASE}sql-wasm.js`)
      .then(() => globalThis.initSqlJs({ locateFile: (file) => `${ENGINE_BASE}${file}` }))
      .catch((error) => {
        engine = null;
        throw error;
      });
    return engine;
  };
}
