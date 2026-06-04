(function () {
  'use strict';

  var LABELS = {
    tech: { en: 'Technologies:', es: 'Tecnologías:' }
  };

  var jobs = null;

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

  function renderTags(techStr) {
    return (techStr || '').split(',').map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag.trim()) + '</span>';
    }).join('');
  }

  function renderJobs(lang) {
    var container = document.getElementById('experience-list');
    if (!container || !jobs) return;

    var isEs = lang === 'es';
    var techLabel = LABELS.tech[lang] || LABELS.tech.en;

    var html = jobs.map(function (job) {
      var title      = isEs ? job.title_es      : job.title_en;
      var paragraphs = isEs ? job.paragraphs_es : job.paragraphs_en;
      var highlights = isEs ? job.highlights_es : job.highlights_en;
      var period     = isEs ? job.period_es     : job.period_en;

      var meta = '';
      if (job.company || period) {
        var parts = [];
        if (job.company) parts.push(escapeHtml(job.company));
        if (period) parts.push(escapeHtml(period));
        meta = '<p class="job-meta">' + parts.join(' &middot; ') + '</p>';
      }

      var paras = (paragraphs || []).map(function (p) {
        return '<p>' + escapeHtml(p) + '</p>';
      }).join('');

      var bullets = '';
      if (highlights && highlights.length) {
        bullets = '<ul>' + highlights.map(function (h) {
          return '<li>' + escapeHtml(h) + '</li>';
        }).join('') + '</ul>';
      }

      return '<article class="job-card">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
        meta +
        paras +
        bullets +
        '<p><strong>' + escapeHtml(techLabel) + '</strong> ' +
          '<span class="tech-tags">' + renderTags(job.tech) + '</span>' +
        '</p>' +
      '</article>';
    }).join('');

    container.innerHTML = html;
  }

  function currentLang() {
    return localStorage.getItem('lang') || document.documentElement.lang || 'en';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('experience-list')) return;

    getJson('data/experience.json').then(function (data) {
      jobs = data.jobs;
      renderJobs(currentLang());
    }).catch(function (error) {
      console.error(error);
    });
  });

  document.addEventListener('languagechange:site', function (event) {
    renderJobs(event.detail.lang);
  });
}());
