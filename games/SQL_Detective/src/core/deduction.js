/**
 * Accusations: the final step of a dossier, where the player names who is responsible
 * from the evidence in the notebook.
 */

/**
 * Compares an accusation with the answer of the case.
 *
 * @param {{answer: Record<string, string>}} accusation Accusation defined by the case.
 * @param {Record<string, string>} values Choice of the player, field by field.
 * @returns {boolean} `true` when every field is right.
 */
export function accusationMatches(accusation, values) {
  return Object.entries(accusation.answer).every(([field, value]) => values[field] === value);
}
