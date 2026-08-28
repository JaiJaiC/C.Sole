(function () {
  'use strict';

  var SETTINGS_KEY = 'csole_settings';
  var PLAYER_KEY = 'csole_player';
  var THEMES = ['dark', 'light', 'gray', 'colorful'];
  var scriptUrl = document.currentScript && document.currentScript.src;
  var siteRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('../', window.location.href);
  var playlist = [
    { title: '我是真的爱上你', src: '1.music/我是真的爱上你.mp3', disabled: true },
    { title: '夜空中最亮的星', src: '1.music/夜空中最亮的星.mp3', disabled: true },
    { title: '无名的人', src: '1.music/无名的人.mp3' }
  ];
  var BASE_GAIN_DB = 10;
  var BASE_GAIN = Math.pow(10, BASE_GAIN_DB / 20);

  function isPlayableTrack(index) {
    return index >= 0 && index < playlist.length && !playlist[index].disabled;
  }

  function findPlayableIndex(start, direction) {
    var step = direction < 0 ? -1 : 1;
    for (var offset = 0; offset < playlist.length; offset++) {
      var index = (start + offset * step + playlist.length * 2) % playlist.length;
      if (isPlayableTrack(index)) return index;
    }
    return -1;
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var settings = readJson(SETTINGS_KEY);
  settings.theme = THEMES.indexOf(settings.theme) >= 0 ? settings.theme : 'dark';
  settings.musicEnabled = settings.musicEnabled === true;

  var playerState = readJson(PLAYER_KEY);
  playerState.currentIndex = Number.isInteger(playerState.currentIndex) ? playerState.currentIndex : 0;
  if (!isPlayableTrack(playerState.currentIndex)) {
    playerState.currentIndex = findPlayableIndex(0, 1);
    playerState.currentTime = 0;
  }
  playerState.currentTime = Number.isFinite(playerState.currentTime) ? playerState.currentTime : 0;
  playerState.volume = Number.isFinite(playerState.volume) ? Math.max(0, Math.min(1, playerState.volume)) : 0.8;
  playerState.isPlaying = playerState.isPlaying === true;

  document.documentElement.setAttribute('data-theme', settings.theme);

  var navLinks = document.querySelector('.site-nav .nav-links');
  if (!navLinks) return;

  var gearItem = document.createElement('li');
  gearItem.className = 'settings-nav-item';
  gearItem.innerHTML = '<button class="settings-trigger" type="button" aria-label="Open settings" title="Settings">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.6 8.96a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.04V3h4v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15z"></path></svg>' +
    '</button>';
  navLinks.appendChild(gearItem);

  var backdrop = document.createElement('div');
  backdrop.className = 'settings-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML =
    '<section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">' +
      '<div class="settings-heading"><h2 id="settings-title">Settings</h2><button class="settings-close" type="button" aria-label="Close settings">×</button></div>' +
      '<div class="settings-section"><span class="settings-label">Theme</span>' +
        '<div class="theme-options">' +
          themeOption('dark', 'Dark') + themeOption('light', 'White') + themeOption('gray', 'Gray') + themeOption('colorful', 'Colorful') +
        '</div>' +
      '</div>' +
      '<div class="settings-section"><span class="settings-label">Music</span>' +
        '<div class="music-setting-row"><div class="music-setting-copy"><strong>Music across pages</strong><span>Continue listening while browsing the site</span></div>' +
          '<label class="settings-switch"><input id="settings-music" type="checkbox"><span class="settings-switch-track"></span></label>' +
        '</div>' +
        '<label class="settings-volume"><span>Volume</span><input id="settings-volume" type="range" min="0" max="100" step="1"></label>' +
      '</div>' +
    '</section>';
  document.body.appendChild(backdrop);

  function themeOption(value, label) {
    return '<label class="theme-option"><input type="radio" name="site-theme" value="' + value + '">' +
      '<span class="theme-swatch theme-swatch--' + value + '"><i class="theme-dot theme-dot--' + value + '"></i>' + label + '</span></label>';
  }

  var gearButton = gearItem.querySelector('.settings-trigger');
  var closeButton = backdrop.querySelector('.settings-close');
  var musicToggle = backdrop.querySelector('#settings-music');
  var volumeSlider = backdrop.querySelector('#settings-volume');
  var themeInputs = backdrop.querySelectorAll('input[name="site-theme"]');
  var mainPlayer = window.CSolePlayer || null;
  var audio = null;
  var globalAudioCtx = null;
  var globalSourceNode = null;
  var globalGainNode = null;
  var miniPlayer = null;
  var miniTitle = null;
  var miniStatus = null;
  var miniPlay = null;
  var pendingTime = playerState.currentTime;
  var lastSavedSecond = -1;

  themeInputs.forEach(function (input) {
    input.checked = input.value === settings.theme;
    input.addEventListener('change', function () {
      if (!input.checked) return;
      settings.theme = input.value;
      document.documentElement.setAttribute('data-theme', settings.theme);
      saveSettings();
    });
  });

  musicToggle.checked = settings.musicEnabled;
  volumeSlider.value = Math.round(playerState.volume * 100);

  function saveSettings() { writeJson(SETTINGS_KEY, settings); }

  function savePlayerState() {
    if (audio) {
      playerState.currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : playerState.currentTime;
      playerState.volume = audio.volume;
      playerState.isPlaying = !audio.paused;
    } else if (mainPlayer) {
      var current = mainPlayer.getState();
      playerState.currentIndex = current.currentIndex;
      playerState.currentTime = current.currentTime;
      playerState.volume = current.volume;
      playerState.isPlaying = current.isPlaying;
    }
    writeJson(PLAYER_KEY, playerState);
  }

  function openSettings() {
    musicToggle.checked = settings.musicEnabled;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  }

  function closeSettings() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    gearButton.focus();
  }

  gearButton.addEventListener('click', openSettings);
  closeButton.addEventListener('click', closeSettings);
  backdrop.addEventListener('click', function (event) { if (event.target === backdrop) closeSettings(); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && backdrop.classList.contains('is-open')) closeSettings();
  });

  volumeSlider.addEventListener('input', function () {
    playerState.volume = Number(volumeSlider.value) / 100;
    if (mainPlayer) mainPlayer.setVolume(playerState.volume);
    if (audio) audio.volume = playerState.volume;
    savePlayerState();
  });

  musicToggle.addEventListener('change', function () {
    settings.musicEnabled = musicToggle.checked;
    saveSettings();
    if (settings.musicEnabled) {
      if (mainPlayer) mainPlayer.play();
      else playGlobal(true);
    } else {
      if (mainPlayer) mainPlayer.pause();
      else if (audio) audio.pause();
      playerState.isPlaying = false;
      savePlayerState();
      updateMini();
    }
  });

  window.addEventListener('csole-player-play', function () {
    settings.musicEnabled = true;
    musicToggle.checked = true;
    saveSettings();
  });

  if (!mainPlayer) initGlobalPlayer();
  else if (settings.musicEnabled && playerState.isPlaying) mainPlayer.resumeSaved();

  function initGlobalPlayer() {
    audio = new Audio();
    audio.preload = 'none';
    audio.volume = playerState.volume;

    miniPlayer = document.createElement('div');
    miniPlayer.className = 'global-mini-player';
    miniPlayer.setAttribute('aria-label', 'Background music player');
    miniPlayer.innerHTML =
      '<div class="mini-track"><strong></strong><span>C.Sole</span></div>' +
      '<button class="mini-control mini-prev" type="button" aria-label="Previous track">‹</button>' +
      '<button class="mini-control mini-control--play" type="button" aria-label="Play">▶</button>' +
      '<button class="mini-control mini-next" type="button" aria-label="Next track">›</button>';
    document.body.appendChild(miniPlayer);
    miniTitle = miniPlayer.querySelector('strong');
    miniStatus = miniPlayer.querySelector('.mini-track span');
    miniPlay = miniPlayer.querySelector('.mini-control--play');
    miniPlayer.querySelector('.mini-prev').addEventListener('click', function () { changeTrack(-1); });
    miniPlayer.querySelector('.mini-next').addEventListener('click', function () { changeTrack(1); });
    miniPlay.addEventListener('click', function () {
      if (audio.paused) {
        settings.musicEnabled = true;
        musicToggle.checked = true;
        saveSettings();
        playGlobal(true);
      } else audio.pause();
    });

    audio.addEventListener('loadedmetadata', function () {
      if (pendingTime > 0 && pendingTime < audio.duration) audio.currentTime = pendingTime;
      pendingTime = 0;
    });
    audio.addEventListener('play', function () {
      playerState.isPlaying = true;
      miniStatus.textContent = 'Playing · C.Sole';
      updateMini();
      savePlayerState();
    });
    audio.addEventListener('pause', function () {
      playerState.isPlaying = false;
      miniStatus.textContent = 'Paused · C.Sole';
      updateMini();
      savePlayerState();
    });
    audio.addEventListener('timeupdate', function () {
      var second = Math.floor(audio.currentTime);
      if (second !== lastSavedSecond && second % 2 === 0) {
        lastSavedSecond = second;
        savePlayerState();
      }
    });
    audio.addEventListener('ended', function () { changeTrack(1, true); });
    audio.addEventListener('error', function () {
      miniStatus.textContent = 'Unable to load';
      updateMini();
    });

    updateMini();
    if (settings.musicEnabled && playerState.isPlaying) playGlobal(false);
  }

  function initGlobalAudioContext() {
    if (globalAudioCtx || !audio) return;
    try {
      globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      globalSourceNode = globalAudioCtx.createMediaElementSource(audio);
      globalGainNode = globalAudioCtx.createGain();
      globalGainNode.gain.value = BASE_GAIN;
      globalSourceNode.connect(globalGainNode);
      globalGainNode.connect(globalAudioCtx.destination);
    } catch (error) {
      globalAudioCtx = null;
      globalSourceNode = null;
      globalGainNode = null;
    }
  }

  function ensureTrack() {
    if (!isPlayableTrack(playerState.currentIndex)) playerState.currentIndex = findPlayableIndex(0, 1);
    var expected = new URL(playlist[playerState.currentIndex].src, siteRoot).href;
    if (audio.src !== expected) {
      pendingTime = playerState.currentTime;
      audio.src = expected;
      audio.load();
    }
    miniTitle.textContent = playlist[playerState.currentIndex].title;
  }

  function playGlobal(fromUser) {
    ensureTrack();
    initGlobalAudioContext();
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    miniStatus.textContent = 'Loading…';
    updateMini();
    var promise = audio.play();
    if (promise && promise.catch) {
      promise.catch(function () {
        playerState.isPlaying = false;
        miniStatus.textContent = fromUser ? 'Tap play to retry' : 'Tap play to continue';
        updateMini();
      });
    }
  }

  function changeTrack(direction, forcePlay) {
    var wasPlaying = forcePlay || !audio.paused;
    playerState.currentIndex = findPlayableIndex(playerState.currentIndex + direction, direction);
    playerState.currentTime = 0;
    pendingTime = 0;
    audio.src = '';
    ensureTrack();
    savePlayerState();
    if (wasPlaying) playGlobal(true);
    else updateMini();
  }

  function updateMini() {
    if (!miniPlayer) return;
    miniTitle.textContent = playlist[playerState.currentIndex].title;
    miniPlayer.classList.toggle('is-visible', settings.musicEnabled);
    var playing = audio && !audio.paused;
    miniPlay.textContent = playing ? 'Ⅱ' : '▶';
    miniPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  window.addEventListener('pagehide', savePlayerState);
})();
