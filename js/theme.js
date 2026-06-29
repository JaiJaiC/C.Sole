// ========================================
// C.Sole — Theme Toggle (Dark/Light Mode)
// ========================================
(function () {
  'use strict';

  var STORAGE_KEY = 'csole-theme';
  var THEME_DARK = 'dark';
  var THEME_LIGHT = 'light';

  // Determine initial theme
  function getInitialTheme() {
    // Check localStorage first
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;
    } catch (e) {}

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return THEME_LIGHT;
    }

    // Default: dark for Music/Thinking, light for Draw/Photography
    // We use the page's natural default
    var html = document.documentElement;
    return html.getAttribute('data-theme') || THEME_DARK;
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    if (theme === THEME_LIGHT) {
      html.setAttribute('data-theme', THEME_LIGHT);
    } else {
      html.setAttribute('data-theme', THEME_DARK);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = (current === THEME_LIGHT) ? THEME_DARK : THEME_LIGHT;
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
  }

  function init() {
    var theme = getInitialTheme();
    applyTheme(theme);

    // Bind toggle button
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
