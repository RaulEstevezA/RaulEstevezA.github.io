/**
 * The two forms at the end of a dossier: the accusation, which is checked against the
 * answer of the case, and the decision that ends the story.
 */

import { accusationMatches } from '../../core/deduction.js';
import { localize } from '../../core/localize.js';
import { uiText } from '../../content/ui-text.js';
import { h } from '../dom.js';

const text = uiText.deduction;

/**
 * Renders the accusation.
 *
 * @param {object} props What the form needs.
 * @param {object} props.accusation Accusation of the case: `intro`, `fields` and `answer`.
 * @param {'en'|'es'} props.language Language.
 * @param {function(): void} props.onCorrect Runs when every name is right.
 * @param {function(): void} props.onWrong Runs when the accusation does not hold up.
 * @returns {HTMLElement} The form.
 */
export function createAccusationForm({ accusation, language, onCorrect, onWrong }) {
  const t = (value) => localize(value, language);
  const message = h('p', { class: 'deduction__message', role: 'status' });
  const selects = accusation.fields.map((field) => ({
    field,
    element: h(
      'select',
      { class: 'deduction__select', required: true },
      h('option', { value: '' }, t(text.choose)),
      field.options.map((option) => h('option', { value: option }, option)),
    ),
  }));

  const submit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(selects.map(({ field, element }) => [field.key, element.value]));
    if (accusationMatches(accusation, values)) {
      onCorrect();
      return;
    }
    message.textContent = t(text.wrong);
    onWrong();
  };

  return h(
    'form',
    { class: 'deduction', onSubmit: submit },
    h('h3', { class: 'file__heading' }, t(text.title)),
    h('p', {}, t(accusation.intro)),
    selects.map(({ field, element }) => h('label', { class: 'deduction__field' }, t(field.label), element)),
    h('button', { class: 'button button--stamp', type: 'submit' }, t(text.accuse)),
    message,
  );
}

/**
 * Renders the decision that ends the story.
 *
 * @param {object} props What the panel needs.
 * @param {object} props.decision Decision of the case: `title`, `intro` and `options`.
 * @param {'en'|'es'} props.language Language.
 * @param {function(string): void} props.onChoose Receives the identifier of the ending.
 * @returns {HTMLElement} The panel.
 */
export function createDecisionPanel({ decision, language, onChoose }) {
  const t = (value) => localize(value, language);
  return h(
    'section',
    { class: 'deduction' },
    h('h3', { class: 'file__heading' }, t(decision.title)),
    h('p', {}, t(decision.intro)),
    decision.options.map((option) =>
      h(
        'button',
        { class: 'decision-option', type: 'button', onClick: () => onChoose(option.id) },
        h('b', {}, t(option.label)),
        h('span', {}, t(option.description)),
      ),
    ),
  );
}
