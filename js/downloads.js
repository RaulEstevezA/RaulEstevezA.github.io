/*
 * Desktop download buttons (projects.html, tools/).
 *
 * Every download button rendered by scripts/build_content.py links to the
 * GitHub releases page and carries:
 *
 *   data-releases-url  the releases page
 *   data-assets        the installer list (format below), when there is one
 *
 * and its label <span data-download-label> carries, per language, the generic
 * text (data-en, data-es) and the platform template (data-en-for="Download
 * for {platform}", data-es-for...).
 *
 * This file turns each button into a direct link to the installer for the
 * visitor's system: platform (macOS, Windows, Linux) and, when a platform has
 * several builds, CPU architecture. Phones, tablets and undetected systems get
 * no match and keep the releases page link.
 *
 * Installer list format (download.assets in tools.json, link.assets in
 * bestProjects.json): keys are platforms, values are either a file name or an
 * object keyed by architecture.
 *
 *   { "macOS": { "arm64": "App-arm64.dmg", "x64": "App-x64.dmg" },
 *     "Windows": "App-Setup.exe" }
 */
(function () {
  'use strict';

  // Assumed until detectArchitecture() answers (most desktops are x64).
  var architecture = 'x64';
  // Detection promise, so the browser is asked only once.
  var detection = null;

  /**
   * Desktop system of the visitor, matching the keys of an installer list.
   * Phones and tablets return null: there is nothing to install on them.
   * An iPad in desktop mode reports "Mac", so a Mac with touch points is treated
   * as a tablet. ChromeOS (CrOS) is excluded from Linux.
   * @returns {?string} 'macOS', 'Windows', 'Linux' or null.
   */
  function detectPlatform() {
    var device = (navigator.platform || '') + ' ' + (navigator.userAgent || '');

    if (/android|iphone|ipad|ipod|mobile/i.test(device)) return null;
    if (/mac/i.test(device)) return navigator.maxTouchPoints > 1 ? null : 'macOS';
    if (/win/i.test(device)) return 'Windows';
    if (/linux|x11/i.test(device) && !/cros/i.test(device)) return 'Linux';
    return null;
  }

  /**
   * Ask the browser for the CPU architecture. The user agent only reveals ARM
   * on some systems; Chromium browsers expose it through User-Agent Client
   * Hints. Safari and Firefox give no reliable answer: the x64 default stays.
   * @returns {Promise<?string>} 'arm64', 'x64' or null when unknown.
   */
  function queryArchitecture() {
    var device = (navigator.platform || '') + ' ' + (navigator.userAgent || '');
    if (/aarch64|arm64/i.test(device)) return Promise.resolve('arm64');

    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      return navigator.userAgentData.getHighEntropyValues(['architecture'])
        .then(function (values) {
          if (values.architecture === 'arm') return 'arm64';
          if (values.architecture === 'x86') return 'x64';
          return null;
        })
        .catch(function () { return null; });
    }

    return Promise.resolve(null);
  }

  /**
   * Detect the CPU architecture and use it for the next resolve() calls.
   * Buttons are updated first with the x64 default, and again only when this
   * resolves to true.
   * @returns {Promise<boolean>} true if the detected architecture differs from
   *   the default, so the links already rendered may be wrong.
   */
  function detectArchitecture() {
    if (!detection) {
      detection = queryArchitecture().then(function (detected) {
        if (!detected || detected === architecture) return false;
        architecture = detected;
        return true;
      });
    }
    return detection;
  }

  /**
   * Installer of the visitor's platform in an installer list. With several
   * builds, the detected architecture is used, or the first one listed.
   * @param {Object} assets Installer list (see the format above).
   * @param {string} platform Value from detectPlatform().
   * @returns {?{file: string, architecture: ?string, hasArchitectures: boolean}}
   *   null when there is no build for the platform.
   */
  function resolveAsset(assets, platform) {
    var platformAssets = assets && assets[platform];
    if (!platformAssets) return null;
    if (typeof platformAssets === 'string') {
      return { file: platformAssets, architecture: null, hasArchitectures: false };
    }

    var chosen = platformAssets[architecture] ? architecture : Object.keys(platformAssets)[0];
    return {
      file: platformAssets[chosen],
      architecture: chosen,
      hasArchitectures: Object.keys(platformAssets).length > 1
    };
  }

  /**
   * Direct download for the visitor's system.
   * The URL is the file of the latest GitHub release
   * (<releasesUrl>/download/<file>). The platform name gets " ARM64" only when
   * that platform has several builds, so a single macOS build is just "macOS".
   * @param {string} releasesUrl GitHub releases URL of the project.
   * @param {Object} assets Installer list (see the format above).
   * @returns {?{url: string, platform: string}} null when there is no installer
   *   for this system; the button then keeps releasesUrl.
   */
  function resolve(releasesUrl, assets) {
    var platform = detectPlatform();
    var asset = platform && resolveAsset(assets, platform);
    if (!asset) return null;

    return {
      url: releasesUrl.replace(/\/$/, '') + '/download/' + encodeURIComponent(asset.file),
      platform: asset.architecture === 'arm64' && asset.hasArchitectures ? platform + ' ARM64' : platform
    };
  }

  /**
   * Point every download button on the page to the visitor's installer and
   * relabel it in every language ("Download for macOS"), or keep the releases
   * page and the generic label when there is no installer for this system.
   * The label shown is the one of the current <html lang>; js/i18n.js swaps it
   * on later language changes.
   */
  function updateButtons() {
    var lang = document.documentElement.lang || 'en';

    document.querySelectorAll('a[data-releases-url]').forEach(function (button) {
      var assets = null;
      try { assets = JSON.parse(button.dataset.assets || 'null'); } catch (error) { assets = null; }
      var direct = resolve(button.dataset.releasesUrl, assets);
      button.href = direct ? direct.url : button.dataset.releasesUrl;

      var label = button.querySelector('[data-download-label]');
      if (!label) return;
      // Remember the generic texts once, so they can be restored.
      if (!label.dataset.generic) {
        label.dataset.generic = JSON.stringify(Array.prototype.reduce.call(label.attributes, function (texts, attr) {
          var match = /^data-([a-z]{2})-for$/.exec(attr.name);
          if (match) texts[match[1]] = label.getAttribute('data-' + match[1]);
          return texts;
        }, {}));
      }
      var generic = JSON.parse(label.dataset.generic);
      Object.keys(generic).forEach(function (code) {
        var text = direct
          ? label.getAttribute('data-' + code + '-for').replace('{platform}', direct.platform)
          : generic[code];
        label.setAttribute('data-' + code, text);
      });
      label.textContent = label.getAttribute('data-' + lang) || label.getAttribute('data-en');
    });
  }

  // Loaded after js/i18n.js, so <html lang> is already set when this runs.
  // Buttons are updated at once with the assumed architecture, and again only
  // if detection finds a different one.
  document.addEventListener('DOMContentLoaded', function () {
    updateButtons();
    detectArchitecture().then(function (changed) {
      if (changed) updateButtons();
    });
  });
}());
