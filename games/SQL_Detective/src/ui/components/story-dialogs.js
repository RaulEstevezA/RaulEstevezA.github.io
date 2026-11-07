/**
 * Windows that tell the story or explain the game: the prologue of a chapter, the scene
 * of a case, the instructions and the SQL handbook. They only show texts; what happens
 * afterwards is decided by whoever opens them, through `onClose`.
 */

import { localize } from '../../core/localize.js';
import { artUrl } from '../../content/art.js';
import { sqlReference } from '../../content/sql-reference.js';
import { uiText } from '../../content/ui-text.js';
import { h } from '../dom.js';
import { openModal } from './modal.js';

/** Paragraphs of a text told by the story. */
const paragraphs = (texts) => texts.map((text) => h('p', {}, text));

/**
 * Opens the prologue of a chapter.
 *
 * @param {{chapter: object, language: 'en'|'es', onClose?: function(): void}} options
 *   Chapter, language, and what to do when the player closes it.
 */
export function openPrologue({ chapter, language, onClose }) {
  const { prologue } = chapter;
  const text = (value) => localize(value, language);
  const art = artUrl(`chapter-${chapter.id}`);
  openModal({
    language,
    eyebrow: text(prologue.signal),
    title: text(prologue.title),
    className: `chapter-theme chapter-theme--${chapter.id} modal--story`,
    onClose,
    body: h(
      'div',
      { class: 'story' },
      art && h('img', { class: 'story__art', src: art, alt: '', width: 1280, height: 720 }),
      paragraphs(text(prologue.paragraphs)),
      h('blockquote', { class: 'story__quote' }, h('b', {}, text(prologue.speaker)), h('p', {}, text(prologue.quote))),
    ),
    actions: (close) => [h('button', { class: 'button button--primary', type: 'button', onClick: close }, text(prologue.action))],
  });
}

/**
 * Opens a passage of a case: its opening scene or its closing.
 *
 * @param {object} options What to show.
 * @param {object} options.mission The case.
 * @param {string[]} options.texts Paragraphs, already localized.
 * @param {string} options.action Label of the button that closes the window.
 * @param {'en'|'es'} options.language Language.
 * @param {function(): void} [options.onClose] What to do afterwards.
 */
export function openCasePassage({ mission, texts, action, language, onClose }) {
  openModal({
    language,
    eyebrow: localize(mission.location, language),
    title: localize(mission.title, language),
    className: `chapter-theme chapter-theme--${mission.chapter} modal--story`,
    onClose,
    body: h('div', { class: 'story' }, paragraphs(texts)),
    actions: (close) => [h('button', { class: 'button button--primary', type: 'button', onClick: close }, action)],
  });
}

/**
 * Opens the instructions.
 *
 * @param {{language: 'en'|'es', onClose?: function(): void}} options Language, and what to do afterwards.
 */
export function openHelp({ language, onClose }) {
  const text = uiText.help;
  openModal({
    language,
    title: localize(text.title, language),
    onClose,
    body: h('ol', { class: 'help-steps' }, localize(text.steps, language).map((step) => h('li', {}, step))),
    actions: (close) => [h('button', { class: 'button button--primary', type: 'button', onClick: close }, localize(text.start, language))],
  });
}

/**
 * Opens the SQL handbook.
 *
 * @param {{language: 'en'|'es'}} options Language.
 */
export function openHandbook({ language }) {
  openModal({
    language,
    title: localize(uiText.menu.handbook, language),
    className: 'modal--wide',
    body: sqlReference.map((section) =>
      h(
        'section',
        { class: 'handbook__section' },
        h('h3', { class: 'handbook__group' }, localize(section.group, language)),
        h(
          'div',
          { class: 'handbook__grid' },
          section.items.map((item) =>
            h(
              'article',
              { class: 'handbook__item' },
              h('h4', {}, item.name),
              h('code', {}, item.syntax),
              h('p', {}, localize(item.description, language)),
            ),
          ),
        ),
      ),
    ),
  });
}
