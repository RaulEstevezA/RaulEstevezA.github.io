(function ($) {
  'use strict';

  var SUPPORTED = ['en', 'es'];
  var DEFAULT   = 'en';

  function detectLang() {
    var stored = localStorage.getItem('lang');
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    var browser = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(browser) !== -1 ? browser : DEFAULT;
  }

  function resolve(data, key) {
    return key.split('.').reduce(function (o, k) { return o && o[k]; }, data);
  }

  function renderTechTags($el, text) {
    var tags = text.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    $el.html(tags.map(function (t) {
      return '<span class="tag">' + $('<span>').text(t).html() + '</span>';
    }).join(''));
  }

  function applyTranslations(data) {
    $('[data-i18n]').each(function () {
      var val = resolve(data, $(this).data('i18n'));
      if (val === undefined) return;
      if ($(this).hasClass('tech-tags')) {
        renderTechTags($(this), val);
      } else {
        $(this).text(val);
      }
    });
  }

  function updatePageMeta(pageData) {
    if (pageData.page_title) document.title = pageData.page_title;
    if (pageData.page_desc)  $('meta[name="description"]').attr('content', pageData.page_desc);
  }

  function setLang(lang) {
    var pageKey = $('body').data('page') || 'home';
    var base    = '/locales/' + lang + '/';

    localStorage.setItem('lang', lang);
    $('html').attr('lang', lang);
    $('.lang a[data-lang]').removeClass('active')
      .filter('[data-lang="' + lang + '"]').addClass('active');

    // Load common strings and page strings in parallel
    $.when(
      $.getJSON(base + 'common.json'),
      $.getJSON(base + pageKey + '.json')
    ).done(function (commonRes, pageRes) {
      var data         = {};
      data['common']   = commonRes[0];
      data[pageKey]    = pageRes[0];
      applyTranslations(data);
      updatePageMeta(pageRes[0]);
    });
  }

  $(document).ready(function () {
    $('.lang a[data-lang]').on('click', function (e) {
      e.preventDefault();
      setLang($(this).data('lang'));
    });
    setLang(detectLang());
  });

}(jQuery));
