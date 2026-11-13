/*
 * Tools page (tools/): renders the tool cards from data/tools.json into
 * #tools-list, in the current language. Tools marked "hidden" are skipped.
 *
 * The download button points straight to the installer for the visitor's
 * system (platform and, when the release has several, CPU architecture). When
 * the system cannot be detected, or it is a phone or tablet, it links to the
 * releases page instead.
 *
 * Re-renders on 'languagechange:site' (js/i18n.js). The English cards are
 * pre-rendered by scripts/build_content.py (render_tool), always with the
 * generic releases link: change both together.
 */
(function () {
  'use strict';

  var tools = [];
  var currentLang = document.documentElement.lang || 'en';
  // Assumed until detectDesktopArchitecture() answers (most desktops are x64).
  var desktopArchitecture = 'x64';

  /**
   * Escape text for insertion as HTML, using the browser's own serializer.
   * @param {string} value Plain text.
   * @returns {string} HTML-safe text.
   */
  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  /**
   * Button labels of the cards.
   * @param {string} lang Language code.
   * @returns {{open: string, code: string, download: string, downloadFor: string}}
   *   downloadFor is followed by the platform name ("Download for macOS").
   */
  function getLabels(lang) {
    return lang === 'es'
      ? { open: 'Abrir herramienta', code: 'Ver código', download: 'Descargar', downloadFor: 'Descargar para ' }
      : { open: 'Open tool', code: 'View code', download: 'Download', downloadFor: 'Download for ' };
  }

  // 16x16 inline icons shown before the button text (same SVG as TOOL_ICONS in build_content.py).
  var icons = {
    download: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
    code: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/></svg>'
  };

  /**
   * Desktop system of the visitor, matching the keys of download.assets.
   * Phones and tablets return null: there is nothing to install on them.
   * An iPad in desktop mode reports "Mac", so a Mac with touch points is treated
   * as a tablet. ChromeOS (CrOS) is excluded from Linux.
   * @returns {?string} 'macOS', 'Windows', 'Linux' or null.
   */
  function detectDesktopPlatform() {
    var platform = navigator.platform || '';
    var userAgent = navigator.userAgent || '';
    var device = platform + ' ' + userAgent;

    if (/android|iphone|ipad|ipod|mobile/i.test(device)) return null;
    if (/mac/i.test(device)) return navigator.maxTouchPoints > 1 ? null : 'macOS';
    if (/win/i.test(device)) return 'Windows';
    if (/linux|x11/i.test(device) && !/cros/i.test(device)) return 'Linux';
    return null;
  }

  /**
   * CPU architecture of the visitor. The user agent only reveals ARM on some
   * systems; Chromium browsers expose it through User-Agent Client Hints.
   * Safari and Firefox give no reliable answer, so it resolves to null there.
   * @returns {Promise<?string>} 'arm64', 'x64' or null when unknown.
   */
  function detectDesktopArchitecture() {
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
   * Installer file for a platform.
   * download.assets[platform] is either a file name (one build) or an object
   * keyed by architecture ({ x64: '...', arm64: '...' }). With several builds,
   * the detected architecture is used, or the first one listed.
   * @param {Object} assets The tool's download.assets.
   * @param {string} platform Value from detectDesktopPlatform().
   * @returns {?{file: string, architecture: ?string, hasArchitectures: boolean}}
   *   null when there is no build for the platform.
   */
  function resolveAsset(assets, platform) {
    var platformAssets = assets && assets[platform];
    if (!platformAssets) return null;
    if (typeof platformAssets === 'string') {
      return { file: platformAssets, architecture: null, hasArchitectures: false };
    }

    var architecture = platformAssets[desktopArchitecture]
      ? desktopArchitecture
      : Object.keys(platformAssets)[0];
    return {
      file: platformAssets[architecture],
      architecture: architecture,
      hasArchitectures: Object.keys(platformAssets).length > 1
    };
  }

  /**
   * Download button of a tool card.
   * With a matching installer it links to the file of the latest GitHub release
   * (<releases_url>/download/<file>) and names the platform, adding "ARM64" only
   * when that platform has several builds. Otherwise it links to releases_url.
   * @param {Object} tool Entry from tools.json.
   * @param {Object} labels Result of getLabels().
   * @returns {string} The button HTML, or '' when the tool has no desktop version.
   */
  function renderDownloadLink(tool, labels) {
    var download = tool.download;
    if (!download || !download.releases_url) return '';

    var platform = detectDesktopPlatform();
    var asset = platform && resolveAsset(download.assets, platform);
    var url = asset
      ? download.releases_url.replace(/\/$/, '') + '/download/' + encodeURIComponent(asset.file)
      : download.releases_url;
    var platformLabel = asset && asset.architecture === 'arm64' && asset.hasArchitectures
      ? platform + ' ARM64'
      : platform;
    var label = asset ? labels.downloadFor + platformLabel : labels.download;

    return '<a class="btn btn-download" href="' + encodeURI(url) + '" target="_blank" rel="noopener">' + icons.download + label + '</a>';
  }

  /**
   * Render all tool cards, or show #tools-empty when there are none.
   * Order: display_order, then file order for tools without it (stable).
   * Descriptions and badges fall back to English when missing.
   */
  function render() {
    var container = document.getElementById('tools-list');
    var emptyState = document.getElementById('tools-empty');
    var labels = getLabels(currentLang);

    var orderedTools = tools.map(function (tool, index) {
      return { tool: tool, index: index };
    }).sort(function (a, b) {
      var orderA = Number.isFinite(a.tool.display_order) ? a.tool.display_order : 1000 + a.index;
      var orderB = Number.isFinite(b.tool.display_order) ? b.tool.display_order : 1000 + b.index;
      return orderA - orderB;
    }).map(function (item) {
      return item.tool;
    });

    emptyState.hidden = orderedTools.length > 0;
    container.innerHTML = orderedTools.map(function (tool) {
      var description = tool['description_' + currentLang] || tool.description_en || '';
      var image = tool.image
        ? '<img class="demo-card-image" src="' + encodeURI(tool.image) + '" alt="" loading="lazy">'
        : '';
      var badge = tool['badge_' + currentLang] || tool.badge_en;
      var codeLink = tool.repository_url
        ? '<a class="btn btn-code" href="' + encodeURI(tool.repository_url) + '" target="_blank" rel="noopener">' + icons.code + labels.code + '</a>'
        : '';
      var downloadLink = renderDownloadLink(tool, labels);

      return '<article class="demo-card' + (tool.featured ? ' demo-card-featured' : '') + '">' +
        image +
        (badge ? '<span class="project-badge">' + escapeHtml(badge) + '</span>' : '') +
        '<h3>' + escapeHtml(tool.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="demo-card-actions tool-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(tool.tool_url) + '">' + labels.open + '</a>' +
          downloadLink +
          codeLink +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.addEventListener('languagechange:site', function (event) {
    currentLang = event.detail.lang;
    render();
  });

  // Load the data and render at once with the assumed architecture; render again
  // only if detection finds a different one. Registered in siteReady so a
  // translated page is only revealed after the cards are rendered (js/i18n.js).
  (window.siteReady = window.siteReady || []).push(fetch('../data/tools.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load data/tools.json');
      return response.json();
    })
    .then(function (data) {
      tools = (Array.isArray(data.tools) ? data.tools : []).filter(function (tool) { return !tool.hidden; });
      render();
      return detectDesktopArchitecture();
    })
    .then(function (architecture) {
      if (architecture && architecture !== desktopArchitecture) {
        desktopArchitecture = architecture;
        render();
      }
    })
    .catch(function (error) {
      console.error(error);
    }));
}());
