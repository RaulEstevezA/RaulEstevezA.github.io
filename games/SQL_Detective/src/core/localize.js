/**
 * Content is bilingual: any text may be a `{en, es}` pair. These helpers choose the
 * language, also inside table cells, so that a witness statement can be read in the
 * language of the player while codes and names stay the same in both.
 */

/**
 * Builds a bilingual value.
 *
 * @template T
 * @param {T} en English value.
 * @param {T} es Spanish value.
 * @returns {{en: T, es: T}} The pair.
 */
export const bi = (en, es) => ({ en, es });

/** Tells a bilingual pair from any other value. */
const isBilingual = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'en' in value && 'es' in value;

/**
 * Picks the language of a value that may or may not be bilingual.
 *
 * @param {unknown} value A pair or a plain value.
 * @param {'en'|'es'} language Language of the player.
 * @returns {*} The text in that language, or the value unchanged.
 */
export const localize = (value, language) => (isBilingual(value) ? value[language] : value);

/**
 * Localizes every cell of a list of rows.
 *
 * @param {object[]} rows Rows whose cells may be bilingual.
 * @param {'en'|'es'} language Language of the player.
 * @returns {object[]} New rows with plain values.
 */
export function localizeRows(rows, language) {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([column, cell]) => [column, localize(cell, language)])),
  );
}

/**
 * Localizes all the tables of a case.
 *
 * @param {Record<string, object[]>} tables Tables whose cells may be bilingual.
 * @param {'en'|'es'} language Language of the player.
 * @returns {Record<string, object[]>} New tables with plain values.
 */
export function localizeTables(tables, language) {
  return Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, localizeRows(rows, language)]));
}
