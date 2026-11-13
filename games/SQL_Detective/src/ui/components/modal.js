/**
 * Modal window on the native `<dialog>` element, which already provides the focus trap,
 * the Escape key and the return of focus to the button that opened it.
 */

import { localize } from '../../core/localize.js';
import { uiText } from '../../content/ui-text.js';
import { h } from '../dom.js';
import { addDialogCloseTransition } from '../motion.js';

/**
 * Opens a modal window. It removes itself from the page when it closes.
 *
 * @param {object} options What the window shows.
 * @param {'en'|'es'} options.language Language of the close button.
 * @param {string} options.title Title of the window.
 * @param {string} [options.eyebrow] Short line above the title.
 * @param {Node|Node[]} options.body Content.
 * @param {function(function(): void): Node[]} [options.actions] Builds the buttons at the
 *   bottom; receives the function that closes the window.
 * @param {function(): void} [options.onClose] Runs once when the window has closed.
 * @param {string} [options.className] Extra class, such as a chapter theme.
 * @returns {{close: function(): void}} Handle to close the window from outside.
 */
export function openModal({ language, title, eyebrow, body, actions, onClose, className = '' }) {
  let dialog;
  const close = () => dialog.close();
  const titleId = `modal-title-${Date.now()}`;

  dialog = h(
    'dialog',
    {
      class: `modal ${className}`,
      'aria-labelledby': titleId,
      onClose: () => {
        dialog.remove();
        onClose?.();
      },
      // A click on the dialog itself, and not on its content, is a click on the backdrop.
      onClick: (event) => {
        if (event.target === dialog) close();
      },
    },
    h(
      'div',
      { class: 'modal__frame' },
      h(
        'header',
        { class: 'modal__header' },
        h(
          'div',
          {},
          eyebrow && h('p', { class: 'modal__eyebrow' }, eyebrow),
          h('h2', { id: titleId, class: 'modal__title' }, title),
        ),
        h(
          'button',
          { class: 'modal__close', type: 'button', 'aria-label': localize(uiText.document.close, language), onClick: close },
          '×',
        ),
      ),
      h('div', { class: 'modal__body' }, body),
      actions && h('footer', { class: 'modal__actions' }, actions(close)),
    ),
  );

  document.body.append(dialog);
  addDialogCloseTransition(dialog);
  dialog.showModal();
  return { close };
}
