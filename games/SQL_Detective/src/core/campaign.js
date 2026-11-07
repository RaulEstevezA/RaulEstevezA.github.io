/**
 * Order of the campaign: which case can be opened and which one comes next. The story
 * is linear, so a case opens when the previous one is closed. The list of missions is
 * received as a parameter, which keeps this module independent of the content.
 */

import { caseRecord } from './progress.js';

/**
 * Tells whether a case can be opened.
 *
 * @param {{id: string}[]} missions Campaign, in order.
 * @param {string} caseId Case to check.
 * @param {object} progress Current game.
 * @returns {boolean} `true` for the first case and for any case after a closed one.
 */
export function isMissionUnlocked(missions, caseId, progress) {
  const index = missions.findIndex((mission) => mission.id === caseId);
  return index === 0 || (index > 0 && caseRecord(progress, missions[index - 1].id).closed);
}

/**
 * Tells whether a chapter can be entered.
 *
 * @param {{id: string, chapter: number}[]} missions Campaign, in order.
 * @param {number} chapterId Chapter to check.
 * @param {object} progress Current game.
 * @returns {boolean} `true` when its first case can be opened.
 */
export function isChapterUnlocked(missions, chapterId, progress) {
  const first = missions.find((mission) => mission.chapter === chapterId);
  return Boolean(first) && isMissionUnlocked(missions, first.id, progress);
}

/**
 * Finds where the player should continue.
 *
 * @param {{id: string}[]} missions Campaign, in order.
 * @param {object} progress Current game.
 * @returns {string|null} First case still open, or `null` when all are closed.
 */
export function findFirstOpenCase(missions, progress) {
  return missions.find((mission) => !caseRecord(progress, mission.id).closed)?.id ?? null;
}

/**
 * Finds the case that follows another one.
 *
 * @param {{id: string}[]} missions Campaign, in order.
 * @param {string} caseId Current case.
 * @returns {string|null} Next case, or `null` after the last one.
 */
export function findNextCase(missions, caseId) {
  const index = missions.findIndex((mission) => mission.id === caseId);
  return missions[index + 1]?.id ?? null;
}

/**
 * Counts the closed cases.
 *
 * @param {{id: string}[]} missions Missions to count, a whole campaign or one chapter.
 * @param {object} progress Current game.
 * @returns {number} How many are closed.
 */
export function countClosedCases(missions, progress) {
  return missions.filter((mission) => caseRecord(progress, mission.id).closed).length;
}
