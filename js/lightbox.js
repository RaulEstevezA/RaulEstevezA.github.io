$(function () {
  var $modal = $('#proj-modal');

  $(document).on('click', '.project-card', function (e) {
    if ($(e.target).closest('a, button').length) return;
    var $wrap  = $(this).find('.project-thumb-wrap');
    var $thumb = $(this).find('.project-thumb');
    var isEs   = (localStorage.getItem('lang') || 'en') === 'es';

    $('#proj-modal-img').attr('src', $thumb.attr('src')).attr('alt', $thumb.attr('alt'));
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
  });

  $modal.on('click', function (e) {
    if (!$(e.target).closest('#proj-modal-inner').length) {
      $modal.removeClass('active');
    }
  });

  $('#proj-modal-close').on('click', function () {
    $modal.removeClass('active');
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') $modal.removeClass('active');
  });
});
