const DEFAULT_LANGUAGE = 'es';
const SUPPORTED_LANGUAGES = ['es', 'en'];

function readLanguage(storage, browserLanguage) {
  try {
    const stored = storage.getItem('lang');
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch (_) {
    // El almacenamiento puede estar deshabilitado; se usa el idioma del navegador.
  }

  const detected = (browserLanguage || '').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(detected) ? detected : DEFAULT_LANGUAGE;
}

export function createLanguageController({ texts, root = document, storage = localStorage }) {
  let language = readLanguage(storage, navigator.language);

  function translate(key) {
    return texts[language]?.[key] || texts[DEFAULT_LANGUAGE]?.[key] || key;
  }

  function render() {
    root.documentElement.lang = language;
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    root.querySelectorAll('.lang button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });
  }

  function select(nextLanguage) {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    language = nextLanguage;
    try { storage.setItem('lang', language); } catch (_) {}
    render();
  }

  function initialize() {
    root.querySelectorAll('.lang button').forEach((button) => {
      button.addEventListener('click', () => select(button.dataset.lang));
    });
    render();
  }

  return { initialize, select };
}

