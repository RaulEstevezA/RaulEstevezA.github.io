/*
 * Courses page (courses.html): renders the education cards
 * (data/education.json), the professional certificate programs and the
 * collapsible list of individual courses (data/certificates.json), and opens
 * education documents (diplomas, transcripts) in a PDF dialog (#education-dialog).
 *
 * Only the education cards and the dialog depend on the language; certificates
 * are shown with their original English names. Re-renders on
 * 'languagechange:site' (js/i18n.js). The English markup is pre-rendered by
 * scripts/build_content.py (render_education, render_program, render_course),
 * which must produce the same markup: change both together.
 */
(function () {
  'use strict';

  // Dialog texts generated here (the document labels come from the JSON).
  var LABELS = {
    open:  { en: 'Open PDF', es: 'Abrir PDF' },
    close: { en: 'Close',    es: 'Cerrar' }
  };

  // Entries from education.json; null until loaded.
  var education = null;
  // Document shown in the dialog, kept to retitle it on a language change.
  var activeDocument = null;

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
   * Language to render on load (the one js/i18n.js has saved or applied).
   * @returns {string} Language code.
   */
  function currentLang() {
    return localStorage.getItem('lang') || document.documentElement.lang || 'en';
  }

  /**
   * Render the education cards in the given language. Does nothing until loaded.
   * Each document button stores the education and document indexes so the
   * click handler can find the PDF to open.
   * @param {string} lang Language code.
   */
  function renderEducation(lang) {
    var container = document.getElementById('education-list');
    if (!container || !education) return;

    var isEs = lang === 'es';
    container.innerHTML = education.map(function (item, index) {
      var documents = (item.documents || []).map(function (document, documentIndex) {
        var label = isEs ? document.label_es : document.label_en;
        return '<button type="button" class="btn education-document-btn" data-education-index="' + index +
          '" data-document-index="' + documentIndex + '">' + escapeHtml(label) + '</button>';
      }).join('');

      // Institution names are written right below, so the icons are decorative.
      var logos = (item.logos || []).map(function (src) {
        return '<img class="edu-logo" src="' + escapeHtml(src) + '" alt="" decoding="async">';
      }).join('');

      return '<article class="edu-card">' +
        '<p class="edu-title">' +
          (logos ? '<span class="edu-logos">' + logos + '</span>' : '') +
          '<strong>' + escapeHtml(isEs ? item.title_es : item.title_en) + '</strong>' +
        '</p>' +
        '<p>' + escapeHtml(item.institution) + '</p>' +
        '<p>' + escapeHtml(isEs ? item.period_es : item.period_en) + '</p>' +
        '<div class="edu-footer">' +
          '<p><em>' + escapeHtml(isEs ? item.grade_es : item.grade_en) + '</em></p>' +
          (documents ? '<div class="edu-documents">' + documents + '</div>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  }

  /**
   * Translate the dialog: title of the open document, iframe title and buttons.
   * @param {string} lang Language code.
   */
  function updateEducationDialog(lang) {
    var title = activeDocument ? (lang === 'es' ? activeDocument.label_es : activeDocument.label_en) : '';
    document.getElementById('education-dialog-title').textContent = title;
    document.getElementById('education-dialog-frame').title = title + ' PDF';
    document.getElementById('education-dialog-open').textContent = LABELS.open[lang] || LABELS.open.en;
    document.getElementById('education-dialog-close').setAttribute('aria-label', LABELS.close[lang] || LABELS.close.en);
  }

  /**
   * Certificate links as badges. The label also sets the badge style
   * (cert-badge--pdf, cert-badge--credly...).
   * @param {Array<{label: string, url: string}>} certs Certificate links.
   * @returns {string} HTML of the badges.
   */
  function certBadges(certs) {
    return certs.map(function (cert) {
      var cls = 'cert-badge cert-badge--' + cert.label.toLowerCase();
      return '<a href="' + escapeHtml(cert.url) + '" class="' + cls + '" target="_blank" rel="noopener">' +
        escapeHtml(cert.label) + '</a>';
    }).join('');
  }

  /**
   * Render the professional certificate program cards, in file order.
   * @param {Array<Object>} programs certificates.json "programs".
   */
  function renderPrograms(programs) {
    var container = document.getElementById('certs-programs');
    if (!container) return;

    var html = programs.map(function (program) {
      return '<div class="cert-card">' +
        '<div class="cert-card-meta">' +
          '<span class="cert-provider">' + escapeHtml(program.provider) + '</span>' +
          '<span class="cert-year">' + escapeHtml(program.year) + '</span>' +
        '</div>' +
        '<p class="cert-name">' + escapeHtml(program.name) + '</p>' +
        '<div class="cert-badges">' + certBadges(program.certs) + '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render the individual course list and its count (shown in the list summary).
   * @param {Array<Object>} courses certificates.json "courses".
   */
  function renderCourses(courses) {
    var count = document.getElementById('certs-all-count');
    var list = document.getElementById('certs-all-list');
    if (!list) return;

    if (count) count.textContent = courses.length;

    var html = courses.map(function (course) {
      return '<li class="cert-item">' +
        '<span class="cert-item-name">' + escapeHtml(course.name) + '</span>' +
        '<span class="cert-item-provider">' + escapeHtml(course.provider) + ' &middot; ' + escapeHtml(course.year) + '</span>' +
        '<span class="cert-badges">' + certBadges(course.certs) + '</span>' +
      '</li>';
    }).join('');

    list.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('certs-programs')) return;

    var dialog = document.getElementById('education-dialog');
    var frame = document.getElementById('education-dialog-frame');
    var openLink = document.getElementById('education-dialog-open');

    // One delegated listener: the cards are replaced on every language change.
    document.getElementById('education-list').addEventListener('click', function (event) {
      var button = event.target.closest('[data-document-index]');
      if (!button || !education) return;
      var item = education[Number(button.dataset.educationIndex)];
      activeDocument = item && item.documents && item.documents[Number(button.dataset.documentIndex)];
      if (!activeDocument) return;
      frame.src = activeDocument.url;
      openLink.href = activeDocument.url;
      updateEducationDialog(currentLang());
      dialog.showModal();
    });

    document.getElementById('education-dialog-close').addEventListener('click', function () {
      dialog.close();
    });
    // A click on the dialog element itself (not its content) is a click on the backdrop.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    // Unload the PDF when closing, so it does not keep using memory in the background.
    dialog.addEventListener('close', function () {
      frame.removeAttribute('src');
      activeDocument = null;
    });
    updateEducationDialog(currentLang());

    // Registered in siteReady so a translated page is only revealed after the
    // cards are rendered (see js/i18n.js).
    (window.siteReady = window.siteReady || []).push(Promise.all([
      getJson('data/education.json'),
      getJson('data/certificates.json')
    ]).then(function (results) {
      education = results[0].education;
      renderEducation(currentLang());
      if (results[1].programs) renderPrograms(results[1].programs);
      if (results[1].courses) renderCourses(results[1].courses);
    }).catch(function (error) {
      console.error(error);
    }));
  });

  document.addEventListener('languagechange:site', function (event) {
    renderEducation(event.detail.lang);
    updateEducationDialog(event.detail.lang);
  });
}());
