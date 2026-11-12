(function () {
  'use strict';

  var siteRoot = document.body.dataset.siteRoot || '';
  var contentPromise = Promise.all([
    getJson(siteRoot + 'data/demos.json'),
    getJson(siteRoot + 'data/games.json')
  ]);
  var localeCache = {};

  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  function getLocale(lang) {
    if (!localeCache[lang]) {
      localeCache[lang] = getJson(siteRoot + 'locales/' + lang + '/lab.json');
    }
    return localeCache[lang];
  }

  function formatCount(locale, key, count) {
    var suffix = count === 1 ? '_one' : '_other';
    return locale[key + suffix].replace('{count}', count);
  }

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

  document.addEventListener('languagechange:site', function (event) {
    (window.siteReady = window.siteReady || []).push(renderCounts(event.detail.lang));
  });
}());
