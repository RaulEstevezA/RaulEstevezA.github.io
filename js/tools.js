(function () {
  'use strict';

  var tools = [];
  var currentLang = document.documentElement.lang || 'en';

  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function getLabels(lang) {
    return lang === 'es'
      ? { open: 'Abrir herramienta', code: 'Ver código' }
      : { open: 'Open tool', code: 'View code' };
  }

  function render() {
    var container = document.getElementById('tools-list');
    var emptyState = document.getElementById('tools-empty');
    var labels = getLabels(currentLang);

    var orderedTools = tools.map(function (tool, index) {
      return { tool: tool, index: index };
    }).sort(function (a, b) {
      var orderA = Number.isFinite(a.tool.display_order) ? a.tool.display_order : 1000 + a.index;
      var orderB = Number.isFinite(b.tool.display_order) ? b.tool.display_order : 1000 + b.index;
      return orderA - orderB;
    }).map(function (item) {
      return item.tool;
    });

    emptyState.hidden = orderedTools.length > 0;
    container.innerHTML = orderedTools.map(function (tool) {
      var description = tool['description_' + currentLang] || tool.description_en || '';
      var image = tool.image
        ? '<img class="demo-card-image" src="' + encodeURI(tool.image) + '" alt="" loading="lazy">'
        : '';
      var tags = (tool.technologies || []).map(function (technology) {
        return '<span class="tag">' + escapeHtml(technology) + '</span>';
      }).join('');
      var badge = tool['badge_' + currentLang] || tool.badge_en;
      var codeLink = tool.repository_url
        ? '<a class="btn" href="' + encodeURI(tool.repository_url) + '" target="_blank" rel="noopener">' + labels.code + '</a>'
        : '';

      return '<article class="demo-card' + (tool.featured ? ' demo-card-featured' : '') + '">' +
        image +
        (badge ? '<span class="project-badge">' + escapeHtml(badge) + '</span>' : '') +
        '<h3>' + escapeHtml(tool.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="tech-tags">' + tags + '</div>' +
        '<div class="demo-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(tool.tool_url) + '" target="_blank" rel="noopener">' + labels.open + '</a>' +
          codeLink +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  fetch('../data/tools.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load data/tools.json');
      return response.json();
    })
    .then(function (data) {
      tools = Array.isArray(data.tools) ? data.tools : [];
      render();
    })
    .catch(function (error) {
      console.error(error);
    });
}());
