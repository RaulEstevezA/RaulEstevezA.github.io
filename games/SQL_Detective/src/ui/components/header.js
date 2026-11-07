/**
 * Common header of the personal website: the name on the left and the language selector
 * on the right. It looks and behaves like the header of the website, although the selector
 * uses buttons, as `components/navigation.md` in personal_web_style asks of new projects.
 * Only the main menu shows it. Game navigation does not belong here.
 */

import { localize } from '../../core/localize.js';
import { uiText } from '../../content/ui-text.js';
import { h } from '../dom.js';

const LANGUAGES = ['en', 'es'];

/**
 * Renders the header.
 *
 * @param {{language: 'en'|'es', onLanguageChange: function('en'|'es'): void}} props
 *   Current language, and what to do when the player chooses another one.
 * @returns {HTMLElement} The header.
 */
export function createHeader({ language, onLanguageChange }) {
  return h(
    'header',
    { class: 'site-header' },
    h('a', { class: 'site-header__brand', href: 'https://raulesteveza.github.io/' }, 'Raúl Estévez'),
    h(
      'div',
      { class: 'language-switch', role: 'group', 'aria-label': localize(uiText.document.languageGroup, language) },
      LANGUAGES.map((option) =>
        h(
          'button',
          {
            class: 'language-switch__button',
            type: 'button',
            'aria-pressed': String(option === language),
            onClick: () => onLanguageChange(option),
          },
          option.toUpperCase(),
        ),
      ),
    ),
  );
}
