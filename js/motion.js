/* Fallback for animations that modern CSS handles natively in some browsers
   (see the TRANSITIONS section of styles.css):
   - collapsible lists (<details class="certs-details">) open and close smoothly
     -> native with `interpolate-size`;
   - PDF dialogs fade out when closed -> native with `overlay`.
   Each part only runs where the browser lacks that CSS feature, so it switches
   itself off as browsers add support. Once Safari and Firefox support both,
   this file can be deleted.
   With "reduce motion" enabled, everything keeps its native instant behaviour. */
(function () {
  'use strict';

  var DURATION = 260;
  var EASING = 'cubic-bezier(0.2, 0, 0, 1)';
  var supports = function (property, value) {
    return !!(window.CSS && CSS.supports && CSS.supports(property, value));
  };
  var nativeDetails = supports('interpolate-size', 'allow-keywords');
  var nativeDialogs = supports('overlay', 'auto');

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- Collapsible lists -----------------------------------------------------

  function toggleDetails(details) {
    var opening = details.dataset.motionTarget
      ? details.dataset.motionTarget === 'closed'
      : !details.open;
    var startHeight = details.offsetHeight;

    if (details.motionAnimation) details.motionAnimation.cancel();

    // Measure both states synchronously; nothing is painted in between.
    details.open = false;
    var closedHeight = details.offsetHeight;
    details.open = true;
    var openHeight = details.offsetHeight;

    details.dataset.motionTarget = opening ? 'open' : 'closed';
    var animation = details.animate(
      { height: [startHeight + 'px', (opening ? openHeight : closedHeight) + 'px'] },
      { duration: DURATION, easing: EASING }
    );
    details.motionAnimation = animation;

    animation.onfinish = function () {
      details.open = opening;
      delete details.dataset.motionTarget;
      details.motionAnimation = null;
    };
  }

  if (!nativeDetails) document.querySelectorAll('details.certs-details').forEach(function (details) {
    var summary = details.querySelector('summary');
    if (!summary || !details.animate) return;

    summary.addEventListener('click', function (event) {
      if (reduceMotion()) return;
      event.preventDefault();
      toggleDetails(details);
    });
  });

  // --- PDF dialogs -----------------------------------------------------------

  if (!nativeDialogs) document.querySelectorAll('dialog.pdf-dialog').forEach(function (dialog) {
    if (!dialog.animate) return;

    var nativeClose = dialog.close.bind(dialog);
    var closing = false;

    // Every existing dialog.close() call (close button, backdrop click) now fades out first.
    dialog.close = function (returnValue) {
      if (!dialog.open || closing) return;
      if (reduceMotion()) {
        nativeClose(returnValue);
        return;
      }

      closing = true;
      var options = { duration: 180, easing: 'ease-in', fill: 'forwards' };
      var animation = dialog.animate(
        { opacity: [1, 0], transform: ['none', 'scale(0.97)'] },
        options
      );
      try {
        dialog.animate({ opacity: [1, 0] }, Object.assign({ pseudoElement: '::backdrop' }, options));
      } catch (error) { /* backdrop animation not supported: it just disappears */ }

      animation.onfinish = function () {
        nativeClose(returnValue);
        dialog.getAnimations({ subtree: true }).forEach(function (running) { running.cancel(); });
        closing = false;
      };
    };

    // Escape key: animate instead of closing instantly. If the browser does not
    // allow cancelling, it simply closes without the animation.
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      dialog.close();
    });
  });
}());
