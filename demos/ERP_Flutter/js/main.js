import { createAppViewer } from './app-viewer.js';
import { createInfoSheet } from './info-sheet.js';
import { renderInfoTemplate } from './info-template.js';
import { createLanguageController } from './language.js';
import { translations } from './translations.js';

const mobileQuery = window.matchMedia('(max-width: 760px), (max-height: 560px)');

renderInfoTemplate();
createLanguageController({ texts: translations }).initialize();
createAppViewer({ appUrl: 'app/', mobileQuery }).initialize();
createInfoSheet({ mobileQuery }).initialize();
