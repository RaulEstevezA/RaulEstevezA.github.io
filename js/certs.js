(function ($) {
  'use strict';

  if (!$('#certs-programs').length) return;

  function escapeHtml(str) {
    return $('<span>').text(str).html();
  }

  function certBadges(certs) {
    return certs.map(function (c) {
      var cls = 'cert-badge cert-badge--' + c.label.toLowerCase();
      return '<a href="' + escapeHtml(c.url) + '" class="' + cls + '" target="_blank" rel="noopener">' +
        escapeHtml(c.label) + '</a>';
    }).join('');
  }

  function renderPrograms(programs) {
    var html = programs.map(function (p) {
      return '<div class="cert-card">' +
        '<div class="cert-card-meta">' +
          '<span class="cert-provider">' + escapeHtml(p.provider) + '</span>' +
          '<span class="cert-year">'     + escapeHtml(String(p.year)) + '</span>' +
        '</div>' +
        '<p class="cert-name">' + escapeHtml(p.name) + '</p>' +
        '<div class="cert-badges">' + certBadges(p.certs) + '</div>' +
      '</div>';
    }).join('');
    $('#certs-programs').html(html);
  }

  function renderCourses(courses) {
    var count = courses.length;

    // Update the summary count
    $('#certs-all-count').text(count);

    var html = courses.map(function (c) {
      return '<li class="cert-item">' +
        '<span class="cert-item-name">'     + escapeHtml(c.name)     + '</span>' +
        '<span class="cert-item-provider">' + escapeHtml(c.provider) + ' · ' + escapeHtml(String(c.year)) + '</span>' +
        '<span class="cert-badges">'        + certBadges(c.certs)    + '</span>' +
      '</li>';
    }).join('');
    $('#certs-all-list').html(html);
  }

  $.getJSON('/data/certificates.json').done(function (data) {
    if (data.programs) renderPrograms(data.programs);
    if (data.courses)  renderCourses(data.courses);
  });

}(jQuery));
