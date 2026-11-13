/*
 * Projects page (projects.html): renders the featured project cards
 * (data/bestProjects.json) into #projects-featured and the "other projects"
 * list (data/projects.json) into #projects-other-list, in the current language.
 *
 * Each featured card stores its modal content in data-* attributes, in both
 * languages, for the detail modal (js/lightbox.js). This file also exposes
 * window.FEATURED_LINK_TYPES and window.resolveFeaturedLink for that modal.
 *
 * Download links point straight to the installer for the visitor's system,
 * chosen by js/downloads.js, which must be loaded first.
 *
 * Re-renders on 'languagechange:site' (js/i18n.js). The English markup is
 * pre-rendered by scripts/build_content.py (render_featured_project,
 * render_other_project), which must produce the same markup: change both together.
 */
(function () {
  'use strict';

  // Link texts of the "other projects" list (same in both languages).
  var LINK_LABELS = {
    github: 'GitHub',
    demo: 'Demo',
    live_demo: 'Demo',
    web: 'Web',
    download: 'Download',
    repo1: 'Repo 1',
    repo2: 'Repo 2'
  };

  // Shared with lightbox.js: how each featured-project link type is labeled and styled.
  var FEATURED_LINK_TYPES = {
    github: { label: { en: 'View on GitHub', es: 'Ver en GitHub' }, className: 'btn primary' },
    demo:   { label: { en: 'Watch demo',     es: 'Ver demo' },      className: 'btn btn-demo' },
    live_demo: { label: { en: 'Open demo',   es: 'Abrir demo' },    className: 'btn btn-web' },
    web:    { label: { en: 'View website',   es: 'Ver web' },       className: 'btn btn-web' },
    download: { label: { en: 'Download app', es: 'Descargar aplicación' }, className: 'btn btn-download' }
  };
  window.FEATURED_LINK_TYPES = FEATURED_LINK_TYPES;

  /**
   * Final URL, label and style of a featured project link.
   * A download link with an installer for the visitor's system points to that
   * file and names the platform ("Download for macOS"; see js/downloads.js).
   * Any other link keeps its URL and the label of its type; unknown types look
   * like github.
   * @param {{type: string, url: string, assets: Object=}} link Link from bestProjects.json.
   * @param {string} lang Language code.
   * @returns {{className: string, label: string, url: string}}
   */
  function resolveFeaturedLink(link, lang) {
    var type = FEATURED_LINK_TYPES[link.type] || FEATURED_LINK_TYPES.github;
    var direct = link.type === 'download' ? window.desktopDownloads.resolve(link.url, link.assets) : null;

    return {
      className: type.className,
      label: direct
        ? (lang === 'es' ? 'Descargar para ' : 'Download for ') + direct.platform
        : type.label[lang] || type.label.en,
      url: direct ? direct.url : link.url
    };
  }
  window.resolveFeaturedLink = resolveFeaturedLink;

  /**
   * Target attributes of a link: pages of this site (demos, web apps) open in
   * the same tab; external links (GitHub, videos, downloads) in a new one.
   * @param {string} type Link type.
   * @returns {string} '' or the target/rel attributes.
   */
  function linkAttributes(type) {
    return ['demo', 'live_demo', 'web'].indexOf(type) !== -1
      ? ''
      : ' target="_blank" rel="noopener"';
  }

  // Data from the JSON files; null until loaded.
  var bestProjects = null;
  var otherProjects = null;

  /**
   * Escape text for insertion as HTML, using the browser's own serializer.
   * @param {*} str Value to show; null and undefined become ''.
   * @returns {string} HTML-safe text.
   */
  function escapeHtml(str) {
    var span = document.createElement('span');
    span.textContent = str == null ? '' : String(str);
    return span.innerHTML;
  }

  /**
   * Escape text for a double-quoted HTML attribute.
   * @param {*} str Value to store.
   * @returns {string} Attribute-safe text.
   */
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  /**
   * Fetch and parse a JSON file.
   * @param {string} url File URL.
   * @returns {Promise<Object>} Rejects if the response is not 2xx.
   */
  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  /**
   * Render a comma-separated technology list as tags.
   * @param {string} techStr 'Java, Spring, SQL'.
   * @returns {string} HTML of the tags.
   */
  function renderTags(techStr) {
    return (techStr || '').split(',').map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag.trim()) + '</span>';
    }).join('');
  }

  /**
   * Render the featured project cards.
   * Order: display_order, then file order for projects without it (stable).
   * The thumbnail wrapper keeps the modal content in both languages (data-*),
   * with lists joined by '|'; a thumbnail that fails to load is hidden.
   * @param {Array<Object>} projects bestProjects.json "projects".
   * @param {string} lang Language code.
   */
  function renderFeatured(projects, lang) {
    var container = document.getElementById('projects-featured');
    if (!container) return;

    var isEs = lang === 'es';
    var orderedProjects = projects.map(function (project, index) {
      return { project: project, index: index };
    }).sort(function (a, b) {
      var orderA = Number.isFinite(a.project.display_order) ? a.project.display_order : 1000 + a.index;
      var orderB = Number.isFinite(b.project.display_order) ? b.project.display_order : 1000 + b.index;
      return orderA - orderB;
    }).map(function (item) {
      return item.project;
    });
    var html = orderedProjects.map(function (project) {
      var title = isEs ? project.title_es : project.title_en;
      var cardDesc = isEs ? project.card_desc_es : project.card_desc_en;
      var links = project.links || [];
      var badgeClass = project.badge_variant === 'personal'
        ? 'project-badge project-badge-personal'
        : 'project-badge';

      var buttons = links.map(function (link) {
        var resolved = resolveFeaturedLink(link, lang);
        return '<a href="' + escapeAttr(resolved.url) + '" class="' + resolved.className + '"' + linkAttributes(link.type) + '>' +
          escapeHtml(resolved.label) +
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
          (project.badge_en ? '<span class="' + badgeClass + '">' + escapeHtml(isEs ? project.badge_es : project.badge_en) + '</span>' : '') +
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

  /**
   * Render the "other projects" list, in file order, and its count.
   * @param {Array<Object>} projects projects.json "other".
   * @param {string} lang Language code.
   */
  function renderOther(projects, lang) {
    var list = document.getElementById('projects-other-list');
    var count = document.getElementById('projects-other-count');
    if (!list) return;

    var html = projects.map(function (project) {
      var desc = lang === 'es' ? project.desc_es : project.desc_en;
      var links = (project.links || []).map(function (link) {
        return '<a href="' + escapeAttr(link.url) + '" class="link-' + escapeAttr(link.type) + '"' + linkAttributes(link.type) + '>' +
          escapeHtml(LINK_LABELS[link.type] || link.type) + '</a>';
      }).join(', ');

      return '<li><strong>' + escapeHtml(project.name) + '</strong> &mdash; ' +
        escapeHtml(desc) + ' ' + links + '</li>';
    }).join('');

    list.innerHTML = html;
    if (count) count.textContent = projects.length;
  }

  /**
   * Language currently applied to the page.
   * Read from <html lang>, which js/i18n.js sets before this script's
   * DOMContentLoaded handler runs (i18n.js is loaded first). Reading
   * localStorage here instead would throw when storage is blocked and would
   * miss a language taken from the browser settings.
   * @returns {string} Language code.
   */
  function currentLang() {
    return document.documentElement.lang || 'en';
  }

  /**
   * Render both sections with the data loaded so far.
   * @param {string} lang Language code.
   */
  function renderAll(lang) {
    if (bestProjects) renderFeatured(bestProjects, lang);
    if (otherProjects) renderOther(otherProjects, lang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('projects-featured')) return;

    var loaded = Promise.all([
      getJson('data/bestProjects.json'),
      getJson('data/projects.json')
    ]).then(function (results) {
      bestProjects = results[0].projects;
      otherProjects = results[1].other;
      renderAll(currentLang());
    });
    // Registered in siteReady so a translated page is only revealed after the
    // cards are rendered (see js/i18n.js).
    (window.siteReady = window.siteReady || []).push(loaded.catch(function () {}));

    // The cards are shown at once with the assumed architecture and rendered
    // again only if detection finds a different one.
    loaded.then(function () {
      return window.desktopDownloads.detectArchitecture();
    }).then(function (changed) {
      if (changed) renderAll(currentLang());
    }).catch(function (error) {
      console.error(error);
    });
  });

  document.addEventListener('languagechange:site', function (event) {
    renderAll(event.detail.lang);
  });
}());
