/*
 * Courses page (courses.html): opens education documents (diplomas,
 * transcripts) in a PDF dialog (#education-dialog).
 *
 * The cards themselves (education, certificate programs, course list) are
 * rendered only by scripts/build_content.py, in both languages; js/i18n.js
 * swaps their texts. Each document button carries what the dialog needs:
 * data-url (the PDF) and data-en / data-es (its label in each language).
 */
(function () {
  'use strict';

  // Dialog texts generated here (the document labels come from the buttons).
  var LABELS = {
    open:  { en: 'Open PDF', es: 'Abrir PDF' },
    close: { en: 'Close',    es: 'Cerrar' }
  };

  // Button of the document shown in the dialog, kept to retitle it on a language change.
  var activeButton = null;

  /**
   * Language currently applied to the page, from <html lang> (set by js/i18n.js).
   * @returns {string} Language code.
   */
  function currentLang() {
    return document.documentElement.lang || 'en';
  }

  /**
   * Translate the dialog: title of the open document, iframe title and buttons.
   * @param {string} lang Language code.
   */
  function updateEducationDialog(lang) {
    var title = activeButton ? (activeButton.getAttribute('data-' + lang) || activeButton.dataset.en) : '';
    document.getElementById('education-dialog-title').textContent = title;
    document.getElementById('education-dialog-frame').title = title + ' PDF';
    document.getElementById('education-dialog-open').textContent = LABELS.open[lang] || LABELS.open.en;
    document.getElementById('education-dialog-close').setAttribute('aria-label', LABELS.close[lang] || LABELS.close.en);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var dialog = document.getElementById('education-dialog');
    if (!dialog) return;

    var frame = document.getElementById('education-dialog-frame');
    var openLink = document.getElementById('education-dialog-open');

    document.getElementById('education-list').addEventListener('click', function (event) {
      var button = event.target.closest('.education-document-btn[data-url]');
      if (!button) return;
      activeButton = button;
      frame.src = button.dataset.url;
      openLink.href = button.dataset.url;
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
      activeButton = null;
    });
    updateEducationDialog(currentLang());
  });

  document.addEventListener('languagechange:site', function (event) {
    if (document.getElementById('education-dialog')) updateEducationDialog(event.detail.lang);
  });
}());
