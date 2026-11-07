/**
 * Compares the result of a query with what a lead of a case expects.
 *
 * Investigating is not filling in a form, so the check is deliberately forgiving:
 * extra columns are fine, column names ignore case, and the order of the rows only
 * matters when the lead asks for it. When the result is not right it says why, so
 * that the interface can give useful feedback instead of a plain "wrong".
 */

/** Numbers are compared with two decimals, so `AVG(x)` and `ROUND(AVG(x), 2)` both pass. */
function normalize(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : value;
}

/** Text form of a row, used to compare rows as a whole. */
const signature = (row) => JSON.stringify(row);

/**
 * @typedef {object} CheckResult
 * @property {boolean} match Whether the result answers the lead.
 * @property {'empty'|'missing-column'|'row-count'|'order'|'values'} [reason] Why it does not.
 * @property {string} [column] The missing column, for `missing-column`.
 * @property {number} [expected] How many rows are expected, for `row-count`.
 */

/**
 * Checks a query result against a lead.
 *
 * @param {{columns: string[], values: unknown[][]}} result Result of the query.
 * @param {{expected: object[], ordered?: boolean}} lead Expected rows, already localized.
 * @returns {CheckResult} Whether it matches and, if not, the first problem found.
 */
export function checkResult(result, { expected, ordered = false }) {
  if (!result.columns.length) return { match: false, reason: 'empty' };

  const wantedColumns = Object.keys(expected[0]);
  const available = result.columns.map((column) => column.toLowerCase());
  const positions = [];
  for (const column of wantedColumns) {
    const position = available.indexOf(column.toLowerCase());
    if (position < 0) return { match: false, reason: 'missing-column', column };
    positions.push(position);
  }

  if (result.values.length !== expected.length) {
    return { match: false, reason: 'row-count', expected: expected.length };
  }

  const got = result.values.map((row) => signature(positions.map((position) => normalize(row[position]))));
  const wanted = expected.map((row) => signature(wantedColumns.map((column) => normalize(row[column]))));

  if (got.every((row, index) => row === wanted[index])) return { match: true };

  const sameRows = signature([...got].sort()) === signature([...wanted].sort());
  if (sameRows) return ordered ? { match: false, reason: 'order' } : { match: true };
  return { match: false, reason: 'values' };
}
