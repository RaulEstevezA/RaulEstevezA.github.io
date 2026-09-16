(function () {
  'use strict';

  var LABELS = {
    tech:         { en: 'Technologies:',                                                          es: 'Tecnologías:' },
    recLetter:    { en: 'View recommendation letter',                                             es: 'Ver carta de recomendación' },
    recLetterTitle: { en: 'Recommendation letter', es: 'Carta de recomendación' },
    recLetterOpen: { en: 'Open PDF', es: 'Abrir PDF' },
    recLetterClose: { en: 'Close', es: 'Cerrar' },
    recLetterNote:{ en: 'The original unredacted version is available upon request.',             es: 'La versión original sin censura está disponible bajo petición.' }
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
    var techLabel         = LABELS.tech[lang]         || LABELS.tech.en;
    var recLetterLabel    = LABELS.recLetter[lang]    || LABELS.recLetter.en;
    var recLetterNote     = LABELS.recLetterNote[lang]|| LABELS.recLetterNote.en;

    var html = jobs.map(function (job, index) {
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

      var recLetterLink = '';
      if (job.rec_letter) {
        recLetterLink = '<p class="job-letter"><button type="button" class="btn primary letter-btn" data-letter-index="' + index + '">' +
          escapeHtml(recLetterLabel) + '</button></p>' +
          '<p class="job-meta">' + escapeHtml(recLetterNote) + '</p>';
      }

      return '<article class="job-card">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
        meta +
        paras +
        bullets +
        '<p><strong>' + escapeHtml(techLabel) + '</strong> ' +
          '<span class="tech-tags">' + renderTags(job.tech) + '</span>' +
        '</p>' +
        recLetterLink +
      '</article>';
    }).join('');

    container.innerHTML = html;
  }

  function currentLang() {
    return localStorage.getItem('lang') || document.documentElement.lang || 'en';
  }

  function updateDialogLabels(lang) {
    var title = LABELS.recLetterTitle[lang] || LABELS.recLetterTitle.en;
    document.getElementById('letter-dialog-title').textContent = title;
    document.getElementById('letter-dialog-frame').title = title + ' PDF';
    document.getElementById('letter-dialog-open').textContent = LABELS.recLetterOpen[lang] || LABELS.recLetterOpen.en;
    document.getElementById('letter-dialog-close').setAttribute('aria-label', LABELS.recLetterClose[lang] || LABELS.recLetterClose.en);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('experience-list')) return;

    var dialog = document.getElementById('letter-dialog');
    var frame = document.getElementById('letter-dialog-frame');
    var openLink = document.getElementById('letter-dialog-open');

    document.getElementById('experience-list').addEventListener('click', function (event) {
      var button = event.target.closest('[data-letter-index]');
      if (!button || !jobs) return;
      var job = jobs[Number(button.dataset.letterIndex)];
      if (!job || !job.rec_letter) return;
      frame.src = job.rec_letter;
      openLink.href = job.rec_letter;
      dialog.showModal();
    });

    document.getElementById('letter-dialog-close').addEventListener('click', function () {
      dialog.close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      frame.removeAttribute('src');
    });
    updateDialogLabels(currentLang());

    getJson('data/experience.json').then(function (data) {
      jobs = data.jobs;
      renderJobs(currentLang());
    }).catch(function (error) {
      console.error(error);
    });
  });

  document.addEventListener('languagechange:site', function (event) {
    renderJobs(event.detail.lang);
    updateDialogLabels(event.detail.lang);
  });
}());
