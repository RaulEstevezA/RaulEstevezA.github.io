/**
 * Credibility: the score of the game. It starts full and falls each time the analyst
 * asks for a hint or accuses the wrong person. It never blocks progress; it only
 * decides the rank shown at the end of the story.
 */

const START = 100;
const HINT_COST = 1;
const WRONG_ACCUSATION_COST = 5;

/** Rank thresholds, from highest to lowest. Each `id` has its name in `content/ui-text.js`. */
const RANKS = [
  { id: 'legend', minimum: 90 },
  { id: 'inspector', minimum: 70 },
  { id: 'analyst', minimum: 40 },
  { id: 'rookie', minimum: 0 },
];

/**
 * Adds up the mistakes and hints of the whole game.
 *
 * @param {object} progress Current game.
 * @returns {{hints: number, wrongAccusations: number}} Totals.
 */
export function countAssistance(progress) {
  let hints = 0;
  let wrongAccusations = 0;
  for (const record of Object.values(progress.cases)) {
    for (const shown of Object.values(record.hintsShown ?? {})) hints += shown;
    wrongAccusations += record.wrongAccusations ?? 0;
  }
  return { hints, wrongAccusations };
}

/**
 * Calculates the current credibility.
 *
 * @param {object} progress Current game.
 * @returns {number} Value from 0 to 100.
 */
export function credibility(progress) {
  const { hints, wrongAccusations } = countAssistance(progress);
  return Math.max(0, START - hints * HINT_COST - wrongAccusations * WRONG_ACCUSATION_COST);
}

/**
 * Chooses the rank for a credibility value.
 *
 * @param {number} value Credibility, from 0 to 100.
 * @returns {string} Identifier of the rank.
 */
export function rankFor(value) {
  return RANKS.find((rank) => value >= rank.minimum).id;
}

/**
 * Tells whether a case was solved with no help at all.
 *
 * @param {{hintsShown?: object, wrongAccusations?: number, closed?: boolean}} record State of a case.
 * @returns {boolean} `true` when it is closed, with no hints and no wrong accusations.
 */
export function isCleanCase(record) {
  const hints = Object.values(record.hintsShown ?? {}).reduce((total, shown) => total + shown, 0);
  return Boolean(record.closed) && hints === 0 && !record.wrongAccusations;
}
