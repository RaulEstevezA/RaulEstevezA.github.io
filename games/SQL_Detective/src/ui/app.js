/**
 * The application: owns the current screen, the language and the saved game, and offers
 * them to the screens through a small interface. Screens are a registry (Registry
 * pattern): to add one, write its render function and add it to `SCREENS`.
 *
 * A render function receives the `app` object and the parameters of the screen, and
 * returns the nodes to show. Only `case-screen.js` updates itself afterwards; any other
 * change is shown by rendering the screen again.
 */

import { localize } from '../core/localize.js';
import { reopenFinalCase } from '../core/progress.js';
import { missions } from '../content/campaign.js';
import { uiText } from '../content/ui-text.js';
import { readLanguage, saveLanguage } from '../platform/language.js';
import { renderCase } from './screens/case-screen.js';
import { renderEnding } from './screens/ending-screen.js';
import { renderMenu } from './screens/menu-screen.js';
import { renderMissions } from './screens/missions-screen.js';

const SCREENS = {
  menu: renderMenu,
  missions: renderMissions,
  case: renderCase,
  ending: renderEnding,
};

/**
 * Starts the game.
 *
 * @param {object} dependencies What the interface needs from outside.
 * @param {HTMLElement} dependencies.root Element where the screens are rendered.
 * @param {Storage|null} dependencies.storage Store of the language preference.
 * @param {ReturnType<import('../platform/progress-store.js').createProgressStore>} dependencies.store Store of the saved game.
 * @param {function(): Promise<object>} dependencies.loadSql Access to the SQL engine.
 * @returns {void}
 */
export function startApp({ root, storage, store, loadSql }) {
  const saved = store.load();
  let current = { name: 'menu', params: undefined };

  const app = {
    language: readLanguage(storage),
    progress: saved.progress,
    storageAvailable: saved.available,
    loadSql,

    /** Shows a screen. Each one is a new page for the player, so it starts at the top. */
    navigate(name, params) {
      current = { name, params };
      // A window of the screen being left must not stay open over the new one.
      document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
      root.replaceChildren(...SCREENS[name](app, params));
      globalThis.scrollTo?.(0, 0);
    },

    /** Applies a transition from `core/progress.js` and saves the result. */
    updateProgress(transition) {
      app.progress = transition(app.progress);
      app.storageAvailable = store.save(app.progress) && app.storageAvailable;
    },

    /**
     * Changes the language and saves it for the website. As on the website, the player
     * stays in the same place: same scroll position and same focus on the selector.
     */
    setLanguage(language) {
      const scrollPosition = globalThis.scrollY;
      app.language = language;
      saveLanguage(storage, language);
      syncDocument();
      app.navigate(current.name, current.params);
      globalThis.scrollTo?.(0, scrollPosition);
      root.querySelector('.language-switch__button[aria-pressed="true"]')?.focus({ preventScroll: true });
    },

    /** Erases the saved game. */
    resetProgress() {
      app.progress = store.clear();
      app.navigate('menu');
    },

    /** Reopens the last case at its decision, to let the player choose another ending. */
    reopenFinalDecision() {
      const finale = missions.at(-1);
      app.updateProgress((progress) => reopenFinalCase(progress, finale.id));
      app.navigate('case', { caseId: finale.id });
    },
  };

  /** Keeps the language and the title of the document up to date. */
  function syncDocument() {
    document.documentElement.lang = app.language;
    document.title = localize(uiText.document.title, app.language);
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.textContent = localize(uiText.document.skip, app.language);
  }

  syncDocument();
  app.navigate('menu');
}
