/**
 * Deterministic filler for the tables of a case.
 *
 * Harder cases hide their evidence among ordinary rows, so that the answer cannot be
 * found by eye. The generator has a fixed seed: every player, and every test, gets
 * exactly the same rows. Filler must never satisfy a lead by accident; the tests in
 * `tests/campaign.test.js` run the canonical query of every lead to guarantee it.
 */

/** Given names and surnames of the people of Puerto Ceniza who have nothing to hide. */
const GIVEN_NAMES = ['Abel', 'Berta', 'Ciro', 'Dora', 'Enzo', 'Fina', 'Gil', 'Hana', 'Ivo', 'Jara', 'Kim', 'Lola', 'Mael', 'Nil', 'Olga', 'Paz', 'Quim', 'Rita', 'Saul', 'Tina'];
const SURNAMES = ['Arce', 'Bravo', 'Cano', 'Duro', 'Egea', 'Feliu', 'Garrido', 'Hoyos', 'Ibarra', 'Jover', 'Lagos', 'Mora', 'Nieto', 'Otero', 'Pardo', 'Quesada', 'Rubio', 'Soler', 'Tena', 'Ulloa'];

/**
 * Creates a small random source with a fixed sequence (mulberry32).
 *
 * @param {number} seed Any integer; the same seed gives the same sequence.
 * @returns {{int: function(number, number): number, pick: function(any[]): *, name: function(): string,
 *   time: function(string, string): string}} Helpers built on that sequence.
 */
export function createRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const int = (minimum, maximum) => minimum + Math.floor(next() * (maximum - minimum + 1));
  const pick = (options) => options[int(0, options.length - 1)];
  const toMinutes = (clock) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
  return {
    int,
    pick,
    /** Returns an invented full name. */
    name: () => `${pick(GIVEN_NAMES)} ${pick(SURNAMES)}`,
    /** Returns an `HH:MM` time between two others, both included. */
    time: (from, to) => {
      const minutes = int(toMinutes(from), toMinutes(to));
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    },
  };
}

/**
 * Generates rows of filler.
 *
 * @param {number} seed Seed of this table.
 * @param {number} count How many rows to create.
 * @param {function(object, number): object} factory Builds a row from the random
 *   helpers and its position.
 * @returns {object[]} The rows.
 */
export function fillerRows(seed, count, factory) {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) => factory(random, index));
}

/**
 * Sorts rows by a column and numbers them, so that evidence and filler end up mixed
 * instead of the evidence sitting at the top of the table.
 *
 * @param {object[]} rows Rows without an `id`.
 * @param {string} column Column to sort by.
 * @param {number} [firstId] Identifier of the first row.
 * @returns {object[]} New rows with `id` as their first column.
 */
export function shuffleIntoLog(rows, column, firstId = 1) {
  return [...rows]
    .sort((a, b) => String(a[column]).localeCompare(String(b[column])))
    .map((row, index) => ({ id: firstId + index, ...row }));
}
