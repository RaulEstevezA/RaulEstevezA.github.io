/**
 * The end of the story: the chosen ending and the record of the whole investigation. The
 * endings are in `content/endings.js`. Registered in `ui/app.js`.
 */

import { countClosedCases } from '../../core/campaign.js';
import { localize } from '../../core/localize.js';
import { countAssistance, credibility, rankFor } from '../../core/scoring.js';
import { artUrl } from '../../content/art.js';
import { missions } from '../../content/campaign.js';
import { endings } from '../../content/endings.js';
import { uiText } from '../../content/ui-text.js';
import { createSkyline } from '../art/skyline.js';
import { h } from '../dom.js';

const text = uiText.ending;

/**
 * Renders the ending. Without a decision there is nothing to show yet, so it goes back
 * to the list of missions.
 *
 * @param {object} app Interface of the application (see `ui/app.js`).
 * @returns {Node[]} Content of the screen.
 */
export function renderEnding(app) {
  const ending = endings[app.progress.ending];
  if (!ending) {
    queueMicrotask(() => app.navigate('missions'));
    return [];
  }

  const t = (value) => localize(value, app.language);
  const score = credibility(app.progress);
  const { hints, wrongAccusations } = countAssistance(app.progress);
  const art = artUrl(`ending-${app.progress.ending}`);
  const stat = (label, value) => h('div', { class: 'ending__stat' }, h('dt', {}, t(label)), h('dd', {}, String(value)));

  return [
    h(
      'main',
      { id: 'game', class: `ending ending--${app.progress.ending}`, tabindex: '-1' },
      h(
        'div',
        { class: 'ending__media' },
        art ? h('img', { class: 'ending__art', src: art, alt: '', width: 1280, height: 720 }) : createSkyline(2024),
      ),
      h('p', { class: 'ending__eyebrow' }, t(ending.signal)),
      h('h1', { class: 'ending__title' }, t(ending.title)),
      h('div', { class: 'story' }, t(ending.paragraphs).map((paragraph) => h('p', {}, paragraph))),
      h('h2', { class: 'ending__heading' }, t(text.final)),
      h(
        'dl',
        { class: 'ending__stats' },
        stat(text.rank, t(text.ranks[rankFor(score)])),
        stat(text.credibility, score),
        stat(text.casesClosed, `${countClosedCases(missions, app.progress)}/${missions.length}`),
        stat(text.hints, hints),
        stat(text.wrong, wrongAccusations),
      ),
      h(
        'div',
        { class: 'ending__actions' },
        h('button', { class: 'button button--primary', type: 'button', onClick: () => app.navigate('menu') }, t(text.menu)),
        h('button', { class: 'button', type: 'button', onClick: () => app.reopenFinalDecision() }, t(text.replay)),
      ),
    ),
  ];
}
