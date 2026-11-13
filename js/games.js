/*
 * Games page (games/): renders the game cards from data/games.json into
 * #games-list, in the current language.
 *
 * Re-renders on 'languagechange:site' (js/i18n.js). The English cards are
 * pre-rendered by scripts/build_content.py (render_game), which must produce
 * the same markup: change both together.
 */
(function () {
  'use strict';

  var games = [];
  var currentLang = document.documentElement.lang || 'en';

  /**
   * Escape text for insertion as HTML, using the browser's own serializer.
   * @param {string} value Plain text.
   * @returns {string} HTML-safe text.
   */
  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  /**
   * Render all game cards, or show #games-empty when there are none.
   * Order: display_order, with games without it at the end (1000).
   * Descriptions fall back to English when the current language has none.
   */
  function render() {
    var container = document.getElementById('games-list');
    var emptyState = document.getElementById('games-empty');
    var playLabel = currentLang === 'es' ? 'Jugar' : 'Play';

    var orderedGames = games.slice().sort(function (a, b) {
      return (a.display_order || 1000) - (b.display_order || 1000);
    });

    emptyState.hidden = orderedGames.length > 0;
    container.innerHTML = orderedGames.map(function (game) {
      var description = game['description_' + currentLang] || game.description_en || '';
      var logoClass = game.pixel_art_logo ? ' pixel-art-logo' : '';
      var logo = game.logo
        ? '<img class="demo-card-image' + logoClass + '" src="' + encodeURI(game.logo) + '" alt="' + escapeHtml(game.name) + ' logo" loading="lazy">'
        : '';
      var tags = (game.technologies || []).map(function (technology) {
        return '<span class="tag">' + escapeHtml(technology) + '</span>';
      }).join('');
      return '<article class="demo-card">' +
        logo +
        '<h3>' + escapeHtml(game.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="tech-tags">' + tags + '</div>' +
        '<div class="demo-card-actions tool-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(game.game_url) + '">' + playLabel + '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  // Load the data once. Registered in siteReady so a translated page is only
  // revealed after the cards are rendered (see js/i18n.js).
  (window.siteReady = window.siteReady || []).push(fetch('../data/games.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load data/games.json');
      return response.json();
    })
    .then(function (data) {
      games = Array.isArray(data.games) ? data.games : [];
      render();
    })
    .catch(function (error) {
      console.error(error);
    }));
}());
