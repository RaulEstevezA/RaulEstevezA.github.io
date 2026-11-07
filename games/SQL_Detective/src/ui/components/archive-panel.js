/**
 * The Archive panel of a case: its tables, with their columns and a button to preview
 * each one. A case whose story has destroyed the index shows only a warning.
 */

import { localize } from '../../core/localize.js';
import { uiText } from '../../content/ui-text.js';
import { h } from '../dom.js';

const text = uiText.caseFile;

/**
 * Renders the panel.
 *
 * @param {object} props What the panel shows.
 * @param {Record<string, object[]>} props.tables Tables of the case.
 * @param {boolean} [props.hideSchema] Whether the case hides its tables.
 * @param {'en'|'es'} props.language Language.
 * @param {function(string): void} props.onPreview Receives the name of a table to preview.
 * @returns {HTMLElement} The panel.
 */
export function createArchivePanel({ tables, hideSchema, language, onPreview }) {
  const t = (value) => localize(value, language);
  const tableEntry = ([name, rows]) =>
    h(
      'article',
      { class: 'archive__table' },
      h(
        'div',
        { class: 'archive__heading' },
        h('code', { class: 'archive__name' }, name),
        h('span', { class: 'file__muted' }, `${rows.length} ${t(text.rows)}`),
        h(
          'button',
          { class: 'text-button', type: 'button', 'aria-label': `${t(text.previewTable)} ${name}`, onClick: () => onPreview(name) },
          t(text.preview),
        ),
      ),
      h('div', { class: 'archive__columns' }, Object.keys(rows[0] ?? {}).map((column) => h('code', {}, column))),
    );

  return h(
    'section',
    { class: 'archive' },
    h('h3', { class: 'file__heading' }, t(text.archive)),
    hideSchema ? h('p', { class: 'archive__burned' }, t(text.burned)) : Object.entries(tables).map(tableEntry),
  );
}
