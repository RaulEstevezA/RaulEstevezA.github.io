/**
 * Saves the game in the browser. When the store is not available (private mode, blocked
 * data) the game goes on with its state in memory, and lasts as long as the tab.
 */

import { blankProgress, PROGRESS_KEY, restoreProgress } from '../core/progress.js';

/**
 * Creates the store of the saved game.
 *
 * @param {Storage|null} storage Browser store, or a replacement in the tests.
 * @returns {{load: function(): {progress: object, available: boolean},
 *   save: function(object): boolean, clear: function(): object}} Store operations.
 */
export function createProgressStore(storage) {
  return {
    /** Restores the saved game, and tells whether the store works at all. */
    load() {
      try {
        const saved = storage.getItem(PROGRESS_KEY);
        return { progress: restoreProgress(saved), available: true };
      } catch {
        return { progress: blankProgress(), available: false };
      }
    },
    /** Saves the game. Returns `false` when it could not be saved. */
    save(progress) {
      try {
        storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        return true;
      } catch {
        return false;
      }
    },
    /** Erases the saved game and returns a new one. */
    clear() {
      try {
        storage.removeItem(PROGRESS_KEY);
      } catch {
        // Nothing was saved, so there is nothing to erase.
      }
      return blankProgress();
    },
  };
}
