/*
 * Experience page (experience.html): renders the job cards from
 * data/experience.json into #experience-list, in the current language, and
 * opens the recommendation letters in a PDF dialog (#letter-dialog).
 *
 * Re-renders on 'languagechange:site' (js/i18n.js). The English cards are
 * pre-rendered by scripts/build_content.py (render_job), which must produce
 * the same markup: change both together.
 */
(function () {
  'use strict';

  // Interface texts generated here (the job texts come from the JSON).
  var LABELS = {
    tech:         { en: 'Technologies:',                                                          es: 'Tecnologías:' },
    recLetter:    { en: 'View recommendation letter',                                             es: 'Ver carta de recomendación' },
    liveDemo:     { en: 'Explore the interactive demo',                                           es: 'Explorar la demo interactiva' },
    recLetterTitle: { en: 'Recommendation letter', es: 'Carta de recomendación' },
    recLetterOpen: { en: 'Open PDF', es: 'Abrir PDF' },
    recLetterClose: { en: 'Close', es: 'Cerrar' },
    recLetterNote:{ en: 'The original unredacted version is available upon request.',             es: 'La versión original sin censura está disponible bajo petición.' }
  };

  // Jobs from experience.json; null until loaded.
  var jobs = null;

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
   * Render every job card in the given language. Does nothing until the data is loaded.
   * Each card shows: title, company and period, paragraphs, highlights,
   * technologies, an optional interactive demo callout and an optional
   * recommendation letter button. The button stores the job index
   * (data-letter-index) so the click handler can find its PDF.
   * @param {string} lang Language code.
   */
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
      var demoNote   = isEs ? job.demo_note_es  : job.demo_note_en;

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

      var demoLink = '';
      if (job.demo_url) {
        demoLink = '<div class="job-demo-callout">' +
          '<div><strong>' + escapeHtml(LABELS.liveDemo[lang] || LABELS.liveDemo.en) + '</strong>' +
          (demoNote ? '<p>' + escapeHtml(demoNote) + '</p>' : '') + '</div>' +
          '<a class="btn btn-web" href="' + escapeHtml(job.demo_url) + '">' +
            escapeHtml(LABELS.liveDemo[lang] || LABELS.liveDemo.en) +
          '</a>' +
        '</div>';
      }

      return '<article class="job-card">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
        meta +
        paras +
        bullets +
        '<p><strong>' + escapeHtml(techLabel) + '</strong> ' +
          '<span class="tech-tags">' + renderTags(job.tech) + '</span>' +
        '</p>' +
        demoLink +
        recLetterLink +
      '</article>';
    }).join('');

    container.innerHTML = html;
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
   * Translate the texts of the recommendation letter dialog.
   * @param {string} lang Language code.
   */
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

    // One delegated listener: the cards are replaced on every language change.
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
    // A click on the dialog element itself (not its content) is a click on the backdrop.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    // Unload the PDF when closing, so it does not keep using memory in the background.
    dialog.addEventListener('close', function () {
      frame.removeAttribute('src');
    });
    updateDialogLabels(currentLang());

    // Registered in siteReady so a translated page is only revealed after the
    // cards are rendered (see js/i18n.js).
    (window.siteReady = window.siteReady || []).push(getJson('data/experience.json').then(function (data) {
      jobs = data.jobs;
      renderJobs(currentLang());
    }).catch(function (error) {
      console.error(error);
    }));
  });

  document.addEventListener('languagechange:site', function (event) {
    renderJobs(event.detail.lang);
    updateDialogLabels(event.detail.lang);
  });
}());
