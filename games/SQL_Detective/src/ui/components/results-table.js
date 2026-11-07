/**
 * Table with the result of a query. Long results scroll inside their own box, so that the
 * page itself never scrolls sideways.
 */

import { h } from '../dom.js';

/**
 * Renders a result.
 *
 * @param {{columns: string[], values: unknown[][]}} result Result of a query.
 * @returns {HTMLElement} The scrollable table.
 */
export function createResultsTable({ columns, values }) {
  const cell = (value) =>
    value === null ? h('td', { class: 'results__null' }, 'NULL') : h('td', {}, String(value));
  return h(
    'div',
    { class: 'results', tabindex: '0' },
    h(
      'table',
      {},
      h('thead', {}, h('tr', {}, columns.map((column) => h('th', { scope: 'col' }, column)))),
      h('tbody', {}, values.map((row) => h('tr', {}, row.map(cell)))),
    ),
  );
}
