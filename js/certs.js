(function () {
  'use strict';

  var LABELS = {
    open:  { en: 'Open PDF', es: 'Abrir PDF' },
    close: { en: 'Close',    es: 'Cerrar' }
  };

  var education = null;
  var activeDocument = null;

  function escapeHtml(str) {
    var span = document.createElement('span');
    span.textContent = str == null ? '' : String(str);
    return span.innerHTML;
  }

  function getJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url);
      return response.json();
    });
  }

  function currentLang() {
    return localStorage.getItem('lang') || document.documentElement.lang || 'en';
  }

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

      return '<article class="edu-card">' +
        '<p><strong>' + escapeHtml(isEs ? item.title_es : item.title_en) + '</strong></p>' +
        '<p>' + escapeHtml(item.institution) + '</p>' +
        '<p>' + escapeHtml(isEs ? item.period_es : item.period_en) + '</p>' +
        '<div class="edu-footer">' +
          '<p><em>' + escapeHtml(isEs ? item.grade_es : item.grade_en) + '</em></p>' +
          (documents ? '<div class="edu-documents">' + documents + '</div>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  }

  function updateEducationDialog(lang) {
    var title = activeDocument ? (lang === 'es' ? activeDocument.label_es : activeDocument.label_en) : '';
    document.getElementById('education-dialog-title').textContent = title;
    document.getElementById('education-dialog-frame').title = title + ' PDF';
    document.getElementById('education-dialog-open').textContent = LABELS.open[lang] || LABELS.open.en;
    document.getElementById('education-dialog-close').setAttribute('aria-label', LABELS.close[lang] || LABELS.close.en);
  }

  function certBadges(certs) {
    return certs.map(function (cert) {
      var cls = 'cert-badge cert-badge--' + cert.label.toLowerCase();
      return '<a href="' + escapeHtml(cert.url) + '" class="' + cls + '" target="_blank" rel="noopener">' +
        escapeHtml(cert.label) + '</a>';
    }).join('');
  }

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
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      frame.removeAttribute('src');
      activeDocument = null;
    });
    updateEducationDialog(currentLang());

    Promise.all([
      getJson('data/education.json'),
      getJson('data/certificates.json')
    ]).then(function (results) {
      education = results[0].education;
      renderEducation(currentLang());
      if (results[1].programs) renderPrograms(results[1].programs);
      if (results[1].courses) renderCourses(results[1].courses);
    }).catch(function (error) {
      console.error(error);
    });
  });

  document.addEventListener('languagechange:site', function (event) {
    renderEducation(event.detail.lang);
    updateEducationDialog(event.detail.lang);
  });
}());
