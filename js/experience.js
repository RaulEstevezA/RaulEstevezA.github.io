/*
 * Experience page (experience.html): opens the recommendation letters in a
 * PDF dialog (#letter-dialog).
 *
 * The job cards are rendered only by scripts/build_content.py, in both
 * languages; js/i18n.js swaps their texts. Each letter button carries the
 * PDF URL in data-url.
 */
(function () {
  'use strict';

  // Dialog texts generated here.
  var LABELS = {
    title: { en: 'Recommendation letter', es: 'Carta de recomendación' },
    open:  { en: 'Open PDF',              es: 'Abrir PDF' },
    close: { en: 'Close',                 es: 'Cerrar' }
  };

  /**
   * Language currently applied to the page, from <html lang> (set by js/i18n.js).
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
    var title = LABELS.title[lang] || LABELS.title.en;
    document.getElementById('letter-dialog-title').textContent = title;
    document.getElementById('letter-dialog-frame').title = title + ' PDF';
    document.getElementById('letter-dialog-open').textContent = LABELS.open[lang] || LABELS.open.en;
    document.getElementById('letter-dialog-close').setAttribute('aria-label', LABELS.close[lang] || LABELS.close.en);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var dialog = document.getElementById('letter-dialog');
    if (!dialog) return;

    var frame = document.getElementById('letter-dialog-frame');
    var openLink = document.getElementById('letter-dialog-open');

    document.getElementById('experience-list').addEventListener('click', function (event) {
      var button = event.target.closest('.letter-btn[data-url]');
      if (!button) return;
      frame.src = button.dataset.url;
      openLink.href = button.dataset.url;
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
  });

  document.addEventListener('languagechange:site', function (event) {
    if (document.getElementById('letter-dialog')) updateDialogLabels(event.detail.lang);
  });
}());
