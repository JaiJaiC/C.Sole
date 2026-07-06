/**
 * C.Sole — Visit Tracker
 *
 * Setup: replace API_BASE with your Google Apps Script URL
 *   https://script.google.com/macros/s/xxxxxxxxx/exec
 *
 * Owner visits (cookie: csole_owner=1) are NOT tracked.
 */
(function () {
  'use strict';

  // ─── CONFIG ─────────────────────────────────────────────
  var API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  // ^^^ Replace with your Apps Script URL after deploy

  // ─── Skip owner ─────────────────────────────────────────
  if (document.cookie.indexOf('csole_owner=1') !== -1) return;

  // ─── Visitor ID ─────────────────────────────────────────
  var vid = localStorage.getItem('csole_vid');
  if (!vid) {
    vid = 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('csole_vid', vid);
  }

  // ─── Collect data ───────────────────────────────────────
  var ua = navigator.userAgent || '';
  var data = {
    vid:      vid,
    isWeChat: /MicroMessenger/i.test(ua),
    ua:       ua.substring(0, 500),
    referrer: (document.referrer || '').substring(0, 500),
    country:  '',
    city:     '',
  };

  // ─── Send to Google Apps Script ─────────────────────────
  var xhr = new XMLHttpRequest();
  xhr.open('POST', API_BASE + '?action=visit', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = 5000;
  xhr.send(JSON.stringify(data));
})();
