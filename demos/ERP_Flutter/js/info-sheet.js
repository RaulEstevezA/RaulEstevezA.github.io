const SEEN_KEY = 'erp-flutter-demo-sheet';

export function createInfoSheet({ mobileQuery, root = document, storage = sessionStorage }) {
  const sheet = root.querySelector('.sheet');
  const backdrop = root.querySelector('.sheet-backdrop');

  function setOpen(open) {
    sheet.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
  }

  function hasBeenSeen() {
    try { return storage.getItem(SEEN_KEY) === '1'; } catch (_) { return false; }
  }

  function markAsSeen() {
    try { storage.setItem(SEEN_KEY, '1'); } catch (_) {}
  }

  function initialize() {
    root.querySelectorAll('[data-open-sheet]').forEach((element) => {
      element.addEventListener('click', () => setOpen(true));
    });
    root.querySelectorAll('[data-close-sheet]').forEach((element) => {
      element.addEventListener('click', () => setOpen(false));
    });

    if (mobileQuery.matches && !hasBeenSeen()) {
      setOpen(true);
      markAsSeen();
    }
  }

  return { initialize, setOpen };
}

