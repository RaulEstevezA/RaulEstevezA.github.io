/**
 * Main menu: the first screen of the game and the only one with the website header.
 * Registered in `ui/app.js`.
 */

import { findFirstOpenCase } from '../../core/campaign.js';
import { localize } from '../../core/localize.js';
import { missions } from '../../content/campaign.js';
import { uiText } from '../../content/ui-text.js';
import { createSkyline } from '../art/skyline.js';
import { createHeader } from '../components/header.js';
import { openModal } from '../components/modal.js';
import { openHandbook, openHelp } from '../components/story-dialogs.js';
import { h } from '../dom.js';

const text = uiText.menu;

/** Chooses the way forward: nothing yet for a new player, whose way in is Missions. */
function primaryAction(app) {
  if (!Object.keys(app.progress.cases).length) return null;
  const pending = findFirstOpenCase(missions, app.progress);
  return pending
    ? { label: text.continue, open: () => app.navigate('case', { caseId: pending }) }
    : { label: text.ending, open: () => app.navigate('ending') };
}

/** Asks for confirmation before erasing the saved game. */
function confirmReset(app) {
  const t = (value) => localize(value, app.language);
  openModal({
    language: app.language,
    title: t(text.resetTitle),
    body: h('p', {}, t(text.resetBody)),
    actions: (close) => [
      h('button', { class: 'button', type: 'button', onClick: close }, t(text.cancel)),
      h(
        'button',
        {
          class: 'button button--primary',
          type: 'button',
          onClick: () => {
            app.resetProgress();
            close();
          },
        },
        t(text.resetConfirm),
      ),
    ],
  });
}

/**
 * Renders the main menu.
 *
 * @param {object} app Interface of the application (see `ui/app.js`).
 * @returns {Node[]} Content of the screen.
 */
export function renderMenu(app) {
  const t = (value) => localize(value, app.language);
  const primary = primaryAction(app);

  return [
    createHeader({ language: app.language, onLanguageChange: app.setLanguage }),
    h(
      'main',
      { id: 'game', class: 'title-screen', tabindex: '-1' },
      h('div', { class: 'title-screen__city' }, createSkyline(1987, { tall: true })),
      h('img', { class: 'title-screen__logo', src: './sql-detective-logo.png', alt: '', width: 512, height: 512 }),
      h('h1', { class: 'title-screen__name' }, 'SQL ', h('span', {}, 'Detective')),
      h('p', { class: 'title-screen__tagline' }, t(text.tagline)),
      h('p', { class: 'title-screen__description' }, t(text.description)),
      !app.storageAvailable && h('p', { class: 'notice', role: 'status' }, t(text.storageUnavailable)),
      h(
        'nav',
        { class: 'main-menu', 'aria-label': t(text.label) },
        primary &&
          h('button', { class: 'button button--primary main-menu__wide', type: 'button', onClick: primary.open }, t(primary.label)),
        // There is one primary action per group: Missions is primary only when nothing comes before it.
        h(
          'button',
          { class: `button main-menu__wide${primary ? '' : ' button--primary'}`, type: 'button', onClick: () => app.navigate('missions') },
          t(text.missions),
        ),
        h('button', { class: 'button', type: 'button', onClick: () => openHandbook({ language: app.language }) }, t(text.handbook)),
        h('button', { class: 'button', type: 'button', onClick: () => openHelp({ language: app.language }) }, t(text.help)),
        h('button', { class: 'button', type: 'button', onClick: () => confirmReset(app) }, t(text.reset)),
        h('a', { class: 'button', href: '../' }, t(text.games)),
      ),
    ),
  ];
}
