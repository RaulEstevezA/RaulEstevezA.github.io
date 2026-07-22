(function () {
  'use strict';

  var LINK_LABELS = {
    github: 'GitHub',
    demo: 'Demo',
    repo1: 'Repo 1',
    repo2: 'Repo 2'
  };

  // Shared with lightbox.js: how each featured-project link type is labeled and styled.
  var FEATURED_LINK_TYPES = {
    github: { label: { en: 'View on GitHub', es: 'Ver en GitHub' }, className: 'btn primary' },
    demo:   { label: { en: 'Watch demo',     es: 'Ver demo' },      className: 'btn btn-demo' },
    web:    { label: { en: 'View website',   es: 'Ver web' },       className: 'btn btn-web' }
  };
  window.FEATURED_LINK_TYPES = FEATURED_LINK_TYPES;

  var bestProjects = null;
  var otherProjects = null;

  function escapeHtml(str) {
    var span = document.createElement('span');
    span.textContent = str == null ? '' : String(str);
    return span.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  function renderTags(techStr) {
    return (techStr || '').split(',').map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag.trim()) + '</span>';
    }).join('');
  }

  function renderFeatured(projects, lang) {
    var container = document.getElementById('projects-featured');
    if (!container) return;

    var isEs = lang === 'es';
    var html = projects.map(function (project) {
      var title = isEs ? project.title_es : project.title_en;
      var cardDesc = isEs ? project.card_desc_es : project.card_desc_en;
      var links = project.links || [];

      var buttons = links.map(function (link) {
        var type = FEATURED_LINK_TYPES[link.type] || FEATURED_LINK_TYPES.github;
        var label = type.label[lang] || type.label.en;
        return '<a href="' + escapeAttr(link.url) + '" class="' + type.className + '" target="_blank" rel="noopener">' +
          escapeHtml(label) +
        '</a>';
      }).join('');

      return '<article class="project-card">' +
        '<div class="project-thumb-wrap"' +
          ' data-title="' + escapeAttr(project.title_en) + '"' +
          ' data-title-es="' + escapeAttr(project.title_es) + '"' +
          ' data-desc="' + escapeAttr(project.modal_desc_en) + '"' +
          ' data-desc-es="' + escapeAttr(project.modal_desc_es) + '"' +
          ' data-features="' + escapeAttr(project.modal_features_en.join('|')) + '"' +
          ' data-features-es="' + escapeAttr(project.modal_features_es.join('|')) + '"' +
          ' data-tech="' + escapeAttr(project.modal_tech) + '"' +
          ' data-images="' + escapeAttr(project.modal_images.join('|')) + '"' +
          ' data-links="' + escapeAttr(JSON.stringify(links)) + '"' +
          (project.portrait ? ' data-portrait="true"' : '') + '>' +
          '<img src="' + escapeAttr(project.thumb) + '"' +
               ' alt="' + escapeAttr(project.thumb_alt) + '"' +
               ' class="project-thumb"' +
               ' width="160" height="120" decoding="async"' +
               ' onerror="this.parentElement.style.display=\'none\'">' +
        '</div>' +
        '<div class="project-card-body">' +
          (project.badge_en ? '<span class="project-badge">' + escapeHtml(isEs ? project.badge_es : project.badge_en) + '</span>' : '') +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p>' + escapeHtml(cardDesc) + '</p>' +
        '</div>' +
        '<div class="project-card-footer">' +
          '<p class="tech-tags">' + renderTags(project.card_tech) + '</p>' +
          '<div class="project-card-buttons">' + buttons + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    container.innerHTML = html;
  }

  function renderOther(projects, lang) {
    var list = document.getElementById('projects-other-list');
    var count = document.getElementById('projects-other-count');
    if (!list) return;

    var html = projects.map(function (project) {
      var desc = lang === 'es' ? project.desc_es : project.desc_en;
      var links = (project.links || []).map(function (link) {
        return '<a href="' + escapeAttr(link.url) + '" target="_blank" rel="noopener">' +
          escapeHtml(LINK_LABELS[link.type] || link.type) + '</a>';
      }).join(', ');

      return '<li><strong>' + escapeHtml(project.name) + '</strong> &mdash; ' +
        escapeHtml(desc) + ' ' + links + '</li>';
    }).join('');

    list.innerHTML = html;
    if (count) count.textContent = projects.length;
  }

  function currentLang() {
    return localStorage.getItem('lang') || document.documentElement.lang || 'en';
  }

  function renderAll(lang) {
    if (bestProjects) renderFeatured(bestProjects, lang);
    if (otherProjects) renderOther(otherProjects, lang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('projects-featured')) return;

    Promise.all([
      getJson('data/bestProjects.json'),
      getJson('data/projects.json')
    ]).then(function (results) {
      bestProjects = results[0].projects;
      otherProjects = results[1].other;
      renderAll(currentLang());
    }).catch(function (error) {
      console.error(error);
    });
  });

  document.addEventListener('languagechange:site', function (event) {
    renderAll(event.detail.lang);
  });
}());
