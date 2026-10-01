(function () {
  'use strict';

  var demos = [];
  var currentLang = document.documentElement.lang || 'en';

  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function getLabels(lang) {
    return lang === 'es'
      ? { open: 'Abrir demo', code: 'Ver código' }
      : { open: 'Open demo', code: 'View code' };
  }

  function render() {
    var container = document.getElementById('demos-list');
    var labels = getLabels(currentLang);

    container.innerHTML = demos.map(function (demo) {
      var description = demo['description_' + currentLang] || demo.description_en;
      var tags = demo.technologies.map(function (technology) {
        return '<span class="tag">' + escapeHtml(technology) + '</span>';
      }).join('');

      return '<article class="demo-card">' +
        '<h3>' + escapeHtml(demo.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="tech-tags">' + tags + '</div>' +
        '<div class="demo-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(demo.demo_url) + '" target="_blank" rel="noopener">' + labels.open + '</a>' +
          '<a class="btn" href="' + encodeURI(demo.repository_url) + '" target="_blank" rel="noopener">' + labels.code + '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  fetch('data/demos.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load data/demos.json');
      return response.json();
    })
    .then(function (data) {
      demos = data.demos;
      render();
    })
    .catch(function (error) {
      console.error(error);
    });
}());
