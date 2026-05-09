(function () {
  'use strict';

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

    getJson('data/certificates.json').then(function (data) {
      if (data.programs) renderPrograms(data.programs);
      if (data.courses) renderCourses(data.courses);
    }).catch(function (error) {
      console.error(error);
    });
  });
}());
