(function ($) {
  'use strict';

  var VIEW_GITHUB = { en: 'View on GitHub', es: 'Ver en GitHub' };

  var LINK_LABELS = {
    github: 'GitHub',
    demo:   'Demo',
    repo1:  'Repo 1',
    repo2:  'Repo 2'
  };

  function escapeHtml(str) {
    return $('<span>').text(str).html();
  }

  function escapeAttr(str) {
    return $('<span>').text(String(str || '')).html().replace(/"/g, '&quot;');
  }

  function renderTags(techStr) {
    return (techStr || '').split(',').map(function (t) {
      return '<span class="tag">' + escapeHtml(t.trim()) + '</span>';
    }).join('');
  }

  function renderFeatured(projects, lang) {
    var isEs = lang === 'es';
    var html = projects.map(function (p) {
      var title    = isEs ? p.title_es     : p.title_en;
      var cardDesc = isEs ? p.card_desc_es : p.card_desc_en;
      var btnLabel = VIEW_GITHUB[lang] || VIEW_GITHUB.en;

      return '<article class="project-card">' +
        '<div class="project-thumb-wrap"' +
          ' data-title="'       + escapeAttr(p.title_en)                    + '"' +
          ' data-title-es="'    + escapeAttr(p.title_es)                    + '"' +
          ' data-desc="'        + escapeAttr(p.modal_desc_en)               + '"' +
          ' data-desc-es="'     + escapeAttr(p.modal_desc_es)               + '"' +
          ' data-features="'    + escapeAttr(p.modal_features_en.join('|')) + '"' +
          ' data-features-es="' + escapeAttr(p.modal_features_es.join('|')) + '"' +
          ' data-tech="'        + escapeAttr(p.modal_tech)                  + '"' +
          ' data-images="'      + escapeAttr(p.modal_images.join('|'))      + '"' +
          ' data-github="'      + escapeAttr(p.github)                      + '">' +
          '<img src="'          + escapeAttr(p.thumb)                       + '"' +
               ' alt="'         + escapeAttr(p.thumb_alt)                   + '"' +
               ' class="project-thumb"' +
               ' onerror="this.parentElement.style.display=\'none\'">' +
        '</div>' +
        '<div class="project-card-body">' +
          '<h3>' + escapeHtml(title)    + '</h3>' +
          '<p>'  + escapeHtml(cardDesc) + '</p>' +
        '</div>' +
        '<div class="project-card-footer">' +
          '<p class="tech-tags">' + renderTags(p.card_tech) + '</p>' +
          '<a href="' + escapeAttr(p.github) + '" class="btn primary" target="_blank" rel="noopener">' +
            escapeHtml(btnLabel) +
          '</a>' +
        '</div>' +
      '</article>';
    }).join('');

    $('#projects-featured').html(html);
  }

  function renderOther(projects, lang) {
    var html = projects.map(function (p) {
      var desc  = lang === 'es' ? p.desc_es : p.desc_en;
      var links = (p.links || []).map(function (l) {
        return '<a href="' + escapeAttr(l.url) + '" target="_blank" rel="noopener">' +
          escapeHtml(LINK_LABELS[l.type] || l.type) + '</a>';
      }).join(', ');

      return '<li><strong>' + escapeHtml(p.name) + '</strong> — ' +
        escapeHtml(desc) + ' ' + links + '</li>';
    }).join('');

    $('#projects-other-list').html(html);
    $('#projects-other-count').text(projects.length);
  }

  $.when(
    $.getJSON('data/bestProjects.json'),
    $.getJSON('data/projects.json')
  ).done(function (bestRes, otherRes) {
    var best     = bestRes[0].projects;
    var projects = otherRes[0];
    var lang = localStorage.getItem('lang') || 'en';

    if (best)           renderFeatured(best, lang);
    if (projects.other) renderOther(projects.other, lang);

    $(document).on('click', '.lang a[data-lang]', function () {
      var newLang = $(this).data('lang');
      if (best)           renderFeatured(best, newLang);
      if (projects.other) renderOther(projects.other, newLang);
    });
  });

}(jQuery));
