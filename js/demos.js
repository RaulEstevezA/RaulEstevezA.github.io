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

    var orderedDemos = demos.map(function (demo, index) {
      return { demo: demo, index: index };
    }).sort(function (a, b) {
      var orderA = Number.isFinite(a.demo.display_order) ? a.demo.display_order : 1000 + a.index;
      var orderB = Number.isFinite(b.demo.display_order) ? b.demo.display_order : 1000 + b.index;
      return orderA - orderB;
    }).map(function (item) {
      return item.demo;
    });

    container.innerHTML = orderedDemos.map(function (demo) {
      var description = demo['description_' + currentLang] || demo.description_en;
      var image = demo.image
        ? '<img class="demo-card-image" src="' + encodeURI(demo.image) + '" alt="" loading="lazy">'
        : '';
      var tags = demo.technologies.map(function (technology) {
        return '<span class="tag">' + escapeHtml(technology) + '</span>';
      }).join('');
      var badge = demo['badge_' + currentLang] || demo.badge_en;
      var codeLink = demo.repository_url
        ? '<a class="btn" href="' + encodeURI(demo.repository_url) + '" target="_blank" rel="noopener">' + labels.code + '</a>'
        : '';

      return '<article class="demo-card' + (demo.featured ? ' demo-card-featured' : '') + '">' +
        image +
        (badge ? '<span class="project-badge">' + escapeHtml(badge) + '</span>' : '') +
        '<h3>' + escapeHtml(demo.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="tech-tags">' + tags + '</div>' +
        '<div class="demo-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(demo.demo_url) + '" target="_blank" rel="noopener">' + labels.open + '</a>' +
          codeLink +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  fetch('../data/demos.json')
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
