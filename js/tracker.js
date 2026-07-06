/**
 * C.Sole — Visit Tracker (frontend)
 * Include on every page: <script src="/js/tracker.js" defer></script>
 *
 * Sends visit metadata to the Cloudflare Worker API.
 * Owner visits (cookie: csole_owner=1) are NOT tracked.
 */
(function () {
  'use strict';

  // ─── Config ─────────────────────────────────────────────
  var API_BASE = 'https://csole-tracker.YOUR_SUBDOMAIN.workers.dev';
  // ^^^ Replace with your actual Worker URL after deploy

  // ─── Skip owner ─────────────────────────────────────────
  if (document.cookie.indexOf('csole_owner=1') !== -1) return;

  // ─── WeChat detection ───────────────────────────────────
  var ua = navigator.userAgent || '';
  var isWeChat = /MicroMessenger/i.test(ua);

  // ─── Visitor ID ─────────────────────────────────────────
  var vid = localStorage.getItem('csole_vid');
  if (!vid) {
    vid = 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('csole_vid', vid);
  }

  // ─── Collect data ───────────────────────────────────────
  var data = {
    vid:      vid,
    isWeChat: isWeChat,
    ua:       ua.substring(0, 500),
    referrer: (document.referrer || '').substring(0, 500),
    url:      location.href.substring(0, 500),
    screen:   (screen.width || 0) + 'x' + (screen.height || 0),
    lang:     (navigator.language || ''),
    timezone: '',
  };

  try { data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}

  // ─── Send ───────────────────────────────────────────────
  var xhr = new XMLHttpRequest();
  xhr.open('POST', API_BASE + '/api/visit', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = 5000;
  xhr.send(JSON.stringify(data));
})();
