$(function () {
  var $modal = $('#proj-modal');
  var carouselDelay = 2000;
  var modalTimer = null;

  function getProjectImages($wrap, $thumb) {
    var images = ($wrap.data('images') || '').split('|').filter(Boolean);
    return images.length ? images : [$thumb.attr('src')].filter(Boolean);
  }

  function setProjectImage($img, images, index) {
    if (!images.length) return;
    $img.attr('src', images[index % images.length]);
  }

  function stopModalCarousel() {
    if (modalTimer) {
      clearInterval(modalTimer);
      modalTimer = null;
    }
  }

  function closeModal() {
    stopModalCarousel();
    $modal.removeClass('active');
  }

  function startModalCarousel(images, initialIndex) {
    var $modalImg = $('#proj-modal-img');
    var currentIndex = initialIndex || 0;

    stopModalCarousel();
    setProjectImage($modalImg, images, currentIndex);

    if (images.length < 2) return;

    modalTimer = setInterval(function () {
      currentIndex = (currentIndex + 1) % images.length;
      setProjectImage($modalImg, images, currentIndex);
    }, carouselDelay);
  }

  $(document).on('click', '.project-card', function (e) {
    if ($(e.target).closest('a, button').length) return;
    var $wrap  = $(this).find('.project-thumb-wrap');
    var $thumb = $(this).find('.project-thumb');
    var isEs   = (localStorage.getItem('lang') || 'en') === 'es';
    var images = getProjectImages($wrap, $thumb);

    $('#proj-modal-img').attr('alt', $thumb.attr('alt'));
    $('#proj-modal-title').text($wrap.data(isEs ? 'title-es' : 'title'));
    $('#proj-modal-desc').text($wrap.data(isEs ? 'desc-es' : 'desc'));

    var features = ($wrap.data(isEs ? 'features-es' : 'features') || '').split('|');
    var $ul = $('#proj-modal-features').empty();
    features.filter(Boolean).forEach(function (f) {
      $ul.append($('<li>').text(f));
    });

    var $tech = $('#proj-modal-tech').empty();
    ($wrap.data('tech') || '').split(',').forEach(function (t) {
      $tech.append($('<span class="tag">').text(t.trim()));
    });

    $('#proj-modal-github').attr('href', $wrap.data('github'));
    $modal.addClass('active');
    startModalCarousel(images, 0);
  });

  $modal.on('click', function (e) {
    if (!$(e.target).closest('#proj-modal-inner').length) {
      closeModal();
    }
  });

  $('#proj-modal-close').on('click', function () {
    closeModal();
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
});
