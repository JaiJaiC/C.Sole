(function () {
  'use strict';
  try {
    var saved = JSON.parse(localStorage.getItem('csole_settings') || '{}');
    var allowed = ['dark', 'light'];
    var removedTheme = saved.theme === 'gray' || saved.theme === 'colorful' || saved.theme === 'silver';
    var theme = removedTheme ? 'light' : (allowed.indexOf(saved.theme) >= 0 ? saved.theme : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
