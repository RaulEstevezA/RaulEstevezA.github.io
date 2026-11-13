/*
 * Demos page (demos/): renders the demo cards from data/demos.json into
 * #demos-list, in the current language.
 *
 * Re-renders on 'languagechange:site' (js/i18n.js). The English cards are
 * pre-rendered by scripts/build_content.py (render_demo), which must produce
 * the same markup: change both together.
 */
(function () {
  'use strict';

  var demos = [];
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
   * Button labels of the cards.
   * @param {string} lang Language code.
   * @returns {{open: string, code: string}} Labels for "open demo" and "view code".
   */
  function getLabels(lang) {
    return lang === 'es'
      ? { open: 'Abrir demo', code: 'Ver código' }
      : { open: 'Open demo', code: 'View code' };
  }

  /**
   * Render all demo cards.
   * Order: display_order, then file order for demos without it (stable).
   * Descriptions and badges fall back to English when missing.
   */
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

      return '<article class="demo-card demo-card-row' + (demo.featured ? ' demo-card-featured' : '') + '">' +
        image +
        '<div class="demo-card-content">' +
          (badge ? '<span class="project-badge">' + escapeHtml(badge) + '</span>' : '') +
          '<h3>' + escapeHtml(demo.name) + '</h3>' +
          '<p>' + escapeHtml(description) + '</p>' +
          '<div class="tech-tags">' + tags + '</div>' +
          '<div class="demo-card-actions">' +
            '<a class="btn btn-web" href="' + encodeURI(demo.demo_url) + '">' + labels.open + '</a>' +
            codeLink +
          '</div>' +
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
  (window.siteReady = window.siteReady || []).push(fetch('../data/demos.json')
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
    }));
}());
