/**
 * Language of the player, shared with the whole website through the `lang` preference.
 * The order is the one fixed by DECISIONS.md in personal_web_style: the language inherited
 * from the website, then the language of the browser, then English.
 */

const LANGUAGE_KEY = 'lang';
const SUPPORTED_LANGUAGES = ['en', 'es'];
const DEFAULT_LANGUAGE = 'en';

/**
 * Reduces a language tag to a language of the game.
 *
 * @param {string|null|undefined} tag Tag such as `es` or `es-ES`.
 * @returns {'en'|'es'|null} The language, or `null` when the game does not have it.
 */
function toSupportedLanguage(tag) {
  const code = tag?.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : null;
}

/**
 * Reads the preference saved by the website, a tool or another game.
 *
 * @param {Pick<Storage, 'getItem'>|null} storage Store of the preference.
 * @returns {string|null} The saved value, or `null` when there is none or it cannot be read.
 */
function readInheritedLanguage(storage) {
  try {
    return storage?.getItem(LANGUAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Decides the language of the game.
 *
 * @param {Pick<Storage, 'getItem'>|null} storage Store of the preference.
 * @param {string} [browserLanguage] Language of the browser.
 * @returns {'en'|'es'} The language to use.
 */
export function readLanguage(storage, browserLanguage = globalThis.navigator?.language) {
  return toSupportedLanguage(readInheritedLanguage(storage))
    ?? toSupportedLanguage(browserLanguage)
    ?? DEFAULT_LANGUAGE;
}

/**
 * Saves the language for the website and the other games.
 *
 * @param {Pick<Storage, 'setItem'>|null} storage Store of the preference.
 * @param {'en'|'es'} language Language chosen by the player.
 */
export function saveLanguage(storage, language) {
  try {
    storage?.setItem(LANGUAGE_KEY, language);
  } catch {
    // Without storage the choice simply lasts for this tab.
  }
}
