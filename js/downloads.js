/*
 * Desktop download links, shared by js/projects.js and js/tools.js.
 *
 * Turns a GitHub releases URL plus its installer list into a direct link to
 * the installer for the visitor's system: platform (macOS, Windows, Linux) and,
 * when a platform has several builds, CPU architecture. Phones, tablets and
 * undetected systems get no match, and the callers keep the releases page link.
 *
 * Exposed as window.desktopDownloads; load this file before the page scripts
 * that use it.
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
  // Shared detection, so several callers on one page ask the browser only once.
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
   * Links are rendered first with the x64 default; callers re-render only when
   * this resolves to true.
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
   *   for this system; callers then link to releasesUrl.
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

  window.desktopDownloads = {
    resolve: resolve,
    detectArchitecture: detectArchitecture
  };
}());
