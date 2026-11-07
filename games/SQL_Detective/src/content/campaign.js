/**
 * The campaign: the registry of chapters, and the single place that defines their order.
 * To add a chapter, create its module and add it to `chapters`.
 *
 * A chapter has `id`, `title`, `subtitle`, a `prologue` (`signal`, `title`, `paragraphs`,
 * `speaker`, `quote`, `action`) and `missions`.
 *
 * A mission has these fields; every text is a `{en, es}` pair:
 * - `id`, `rating` (1 to 5) and `concepts` (the SQL it practises).
 * - `title`, `location`, and `scene` and `closing`: the paragraphs told before and after.
 * - `tables`: rows per table name. A cell may be bilingual. Each row of a table declares
 *   the same columns.
 * - `stages`: its leads, in order. Each has `title`, `briefing`, `expected` (the rows
 *   that solve it), `ordered` (when the order of the rows matters), `hints` (optional;
 *   each one costs credibility), `clue` (added to the notebook) and `reaction` (optional
 *   line said by a character).
 * - `dossier` (optional): marks the case as a dossier, and needs an `accusation` with
 *   `intro`, `fields` (`key`, `label`, `options`) and `answer`.
 * - `decision` (optional): the choice that ends the story; each of its options is an
 *   entry of `content/endings.js`.
 * - `hideSchema` (optional): the case does not show its tables, nor does `.tables` list them.
 */

import { chapter1 } from './chapter-1.js';
import { chapter2 } from './chapter-2.js';
import { chapter3 } from './chapter-3.js';
import { chapter4 } from './chapter-4.js';
import { chapter5 } from './chapter-5.js';

/** Every chapter, in the order they are played. */
export const chapters = [chapter1, chapter2, chapter3, chapter4, chapter5];

/** Every mission of the campaign, in play order, each one with its chapter number. */
export const missions = chapters.flatMap((chapter) =>
  chapter.missions.map((mission) => ({ ...mission, chapter: chapter.id })),
);

/**
 * Finds a mission.
 *
 * @param {string} id Identifier of the mission.
 * @returns {object|undefined} The mission, or `undefined` if it does not exist.
 */
export const getMission = (id) => missions.find((mission) => mission.id === id);

/**
 * Finds a chapter.
 *
 * @param {number} id Number of the chapter.
 * @returns {object|undefined} The chapter, or `undefined` if it does not exist.
 */
export const getChapter = (id) => chapters.find((chapter) => chapter.id === id);
