(function () {
  'use strict';

  var carouselDelay = 2000;
  var modalTimer = null;

  function getProjectImages(wrap, thumb) {
    var images = (wrap.dataset.images || '').split('|').filter(Boolean);
    return images.length ? images : [thumb.getAttribute('src')].filter(Boolean);
  }

  function setProjectImage(img, images, index) {
    if (!images.length) return;
    img.setAttribute('src', images[index % images.length]);
  }

  function stopModalCarousel() {
    if (modalTimer) {
      clearInterval(modalTimer);
      modalTimer = null;
    }
  }

  function closeModal(modal) {
    stopModalCarousel();
    modal.classList.remove('active');
  }

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

  function appendTextLi(list, text) {
    var item = document.createElement('li');
    item.textContent = text;
    list.appendChild(item);
  }

  function appendTag(container, text) {
    var tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text.trim();
    container.appendChild(tag);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('proj-modal');
    var closeButton = document.getElementById('proj-modal-close');
    if (!modal) return;

    document.addEventListener('click', function (event) {
      var card = event.target.closest('.project-card');
      if (!card || event.target.closest('a, button')) return;

      var wrap = card.querySelector('.project-thumb-wrap');
      var thumb = card.querySelector('.project-thumb');
      if (!wrap || !thumb) return;

      var isEs = (localStorage.getItem('lang') || 'en') === 'es';
      var images = getProjectImages(wrap, thumb);
      var features = (isEs ? wrap.dataset.featuresEs : wrap.dataset.features) || '';
      var featureList = document.getElementById('proj-modal-features');
      var techList = document.getElementById('proj-modal-tech');

      document.getElementById('proj-modal-img').setAttribute('alt', thumb.getAttribute('alt') || '');
      document.getElementById('proj-modal-title').textContent = isEs ? wrap.dataset.titleEs : wrap.dataset.title;
      document.getElementById('proj-modal-desc').textContent = isEs ? wrap.dataset.descEs : wrap.dataset.desc;

      featureList.innerHTML = '';
      features.split('|').filter(Boolean).forEach(function (feature) {
        appendTextLi(featureList, feature);
      });

      techList.innerHTML = '';
      (wrap.dataset.tech || '').split(',').filter(Boolean).forEach(function (tag) {
        appendTag(techList, tag);
      });

      var modalBtn = document.getElementById('proj-modal-github');
      modalBtn.setAttribute('href', wrap.dataset.github || '#');
      modalBtn.textContent = isEs ? (wrap.dataset.ctaLabelEs || 'Ver en GitHub') : (wrap.dataset.ctaLabel || 'View on GitHub');
      modalBtn.className = wrap.dataset.ctaDemo ? 'btn btn-demo' : 'btn primary';

      var demoBtn = document.getElementById('proj-modal-demo');
      if (demoBtn) {
        if (wrap.dataset.demo) {
          demoBtn.setAttribute('href', wrap.dataset.demo);
          demoBtn.textContent = isEs ? 'Ver demo' : 'Watch demo';
          demoBtn.style.display = '';
        } else {
          demoBtn.style.display = 'none';
        }
      }

      var modalImg = document.getElementById('proj-modal-img');
      if (wrap.dataset.portrait) {
        modalImg.classList.add('portrait');
      } else {
        modalImg.classList.remove('portrait');
      }

      modal.classList.add('active');
      startModalCarousel(images, 0);
    });

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
}());
