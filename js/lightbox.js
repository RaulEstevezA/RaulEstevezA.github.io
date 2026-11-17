/*
 * Project detail modal (#proj-modal) on projects.html.
 *
 * Clicking a featured project card (anywhere except its links and buttons)
 * opens the modal with the project's title, description, features,
 * technologies, links and an image carousel. The texts are read from the
 * data-* attributes of the card's .project-thumb-wrap, written in both
 * languages by scripts/build_content.py, and the links are copies of the
 * card's buttons, so nothing is fetched here.
 *
 * The open/close animation is CSS (css/styles.css, TRANSITIONS).
 */
(function () {
  'use strict';

  // Time each image stays on screen in the carousel, in milliseconds.
  var carouselDelay = 2000;
  var modalTimer = null;
  // Element that had the focus when the modal opened, to restore it on close.
  var focusBeforeModal = null;
  // .project-thumb-wrap of the project shown in the modal; null while closed.
  var openWrap = null;

  /**
   * Carousel images of a project: data-images ('a.png|b.png'), or the thumbnail alone.
   * @param {Element} wrap The card's .project-thumb-wrap.
   * @param {Element} thumb The card's thumbnail image.
   * @returns {string[]} Image URLs (may be empty).
   */
  function getProjectImages(wrap, thumb) {
    var images = (wrap.dataset.images || '').split('|').filter(Boolean);
    return images.length ? images : [thumb.getAttribute('src')].filter(Boolean);
  }

  /**
   * Show one image of the list, wrapping around at the end.
   * @param {HTMLImageElement} img Target image.
   * @param {string[]} images Image URLs.
   * @param {number} index Position to show.
   */
  function setProjectImage(img, images, index) {
    if (!images.length) return;
    img.setAttribute('src', images[index % images.length]);
  }

  /** Stop the carousel timer, if running. */
  function stopModalCarousel() {
    if (modalTimer) {
      clearInterval(modalTimer);
      modalTimer = null;
    }
  }

  /**
   * Close the modal, stop the carousel and return the focus.
   * @param {Element} modal The #proj-modal element.
   */
  function closeModal(modal) {
    if (!modal.classList.contains('active')) return;
    stopModalCarousel();
    modal.classList.remove('active');
    openWrap = null;
    // Return focus to whatever opened the modal, if it is still on the page
    if (focusBeforeModal && document.contains(focusBeforeModal)) focusBeforeModal.focus();
    focusBeforeModal = null;
  }

  /**
   * Show the first image and, with two or more, rotate them every carouselDelay.
   * @param {string[]} images Image URLs.
   * @param {number} [initialIndex=0] Position to start from.
   */
  function startModalCarousel(images, initialIndex) {
    var modalImg = document.getElementById('proj-modal-img');
    var currentIndex = initialIndex || 0;

    stopModalCarousel();
    setProjectImage(modalImg, images, currentIndex);

    if (images.length < 2) return;

    modalTimer = setInterval(function () {
      currentIndex = (currentIndex + 1) % images.length;
      setProjectImage(modalImg, images, currentIndex);
    }, carouselDelay);
  }

  /**
   * Append a list item with plain text (never HTML).
   * @param {Element} list Target <ul>.
   * @param {string} text Item text.
   */
  function appendTextLi(list, text) {
    var item = document.createElement('li');
    item.textContent = text;
    list.appendChild(item);
  }

  /**
   * Append a technology tag with plain text (never HTML).
   * @param {Element} container Target element.
   * @param {string} text Technology name; surrounding spaces are trimmed.
   */
  function appendTag(container, text) {
    var tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text.trim();
    container.appendChild(tag);
  }

  /**
   * Write the translated texts of the modal: title, description and features.
   * Called when the modal opens and again when the language changes while it
   * is open (its links translate themselves, see the click handler).
   * @param {Element} wrap The card's .project-thumb-wrap, with the texts in data-*.
   * @param {string} lang Language code.
   */
  function fillModalTexts(wrap, lang) {
    var isEs = lang === 'es';
    var features = (isEs ? wrap.dataset.featuresEs : wrap.dataset.features) || '';
    var featureList = document.getElementById('proj-modal-features');

    document.getElementById('proj-modal-title').textContent = isEs ? wrap.dataset.titleEs : wrap.dataset.title;
    document.getElementById('proj-modal-desc').textContent = isEs ? wrap.dataset.descEs : wrap.dataset.desc;

    featureList.innerHTML = '';
    features.split('|').filter(Boolean).forEach(function (feature) {
      appendTextLi(featureList, feature);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('proj-modal');
    var closeButton = document.getElementById('proj-modal-close');
    if (!modal) return;

    // One listener for every card. Clicks on the card's own links and buttons are ignored.
    document.addEventListener('click', function (event) {
      var card = event.target.closest('.project-card');
      if (!card || event.target.closest('a, button')) return;

      var wrap = card.querySelector('.project-thumb-wrap');
      var thumb = card.querySelector('.project-thumb');
      if (!wrap || !thumb) return;

      var images = getProjectImages(wrap, thumb);
      var techList = document.getElementById('proj-modal-tech');

      openWrap = wrap;
      // Language applied by js/i18n.js.
      fillModalTexts(wrap, document.documentElement.lang || 'en');
      document.getElementById('proj-modal-img').setAttribute('alt', thumb.getAttribute('alt') || '');

      techList.innerHTML = '';
      (wrap.dataset.tech || '').split(',').filter(Boolean).forEach(function (tag) {
        appendTag(techList, tag);
      });

      // Links: copies of the card's own buttons, already labeled in the current
      // language and, for downloads, pointing to the visitor's installer
      // (js/downloads.js). Their translation attributes keep them translated.
      var modalLinks = document.getElementById('proj-modal-links');
      if (modalLinks) {
        modalLinks.innerHTML = '';
        card.querySelectorAll('.project-card-buttons a').forEach(function (link) {
          modalLinks.appendChild(link.cloneNode(true));
        });
      }

      // Vertical screenshots (mobile apps) use a different image layout.
      var modalImg = document.getElementById('proj-modal-img');
      if (wrap.dataset.portrait) {
        modalImg.classList.add('portrait');
      } else {
        modalImg.classList.remove('portrait');
      }

      focusBeforeModal = document.activeElement;
      modal.classList.add('active');
      if (closeButton) closeButton.focus();
      startModalCarousel(images, 0);
    });

    // A click outside the panel (on the backdrop) closes the modal.
    modal.addEventListener('click', function (event) {
      if (!event.target.closest('#proj-modal-inner')) closeModal(modal);
    });

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        closeModal(modal);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeModal(modal);
    });
  });

  // Translate the open modal when the language changes (js/i18n.js).
  document.addEventListener('languagechange:site', function (event) {
    if (openWrap) fillModalTexts(openWrap, event.detail.lang);
  });
}());
