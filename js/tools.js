(function () {
  'use strict';

  var tools = [];
  var currentLang = document.documentElement.lang || 'en';
  var desktopArchitecture = 'x64';

  function escapeHtml(value) {
    var element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function getLabels(lang) {
    return lang === 'es'
      ? { open: 'Abrir herramienta', code: 'Ver código', download: 'Descargar', downloadFor: 'Descargar para ' }
      : { open: 'Open tool', code: 'View code', download: 'Download', downloadFor: 'Download for ' };
  }

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

    return '<a class="btn" href="' + encodeURI(url) + '" target="_blank" rel="noopener">' + label + '</a>';
  }

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
        ? '<a class="btn" href="' + encodeURI(tool.repository_url) + '" target="_blank" rel="noopener">' + labels.code + '</a>'
        : '';
      var downloadLink = renderDownloadLink(tool, labels);

      return '<article class="demo-card' + (tool.featured ? ' demo-card-featured' : '') + '">' +
        image +
        (badge ? '<span class="project-badge">' + escapeHtml(badge) + '</span>' : '') +
        '<h3>' + escapeHtml(tool.name) + '</h3>' +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="demo-card-actions">' +
          '<a class="btn btn-web" href="' + encodeURI(tool.tool_url) + '" target="_blank" rel="noopener">' + labels.open + '</a>' +
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

  fetch('../data/tools.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Could not load data/tools.json');
      return response.json();
    })
    .then(function (data) {
      tools = Array.isArray(data.tools) ? data.tools : [];
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
    });
}());
