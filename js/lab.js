/*
 * Lab page (lab/): shows how many demos and games there are on its two cards
 * ("3 demos", "1 juego"), in the current language.
 *
 * Reads data/demos.json, data/games.json and locales/<lang>/lab.json, and
 * re-renders on 'languagechange:site' (js/i18n.js). The English counts are
 * pre-rendered by scripts/build_content.py (build_lab).
 */
(function () {
  'use strict';

  var siteRoot = document.body.dataset.siteRoot || '';
  // The data does not depend on the language: fetched once.
  var contentPromise = Promise.all([
    getJson(siteRoot + 'data/demos.json'),
    getJson(siteRoot + 'data/games.json')
  ]);
  // Locale files already requested, by language code.
  var localeCache = {};

  /**
   * Fetch and parse a JSON file.
   * @param {string} url File URL.
   * @returns {Promise<Object>} Rejects if the response is not 2xx.
   */
  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  /**
   * Lab texts for a language, requested only once per language.
   * @param {string} lang Language code.
   * @returns {Promise<Object>} The parsed locales/<lang>/lab.json.
   */
  function getLocale(lang) {
    if (!localeCache[lang]) {
      localeCache[lang] = getJson(siteRoot + 'locales/' + lang + '/lab.json');
    }
    return localeCache[lang];
  }

  /**
   * Format a count with the singular or plural template of the locale.
   * @param {Object} locale Parsed lab.json.
   * @param {string} key Base key; reads key + '_one' or key + '_other'.
   * @param {number} count Number that replaces {count}.
   * @returns {string} The formatted text.
   */
  function formatCount(locale, key, count) {
    var suffix = count === 1 ? '_one' : '_other';
    return locale[key + suffix].replace('{count}', count);
  }

  /**
   * Write both counts in the given language.
   * @param {string} lang Language code.
   * @returns {Promise} Resolves when written; errors are logged, not rethrown.
   */
  function renderCounts(lang) {
    return Promise.all([contentPromise, getLocale(lang)]).then(function (results) {
      var demos = results[0][0].demos || [];
      var games = results[0][1].games || [];
      var locale = results[1];

      document.getElementById('lab-demos-count').textContent = formatCount(locale, 'demos_kicker', demos.length);
      document.getElementById('lab-games-count').textContent = formatCount(locale, 'games_kicker', games.length);
    }).catch(function (error) {
      console.error(error);
    });
  }

  // Registered in siteReady so the first reveal waits for the translated counts.
  document.addEventListener('languagechange:site', function (event) {
    (window.siteReady = window.siteReady || []).push(renderCounts(event.detail.lang));
  });
}());
