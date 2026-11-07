/**
 * Saved game: its format and the transitions between states.
 *
 * Every transition is a pure function that returns a new progress object, so the rules
 * can be tested without a browser. Reading and writing belong to
 * `platform/progress-store.js`.
 */

/** Key of the saved game, following the `<game>.progress` convention. */
export const PROGRESS_KEY = 'sqldetective.progress';

/** Raise this number when the format or the case identifiers change. */
export const PROGRESS_VERSION = 2;

/**
 * Creates the state of a game that has not started.
 *
 * @returns {object} Empty progress in the current format.
 */
export function blankProgress() {
  return { version: PROGRESS_VERSION, cases: {}, prologuesSeen: [], helpSeen: false, ending: null };
}

/**
 * Restores a saved game.
 *
 * Version 1 had other cases, so its progress cannot be mapped onto this campaign. A saved
 * game from another version, or a damaged one, is replaced by a new game.
 *
 * @param {string|null} saved Raw text from the store, or `null` if there is none.
 * @returns {object} The saved game, or a new one when it cannot be used.
 */
export function restoreProgress(saved) {
  if (saved === null) return blankProgress();
  try {
    const parsed = JSON.parse(saved);
    if (parsed?.version === PROGRESS_VERSION) return { ...blankProgress(), ...parsed };
  } catch {
    // Damaged data is handled like an old version: a new game.
  }
  return blankProgress();
}

/**
 * Reads the state of a case, whether or not it has been opened.
 *
 * @param {object} progress Current game.
 * @param {string} caseId Identifier of the case.
 * @returns {{stage: number, hintsShown: Record<number, number>, wrongAccusations: number,
 *   closed: boolean, sceneSeen: boolean}} State of the case.
 */
export function caseRecord(progress, caseId) {
  return { stage: 0, hintsShown: {}, wrongAccusations: 0, closed: false, sceneSeen: false, ...progress.cases[caseId] };
}

/** Returns a new game with some fields of a case changed. */
function withCase(progress, caseId, changes) {
  return { ...progress, cases: { ...progress.cases, [caseId]: { ...caseRecord(progress, caseId), ...changes } } };
}

/** Records that the opening scene of a case has been read. */
export const markSceneSeen = (progress, caseId) => withCase(progress, caseId, { sceneSeen: true });

/** Moves a case on to its next lead. */
export const advanceStage = (progress, caseId) =>
  withCase(progress, caseId, { stage: caseRecord(progress, caseId).stage + 1 });

/** Reveals one more hint of a lead. Hints already shown remain free to read again. */
export function revealHint(progress, caseId, stage) {
  const { hintsShown } = caseRecord(progress, caseId);
  return withCase(progress, caseId, { hintsShown: { ...hintsShown, [stage]: (hintsShown[stage] ?? 0) + 1 } });
}

/** Records an accusation that did not hold up. */
export const recordWrongAccusation = (progress, caseId) =>
  withCase(progress, caseId, { wrongAccusations: caseRecord(progress, caseId).wrongAccusations + 1 });

/** Marks a case as solved. */
export const closeCase = (progress, caseId) => withCase(progress, caseId, { closed: true });

/** Records that the prologue of a chapter has been read. */
export const markPrologueSeen = (progress, chapterId) =>
  progress.prologuesSeen.includes(chapterId)
    ? progress
    : { ...progress, prologuesSeen: [...progress.prologuesSeen, chapterId] };

/** Records that the instructions have been shown. */
export const markHelpSeen = (progress) => ({ ...progress, helpSeen: true });

/** Records the decision that ends the story. */
export const chooseEnding = (progress, endingId) => ({ ...progress, ending: endingId });

/** Undoes the ending and reopens the last case, so that the player can decide again. */
export const reopenFinalCase = (progress, caseId) => ({ ...withCase(progress, caseId, { closed: false }), ending: null });
