(function () {
  'use strict';
  try {
    var saved = JSON.parse(localStorage.getItem('csole_settings') || '{}');
    var allowed = ['dark', 'light', 'gray', 'colorful'];
    var theme = allowed.indexOf(saved.theme) >= 0 ? saved.theme : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
