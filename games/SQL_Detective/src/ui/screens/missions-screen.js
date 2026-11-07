/**
 * Mission list: the chapters and their cases, reached from the main menu. It is immersive,
 * so it has no website header, only a way back. The unlocking rules are in `core/campaign.js`.
 * Registered in `ui/app.js`.
 */

import { countClosedCases, isChapterUnlocked, isMissionUnlocked } from '../../core/campaign.js';
import { localize } from '../../core/localize.js';
import { caseRecord } from '../../core/progress.js';
import { credibility, isCleanCase } from '../../core/scoring.js';
import { artUrl } from '../../content/art.js';
import { chapters, missions } from '../../content/campaign.js';
import { uiText } from '../../content/ui-text.js';
import { createSkyline } from '../art/skyline.js';
import { openPrologue } from '../components/story-dialogs.js';
import { h } from '../dom.js';

const text = uiText.missions;

/** Number of the chapter skyline: any stable value gives each chapter its own city. */
const skylineSeed = (chapterId) => 1987 + chapterId * 31;

/** Text of the state of a case. It is always shown as text, never only through colour. */
function caseState(mission, progress) {
  const record = caseRecord(progress, mission.id);
  if (isCleanCase(record)) return text.clean;
  if (record.closed) return text.closed;
  if (!isMissionUnlocked(missions, mission.id, progress)) return text.locked;
  return record.sceneSeen ? text.inProgress : text.open;
}

/** Renders the entry of a case in the list. A locked case keeps its title secret. */
function caseTile(app, mission, number) {
  const t = (value) => localize(value, app.language);
  const locked = !isMissionUnlocked(missions, mission.id, app.progress);
  const record = caseRecord(app.progress, mission.id);
  const modifier = locked ? 'case-tile--locked' : record.closed ? 'case-tile--closed' : 'case-tile--open';
  return h(
    'li',
    {},
    h(
      'button',
      {
        class: `case-tile ${modifier}`,
        type: 'button',
        disabled: locked,
        onClick: () => app.navigate('case', { caseId: mission.id }),
      },
      h('span', { class: 'case-tile__number' }, String(number).padStart(2, '0')),
      h(
        'span',
        { class: 'case-tile__body' },
        h('span', { class: 'case-tile__title' }, locked ? '· · ·' : t(mission.title)),
        h(
          'span',
          { class: 'case-tile__meta' },
          h('span', { class: 'case-tile__state' }, t(caseState(mission, app.progress))),
          !locked && mission.dossier && h('span', { class: 'case-tile__dossier' }, t(text.dossier)),
          !locked && h('span', {}, `${t(text.difficulty)} ${mission.rating}/5`),
        ),
      ),
    ),
  );
}

/** Renders a chapter: its picture, its summary and its cases. */
function chapterCard(app, chapter, firstNumber) {
  const t = (value) => localize(value, app.language);
  const chapterMissions = missions.filter((mission) => mission.chapter === chapter.id);
  const unlocked = isChapterUnlocked(missions, chapter.id, app.progress);
  const closed = countClosedCases(chapterMissions, app.progress);
  const art = unlocked && artUrl(`chapter-${chapter.id}`);

  return h(
    'article',
    { class: `chapter-card chapter-theme chapter-theme--${chapter.id}${unlocked ? '' : ' chapter-card--locked'}` },
    h(
      'div',
      { class: 'chapter-card__media' },
      art
        ? h('img', { class: 'chapter-card__art', src: art, alt: '', width: 1280, height: 720, loading: 'lazy' })
        : createSkyline(skylineSeed(chapter.id)),
      h('span', { class: 'chapter-card__number', 'aria-hidden': 'true' }, String(chapter.id).padStart(2, '0')),
    ),
    h(
      'div',
      { class: 'chapter-card__content' },
      h('p', { class: 'chapter-card__eyebrow' }, `${t(text.chapter)} ${chapter.id} · ${closed} ${t(text.of)} ${chapterMissions.length} ${t(text.closedCount)}`),
      h('h2', { class: 'chapter-card__title' }, t(chapter.title)),
      h('p', { class: 'chapter-card__subtitle' }, unlocked ? t(chapter.subtitle) : t(text.lockedChapter)),
      unlocked &&
        h('button', { class: 'text-button', type: 'button', onClick: () => openPrologue({ chapter, language: app.language }) }, t(text.readPrologue)),
      h('ol', { class: 'case-list' }, chapterMissions.map((mission, index) => caseTile(app, mission, firstNumber + index))),
    ),
  );
}

/**
 * Renders the list of missions.
 *
 * @param {object} app Interface of the application (see `ui/app.js`).
 * @returns {Node[]} Content of the screen.
 */
export function renderMissions(app) {
  const t = (value) => localize(value, app.language);
  let firstNumber = 1;
  const cards = chapters.map((chapter) => {
    const card = chapterCard(app, chapter, firstNumber);
    firstNumber += chapter.missions.length;
    return card;
  });

  return [
    h(
      'div',
      { class: 'screen-bar missions-bar' },
      h('button', { class: 'back-button', type: 'button', onClick: () => app.navigate('menu') }, `← ${t(text.back)}`),
      h(
        'p',
        { class: 'screen-bar__summary' },
        `${countClosedCases(missions, app.progress)} ${t(text.of)} ${missions.length} ${t(text.closedCount)} · ${t(text.credibility)} ${credibility(app.progress)}`,
      ),
    ),
    h(
      'main',
      { id: 'game', class: 'missions', tabindex: '-1' },
      h('h1', { class: 'missions__title' }, t(text.title)),
      h('p', { class: 'missions__hint' }, t(text.hint)),
      cards,
    ),
  ];
}
