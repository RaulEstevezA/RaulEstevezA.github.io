/*
 * Site language (English / Spanish), loaded on every page.
 *
 * - Chooses the language: the one saved in localStorage['lang'] (shared with the
 *   tools, demos and games), then the browser language, then English.
 * - Translates every element with data-i18n="file.key" using
 *   locales/<lang>/common.json and locales/<lang>/<page>.json, where <page> is
 *   <body data-page>.
 * - Announces the change with the 'languagechange:site' event ({ detail: { lang } }).
 *   Page scripts (projects.js, tools.js...) listen to it to re-render their data.
 * - Reveals the content hidden by html.i18n-pending (set in the <head> by
 *   scripts/templates/head.html) once the page and its data are translated.
 *
 * The HTML is written in English, so English pages are complete before this runs.
 */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var DEFAULT = 'en';

  // Page scripts push the promise of their first render here, so a page shown
  // in another language is only revealed once texts and data are translated.
  window.siteReady = window.siteReady || [];

  /**
   * Language saved by the user on any page of the site.
   * @returns {?string} The stored code, or null if none or storage is blocked.
   */
  function readStoredLang() {
    try { return localStorage.getItem('lang'); } catch (error) { return null; }
  }

  /**
   * Language to show on load: saved choice, then browser language, then English.
   * @returns {string} A code from SUPPORTED.
   */
  function detectLang() {
    var stored = readStoredLang();
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browser = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(browser) !== -1 ? browser : DEFAULT;
  }

  /**
   * Read a dotted key ('common.nav.home') from the loaded translations.
   * @param {Object} data Translations keyed by file name ('common', page key).
   * @param {string} key Dotted path.
   * @returns {*} The value, or undefined if any part of the path is missing.
   */
  function resolve(data, key) {
    return key.split('.').reduce(function (obj, part) {
      return obj && obj[part];
    }, data);
  }

  /**
   * Escape text for insertion as HTML, using the browser's own serializer.
   * @param {string} str Plain text.
   * @returns {string} HTML-safe text.
   */
  function escapeHtml(str) {
    var span = document.createElement('span');
    span.textContent = str;
    return span.innerHTML;
  }

  /**
   * Fill a .tech-tags element with one tag per comma-separated technology.
   * @param {Element} el Target element.
   * @param {string} text Comma-separated list ('Java, Spring, SQL').
   */
  function renderTechTags(el, text) {
    var tags = text.split(',').map(function (tag) {
      return tag.trim();
    }).filter(Boolean);

    el.innerHTML = tags.map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');
  }

  /**
   * Replace the text of every [data-i18n] element with its translation.
   * Elements whose key is missing keep their current text. Translations are
   * always set as text (never HTML), except .tech-tags, which become tags.
   * @param {Object} data Translations keyed by file name ('common', page key).
   */
  function applyTranslations(data) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = resolve(data, el.dataset.i18n);
      if (val === undefined) return;

      if (el.classList.contains('tech-tags')) {
        renderTechTags(el, val);
      } else {
        el.textContent = val;
      }
    });
  }

  /**
   * Translate the document title and meta description.
   * @param {Object} pageData The page's locale file (page_title, page_desc).
   */
  function updatePageMeta(pageData) {
    var description = document.querySelector('meta[name="description"]');

    if (pageData.page_title) document.title = pageData.page_title;
    if (pageData.page_desc && description) description.setAttribute('content', pageData.page_desc);
  }

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
   * Apply a language to the page and remember it for the whole site.
   * Saves the choice, updates <html lang> and the active selector link, loads
   * and applies the translations, then fires 'languagechange:site'.
   * @param {string} lang Code from SUPPORTED.
   * @returns {Promise} Resolves when the texts are applied; never rejects
   *   (errors are logged so the page is still revealed).
   */
  function setLang(lang) {
    var pageKey = document.body.dataset.page || 'home';
    var siteRoot = document.body.dataset.siteRoot || '';
    var base = siteRoot + 'locales/' + lang + '/';

    try { localStorage.setItem('lang', lang); } catch (error) { /* storage blocked */ }
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('.lang a[data-lang]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.lang === lang);
    });

    return Promise.all([
      getJson(base + 'common.json'),
      getJson(base + pageKey + '.json')
    ]).then(function (results) {
      var data = {};
      data.common = results[0];
      data[pageKey] = results[1];

      applyTranslations(data);
      updatePageMeta(results[1]);
      document.dispatchEvent(new CustomEvent('languagechange:site', { detail: { lang: lang } }));
    }).catch(function (error) {
      console.error(error);
    });
  }

  /**
   * Change the language from the selector, cross-fading the page where View
   * Transitions are supported (animation defined in css/styles.css, TRANSITIONS).
   * Without support, or with reduced motion, the change is instant.
   * @param {string} lang Code from SUPPORTED.
   * @returns {Promise} Resolves when the language is applied and the fade ends.
   */
  function switchLang(lang) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduceMotion) return setLang(lang);
    return document.startViewTransition(function () { return setLang(lang); }).finished;
  }

  /**
   * Show the content hidden while the page was being translated. The CSS
   * transition on <main> fades it in; a CSS timeout shows it anyway after 1.5s.
   */
  function reveal() {
    document.documentElement.classList.remove('i18n-pending');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang a[data-lang]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (link.classList.contains('active')) return;
        switchLang(link.dataset.lang);
      });
    });

    // First render: translate, wait for the page scripts to re-render their data
    // (failures included), then reveal. reveal also runs if anything rejects.
    setLang(detectLang()).then(function () {
      return Promise.all(window.siteReady.map(function (promise) {
        return Promise.resolve(promise).catch(function () {});
      }));
    }).then(reveal, reveal);
  });
}());
