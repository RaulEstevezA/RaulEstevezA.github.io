/**
 * Entry point: creates the browser dependencies and hands them to the application. This
 * is the only module that touches the browser store directly (composition root).
 */

import { createProgressStore } from './platform/progress-store.js';
import { createSqlRuntime } from './platform/sql-runtime.js';
import { startApp } from './ui/app.js';

/**
 * Reads `localStorage`, which throws an error when the browser blocks site data.
 *
 * @returns {Storage|null} The store, or `null` when it is not available.
 */
function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

const storage = browserStorage();

startApp({
  root: document.getElementById('app'),
  storage,
  store: createProgressStore(storage),
  loadSql: createSqlRuntime(),
});
