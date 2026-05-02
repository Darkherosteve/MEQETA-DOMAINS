import { initTheme } from './theme.js';
import { initDomainChecker } from './domain.js';
import { initSettings } from './settings.js';

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initDomainChecker();
    initSettings();
});