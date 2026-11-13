/*
 * Progressive fallback for dialog exit fades. CSS handles the transition when the
 * browser supports `overlay`; older browsers get the same timing through WAAPI.
 */

const CLOSE_DURATION = 180;
const CLOSE_EASING = 'ease-in';
const CLOSE_SCALE = 'scale(0.97)';

/** @returns {boolean} Whether motion should be effectively disabled. */
export function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Adds the protocol's close fallback to one dynamically created dialog.
 *
 * @param {HTMLDialogElement} dialog Dialog to enhance before it is opened.
 * @returns {void}
 */
export function addDialogCloseTransition(dialog) {
  const supportsOverlay = globalThis.CSS?.supports?.('overlay', 'auto') ?? false;
  if (supportsOverlay || !dialog.animate) return;

  const nativeClose = dialog.close.bind(dialog);
  let closing = false;

  dialog.close = (returnValue) => {
    if (!dialog.open || closing) return;
    if (prefersReducedMotion()) {
      nativeClose(returnValue);
      return;
    }

    closing = true;
    const options = { duration: CLOSE_DURATION, easing: CLOSE_EASING, fill: 'forwards' };
    const animation = dialog.animate(
      { opacity: [1, 0], transform: ['none', CLOSE_SCALE] },
      options,
    );

    try {
      dialog.animate(
        { opacity: [1, 0] },
        { ...options, pseudoElement: '::backdrop' },
      );
    } catch {
      // Some WAAPI implementations cannot target ::backdrop; the dialog still fades.
    }

    animation.onfinish = () => {
      nativeClose(returnValue);
      dialog.getAnimations({ subtree: true }).forEach((running) => running.cancel());
      closing = false;
    };
  };

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });
}
