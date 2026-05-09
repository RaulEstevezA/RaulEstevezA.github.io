(function () {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var DEFAULT = 'en';

  function detectLang() {
    var stored = localStorage.getItem('lang');
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var browser = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(browser) !== -1 ? browser : DEFAULT;
  }

  function resolve(data, key) {
    return key.split('.').reduce(function (obj, part) {
      return obj && obj[part];
    }, data);
  }

  function escapeHtml(str) {
    var span = document.createElement('span');
    span.textContent = str;
    return span.innerHTML;
  }

  function renderTechTags(el, text) {
    var tags = text.split(',').map(function (tag) {
      return tag.trim();
    }).filter(Boolean);

    el.innerHTML = tags.map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');
  }

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

  function updatePageMeta(pageData) {
    var description = document.querySelector('meta[name="description"]');

    if (pageData.page_title) document.title = pageData.page_title;
    if (pageData.page_desc && description) description.setAttribute('content', pageData.page_desc);
  }

  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  function setLang(lang) {
    var pageKey = document.body.dataset.page || 'home';
    var base = 'locales/' + lang + '/';

    localStorage.setItem('lang', lang);
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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang a[data-lang]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        setLang(link.dataset.lang);
      });
    });

    setLang(detectLang());
  });
}());
