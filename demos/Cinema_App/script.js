    (function () {
      var APP_URL = 'app/';
      var ATTRIBUTIONS_URL = 'app/assets/assets/data/attributions.json';

      var texts = {
        es: {
          hint: 'Arrastra con el ratón para desplazarte por los carruseles.',
          subtitle: 'App Flutter para descubrir películas',
          intro: 'Cartelera por secciones, búsqueda, géneros, ficha de cada película con su reparto y favoritos guardados en local. Esta es la versión web de la app móvil, ejecutándose tal cual en el navegador.',
          notice_title: 'Demo con datos locales',
          notice_api: 'La app original usa la API de The Movie Database. Esta demo no usa ninguna API: las películas vienen de una base estática incluida en la app.',
          notice_sources: 'Datos de Wikidata (CC0), imágenes de Wikimedia Commons y sinopsis de Wikipedia (CC BY-SA 4.0).',
          notice_rating: 'Las estrellas son un índice de relevancia (en cuántas Wikipedias aparece la película), no valoraciones de usuarios.',
          notice_favorites: 'Los favoritos se guardan solo en este navegador.',
          code: 'Código y descarga',
          fullscreen: 'Pantalla completa',
          demos: 'Demos',
          credits: 'Créditos',
          credits_title: 'Créditos',
          close: 'Cerrar',
          loading: 'Cargando…',
          view_demo: 'Ver la demo',
          credits_data: 'Datos de películas: {wikidata}, CC0 1.0.',
          credits_texts: 'Sinopsis (Wikipedia en español, CC BY-SA 4.0)',
          credits_images: 'Imágenes (Wikimedia Commons)',
          used_in: 'Usada en',
          error: 'No se pudieron cargar los créditos.'
        },
        en: {
          hint: 'Drag with the mouse to scroll the carousels.',
          subtitle: 'Flutter app to discover movies',
          intro: 'Movie listings by section, search, genres, movie details with cast and favourites stored locally. This is the web build of the mobile app, running as-is in the browser.',
          notice_title: 'Demo with local data',
          notice_api: 'The original app uses The Movie Database API. This demo uses no API at all: movies come from a static database bundled with the app.',
          notice_sources: 'Data from Wikidata (CC0), images from Wikimedia Commons and plots from Spanish Wikipedia (CC BY-SA 4.0).',
          notice_rating: 'Stars are a relevance index (how many Wikipedias cover the movie), not user ratings.',
          notice_favorites: 'Favourites are only stored in this browser.',
          code: 'Code & download',
          fullscreen: 'Full screen',
          demos: 'Demos',
          credits: 'Credits',
          credits_title: 'Credits',
          close: 'Close',
          loading: 'Loading…',
          view_demo: 'View demo',
          credits_data: 'Movie data: {wikidata}, CC0 1.0.',
          credits_texts: 'Plots (Spanish Wikipedia, CC BY-SA 4.0)',
          credits_images: 'Images (Wikimedia Commons)',
          used_in: 'Used in',
          error: 'Credits could not be loaded.'
        }
      };

      // --- Idioma: misma preferencia que la web (localStorage 'lang') ---

      function readLang() {
        try {
          var stored = localStorage.getItem('lang');
          if (stored === 'es' || stored === 'en') return stored;
        } catch (e) {}
        return (navigator.language || '').slice(0, 2).toLowerCase() === 'es' ? 'es' : 'en';
      }

      var lang = readLang();

      function t(key) { return texts[lang][key] || texts.es[key] || key; }

      function applyLang() {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('.lang button').forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
        });
        if (creditsLoaded) renderCredits(creditsData);
      }

      document.querySelectorAll('.lang button').forEach(function (button) {
        button.addEventListener('click', function () {
          lang = button.dataset.lang;
          try { localStorage.setItem('lang', lang); } catch (e) {}
          applyLang();
        });
      });

      // --- Ficha compartida ---

      var template = document.getElementById('info');
      document.querySelectorAll('[data-info]').forEach(function (slot) {
        slot.appendChild(template.content.cloneNode(true));
      });

      // --- Una sola instancia de la app: en el marco o a pantalla completa ---

      var mobileQuery = window.matchMedia('(max-width: 760px), (max-height: 560px)');
      var desktopFrame = document.getElementById('desktop-app');
      var mobileFrame = document.getElementById('mobile-app');

      function mountApp() {
        var active = mobileQuery.matches ? mobileFrame : desktopFrame;
        var inactive = mobileQuery.matches ? desktopFrame : mobileFrame;
        if (inactive.getAttribute('src')) inactive.removeAttribute('src');
        if (!active.getAttribute('src')) active.setAttribute('src', APP_URL);
      }

      mountApp();
      mobileQuery.addEventListener('change', mountApp);

      // Escala de la app dentro del marco (ver .screen en el CSS).
      var screenEl = desktopFrame.parentElement;
      function fitApp() {
        var k = Math.min(screenEl.clientWidth / 390, screenEl.clientHeight / 844);
        screenEl.style.setProperty('--k', k || 1);
        // La altura de la app se ajusta a la del marco para no dejar huecos por redondeo.
        screenEl.style.setProperty('--app-h', (k ? screenEl.clientHeight / k : 844) + 'px');
      }
      if (window.ResizeObserver) new ResizeObserver(fitApp).observe(screenEl);
      fitApp();

      // --- Hoja de información (móvil): se muestra una vez por sesión ---

      var sheet = document.querySelector('.sheet');
      var backdrop = document.querySelector('.sheet-backdrop');

      function setSheet(open) {
        sheet.classList.toggle('open', open);
        backdrop.classList.toggle('open', open);
      }

      document.querySelectorAll('[data-open-sheet]').forEach(function (el) {
        el.addEventListener('click', function () { setSheet(true); });
      });
      document.querySelectorAll('[data-close-sheet]').forEach(function (el) {
        el.addEventListener('click', function () { setSheet(false); });
      });

      if (mobileQuery.matches) {
        var seen = false;
        try { seen = sessionStorage.getItem('cinema-demo-sheet') === '1'; } catch (e) {}
        if (!seen) {
          setSheet(true);
          try { sessionStorage.setItem('cinema-demo-sheet', '1'); } catch (e) {}
        }
      }

      // --- Créditos (attributions.json generado por tool/generate_static_db.dart) ---

      var dialog = document.getElementById('credits');
      var body = document.getElementById('credits-body');
      var creditsLoaded = false;
      var creditsData = null;

      function el(tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
        (children || []).forEach(function (child) {
          node.append(child);
        });
        return node;
      }

      function link(href, text) {
        return el('a', { href: href, target: '_blank', rel: 'noopener' }, [text]);
      }

      function renderCredits(data) {
        body.textContent = '';

        var dataLine = el('p');
        var parts = t('credits_data').split('{wikidata}');
        dataLine.append(parts[0], link('https://www.wikidata.org', 'Wikidata'), parts[1]);
        body.append(dataLine);

        body.append(el('h4', {}, [t('credits_texts')]));
        body.append(el('ul', { class: 'credits-list' }, data.texts.map(function (text) {
          return el('li', {}, [link(text.source_url, text.title)]);
        })));

        body.append(el('h4', {}, [t('credits_images') + ' · ' + data.images.length]));
        body.append(el('ul', { class: 'credits-list' }, data.images.map(function (image) {
          var license = image.license_url ? link(image.license_url, image.license) : image.license;
          return el('li', {}, [
            link(image.source_url, image.file),
            el('div', { class: 'meta' }, [
              image.artist + ' · ', license, ' · ' + t('used_in') + ': ' + image.used_by.join(', ')
            ])
          ]);
        })));
      }

      function openCredits() {
        setSheet(false);
        dialog.showModal();
        if (creditsLoaded) return;
        fetch(ATTRIBUTIONS_URL)
          .then(function (response) {
            if (!response.ok) throw new Error(response.status);
            return response.json();
          })
          .then(function (data) {
            creditsData = data;
            creditsLoaded = true;
            renderCredits(data);
          })
          .catch(function () { body.textContent = t('error'); });
      }

      document.querySelectorAll('[data-open-credits]').forEach(function (el) {
        el.addEventListener('click', openCredits);
      });
      document.querySelector('[data-close-credits]').addEventListener('click', function () {
        dialog.close();
      });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });

      applyLang();
    })();

