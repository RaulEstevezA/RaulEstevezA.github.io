(function () {
  'use strict';

  var games = [];
  var currentLang = document.documentElement.lang || 'en';

  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function render() {
    var container = document.getElementById('games-list');
    var emptyState = document.getElementById('games-empty');
    var playLabel = currentLang === 'es' ? 'Jugar' : 'Play';
    var codeLabel = currentLang === 'es' ? 'Ver código' : 'View code';

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
      var codeLink = game.repository_url
        ? '<a class="btn btn-code" href="' + encodeURI(game.repository_url) + '" target="_blank" rel="noopener">' + codeLabel + '</a>'
        : '';

      return '<article class="demo-card">' +
        logo +
        '<h3>' + escapeHtml(game.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="tech-tags">' + tags + '</div>' +
        '<div class="demo-card-actions tool-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(game.game_url) + '" target="_blank" rel="noopener">' + playLabel + '</a>' +
          codeLink +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  fetch('../data/games.json')
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
    });
}());
