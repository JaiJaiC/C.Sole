/* ============================================================
   C.Sole — Player + Note Rain + Spectrum + Dynamic Lyrics
   Vanilla JS, zero dependencies
   ============================================================ */

(function () {
  'use strict';

  // ─── Lyrics Data (timed, original Chinese lyrics) ─────────
  var LYRICS = {
    '夜空中最亮的星': [
      { time: 0,   text: '夜空中最亮的星' },
      { time: 5,   text: '能否听清' },
      { time: 9,   text: '那仰望的人' },
      { time: 13,  text: '心底的孤独和叹息' },
      { time: 19,  text: '夜空中最亮的星' },
      { time: 23,  text: '能否记起' },
      { time: 27,  text: '曾与我同行' },
      { time: 31,  text: '消失在风里的身影' },
      { time: 37,  text: '我祈祷拥有一颗透明的心灵' },
      { time: 43,  text: '和会流泪的眼睛' },
      { time: 49,  text: '给我再去相信的勇气' },
      { time: 53,  text: '越过谎言去拥抱你' },
      { time: 59,  text: '每当我找不到存在的意义' },
      { time: 65,  text: '每当我迷失在黑夜里' },
      { time: 71,  text: '夜空中最亮的星' },
      { time: 77,  text: '请指引我靠近你' }
    ],
    '我是真的爱上你': [
      { time: 0,   text: '你有一双会说话的眼睛' },
      { time: 6,   text: '你有善解人意的心' },
      { time: 11,  text: '不知天高地厚的我' },
      { time: 16,  text: '你的微笑总是让我为你着迷' },
      { time: 23,  text: '你有一双深情的眼睛' },
      { time: 28,  text: '你有融化冰雪的魔力' },
      { time: 33,  text: '从来不敢奢求的我' },
      { time: 38,  text: '你的美丽总是让我躲不过去' },
      { time: 45,  text: '什么原因你的发香总挥之不去' },
      { time: 51,  text: '我的世界什么时候' },
      { time: 55,  text: '开始昼夜难分' },
      { time: 59,  text: '翻天覆地来去都是因为想你' },
      { time: 67,  text: '喔...我偷偷的爱上你' },
      { time: 75,  text: '却不敢告诉你' },
      { time: 79,  text: '因为我知道我给不到你要的东西' }
    ],
    '我的歌声里': [
      { time: 0,   text: '没有一点点防备' },
      { time: 5,   text: '也没有一丝顾虑' },
      { time: 9,   text: '你就这样出现在我的世界里' },
      { time: 15,  text: '带给我惊喜 情不自已' },
      { time: 22,  text: '可是你偏又这样' },
      { time: 27,  text: '在我不知不觉中悄悄的消失' },
      { time: 33,  text: '从我的世界里没有音讯' },
      { time: 39,  text: '剩下的只是回忆' },
      { time: 45,  text: '你存在 我深深的脑海里' },
      { time: 53,  text: '我的梦里 我的心里 我的歌声里' },
      { time: 61,  text: '你存在 我深深的脑海里' },
      { time: 69,  text: '我的梦里 我的心里 我的歌声里' }
    ]
  };

  // ─── Song Covers ──────────────────────────────────────────
  var COVERS = {
    '夜空中最亮的星': 'img/cover-stars.svg',
    '我是真的爱上你': 'img/cover-love.svg',
    '我的歌声里':     'img/cover-song.svg'
  };

  // ─── Cover artist credits ─────────────────────────────────
  var COVER_CREDITS = {
    '夜空中最亮的星': '逃跑计划',
    '我是真的爱上你': '王杰',
    '我的歌声里':     '曲婉婷'
  };

  // ─── Playlist Data ────────────────────────────────────────
  var PLAYLIST = [
    {
      title: '夜空中最亮的星',
      artist: 'C.Sole',
      src: 'mp3/夜空中最亮的星.mp3',
      cover: COVERS['夜空中最亮的星']
    },
    {
      title: '我是真的爱上你',
      artist: 'C.Sole',
      src: 'mp3/我是真的爱上你.mp3',
      cover: COVERS['我是真的爱上你']
    },
    {
      title: '我的歌声里',
      artist: 'C.Sole',
      src: 'mp3/我的歌声里.mp3',
      cover: COVERS['我的歌声里']
    }
  ];

  // ─── LocalStorage ─────────────────────────────────────────
  var STORAGE_KEY = 'csole_player';
  function loadState() {
    try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return {};
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // ─── DOM Refs ─────────────────────────────────────────────
  var $ = function (sel) { return document.querySelector(sel); };

  var dom = {
    notesCanvas:      $('#notes-rain'),
    heroGuitar:       $('#hero-guitar'),
    trackTitle:       $('#track-title'),
    trackArtist:      $('#track-artist'),
    coverImg:         $('#cover-img'),
    eqBars:           $('#eq-bars'),
    progressBar:      $('#progress-bar'),
    timeCurrent:      $('#time-current'),
    timeDuration:     $('#time-duration'),
    btnPlay:          $('#btn-play'),
    iconPlay:         $('#icon-play'),
    iconPause:        $('#icon-pause'),
    btnPrev:          $('#btn-prev'),
    btnNext:          $('#btn-next'),
    btnShuffle:       $('#btn-shuffle'),
    btnRepeat:        $('#btn-repeat'),
    repeatOne:        $('#repeat-one'),
    volumeSlider:     $('#volume-slider'),
    iconVolume:       $('#icon-volume'),
    volWave1:         $('#vol-wave-1'),
    volWave2:         $('#vol-wave-2'),
    playlist:         $('#playlist'),
    spectrumCanvas:   $('#spectrum-canvas'),
    lyricsDynamic:    $('#lyrics-dynamic'),
    lyricLineDynamic: $('#lyric-line-dynamic'),
    lyricsPlaceholder:$('#lyrics-placeholder')
  };

  // ─── Audio Element ────────────────────────────────────────
  var audio = new Audio();
  audio.preload = 'metadata';

  // ─── Web Audio Context ────────────────────────────────────
  var audioCtx = null;
  var analyser = null;
  var sourceNode = null;
  var visRunning = false;

  function initAudioContext() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) {
      audioCtx = null; analyser = null;
    }
  }

  // ─── Player State ─────────────────────────────────────────
  var saved = loadState();
  var state = {
    currentIndex:   saved.currentIndex || 0,
    isPlaying:      false,
    currentTime:    0,
    duration:       0,
    volume:         saved.volume != null ? saved.volume : 0.8,
    isShuffled:     false,
    repeatMode:     'none',
    shuffleHistory: [],
    _rafPending:    false
  };

  // ─── Utility ──────────────────────────────────────────────
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function showToast(msg, type) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ═══════ NOTES RAIN ═══════════════════════════════════════
  var notes = [];
  var noteChars = ['♪', '♫', '♬', '♩', '♭', '♯'];

  function spawnNote(w, count) {
    for (var i = 0; i < (count || 1); i++) {
      notes.push({
        x: Math.random() * w,
        y: -(Math.random() * 300) - 10,
        speed: 0.3 + Math.random() * 1.2,
        size: 14 + Math.random() * 22,
        opacity: 0.08 + Math.random() * 0.2,
        char: noteChars[Math.floor(Math.random() * noteChars.length)],
        wobbleAmp: 0.3 + Math.random() * 1.5,
        wobbleSpeed: 0.005 + Math.random() * 0.02,
        wobbleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function initNotesRain() {
    var canvas = dom.notesCanvas;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h;

    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    var noteCount = 120;
    spawnNote(w, noteCount);

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        n.y += n.speed;
        n.wobbleOffset += n.wobbleSpeed;
        var wobX = Math.sin(n.wobbleOffset) * n.wobbleAmp;
        ctx.font = n.size + 'px serif';
        ctx.fillStyle = 'rgba(232, 168, 80, ' + n.opacity + ')';
        ctx.fillText(n.char, n.x + wobX, n.y);
        if (n.y > h + 50) {
          n.y = -(Math.random() * 200) - 20;
          n.x = Math.random() * w;
          n.speed = 0.3 + Math.random() * 1.2;
          n.opacity = 0.08 + Math.random() * 0.2;
        }
      }
      while (notes.length < noteCount) spawnNote(w, 1);
      if (notes.length > noteCount + 30) notes.splice(0, notes.length - noteCount);
      requestAnimationFrame(animate);
    }
    animate();
  }

  function setNotesRainSpeed(fast) {
    for (var i = 0; i < notes.length; i++) {
      notes[i].speed = fast ? 0.6 + Math.random() * 2.0 : 0.3 + Math.random() * 1.2;
    }
  }

  // ═══════ SPECTRUM VISUALIZER ══════════════════════════════
  function initSpectrum() {
    var canvas = dom.spectrumCanvas;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = canvas.width  = rect.width * (window.devicePixelRatio || 1);
      h = canvas.height = rect.height * (window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);

      if (!analyser) {
        drawIdleWave(ctx, w, h);
        requestAnimationFrame(draw);
        return;
      }

      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      var barCount = 64;
      var step = Math.floor(bufferLength / barCount);
      var barWidth = (w / barCount) * 0.75;
      var gap = (w / barCount) * 0.25;

      for (var i = 0; i < barCount; i++) {
        var val = dataArray[i * step] || 0;
        var barHeight = (val / 255) * h * 0.9;
        var intensity = val / 255;
        var r = Math.floor(232 * intensity + 100 * (1 - intensity));
        var g = Math.floor(168 * intensity + 100 * (1 - intensity));
        var b = Math.floor(80 * intensity + 100 * (1 - intensity));
        var alpha = 0.3 + intensity * 0.7;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        var x = i * (barWidth + gap);
        var y = h - barHeight;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    function drawIdleWave(context, cw, ch) {
      var t = Date.now() / 1000;
      var barCount = 64;
      var barWidth = (cw / barCount) * 0.75;
      var gap = (cw / barCount) * 0.25;
      for (var i = 0; i < barCount; i++) {
        var wave = Math.sin(t * 2 + i * 0.15) * 0.3 + 0.4;
        var bh = wave * ch * 0.4;
        context.fillStyle = 'rgba(232, 168, 80, 0.12)';
        var x = i * (barWidth + gap);
        var y = ch - bh;
        context.beginPath();
        context.roundRect(x, y, barWidth, bh, [barWidth / 2, barWidth / 2, 0, 0]);
        context.fill();
      }
    }

    visRunning = true;
    draw();
  }

  function ensureVisRunning() {
    if (!audioCtx) initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  // ═══════ DYNAMIC LYRICS (single line, crossfade) ══════════
  var currentLyrics = null;
  var lastActiveIdx = -1;
  var lyricsTimeout = null;

  function setLyrics(trackTitle) {
    currentLyrics = LYRICS[trackTitle] || null;
    lastActiveIdx = -1;

    if (!currentLyrics || currentLyrics.length === 0) {
      dom.lyricsDynamic.style.display = 'none';
      dom.lyricsPlaceholder.style.display = 'block';
      return;
    }

    dom.lyricsPlaceholder.style.display = 'none';
    dom.lyricsDynamic.style.display = 'block';
    dom.lyricLineDynamic.textContent = '';
    dom.lyricLineDynamic.classList.remove('fading', 'entering');
  }

  function updateLyrics(time) {
    if (!currentLyrics || currentLyrics.length === 0) return;

    // Find the current lyric line by time
    var activeIdx = -1;
    for (var i = currentLyrics.length - 1; i >= 0; i--) {
      if (time >= currentLyrics[i].time) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx === lastActiveIdx) return;

    var el = dom.lyricLineDynamic;
    var newText = (activeIdx >= 0) ? currentLyrics[activeIdx].text : '';

    if (lastActiveIdx === -1) {
      // First lyric — just set it
      el.textContent = newText;
      el.classList.remove('fading', 'entering');
    } else {
      // Crossfade: fade out → change text → fade in
      el.classList.add('fading');
      el.classList.remove('entering');

      if (lyricsTimeout) clearTimeout(lyricsTimeout);
      lyricsTimeout = setTimeout(function () {
        el.textContent = newText;
        el.classList.remove('fading');
        el.classList.add('entering');
        // Force reflow, then animate in
        void el.offsetWidth;
        el.classList.remove('entering');
        el.classList.add('fading');
        void el.offsetWidth;
        el.classList.remove('fading');
      }, 400);
    }

    lastActiveIdx = activeIdx;
  }

  // ═══════ PLAYER METHODS ════════════════════════════════════

  function loadTrack(index) {
    if (index < 0 || index >= PLAYLIST.length) return;
    state.currentIndex = index;
    var track = PLAYLIST[index];

    dom.trackTitle.textContent = track.title;
    dom.coverImg.src = track.cover;
    dom.timeCurrent.textContent = '0:00';
    dom.timeDuration.textContent = '...';
    dom.progressBar.value = 0;

    // Show COVER credit in artist line
    var credit = COVER_CREDITS[track.title];
    dom.trackArtist.textContent = credit ? 'C.Sole · COVER ' + credit : 'C.Sole';

    // Load lyrics
    setLyrics(track.title);

    audio.src = track.src;
    audio.load();
    persistState();
  }

  function play() {
    ensureVisRunning();
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err.name === 'NotAllowedError') { /* needs user gesture */ }
      });
    }
  }

  function pause() { audio.pause(); }
  function togglePlay() { state.isPlaying ? pause() : play(); }

  function next() {
    if (state.repeatMode === 'one') { audio.currentTime = 0; play(); return; }
    state.shuffleHistory.push(state.currentIndex);
    if (state.shuffleHistory.length > 20) state.shuffleHistory.shift();
    var nextIdx;
    if (state.isShuffled) {
      do { nextIdx = Math.floor(Math.random() * PLAYLIST.length); }
      while (nextIdx === state.currentIndex && PLAYLIST.length > 1);
    } else {
      nextIdx = (state.currentIndex + 1) % PLAYLIST.length;
    }
    loadTrack(nextIdx);
    setTimeout(function () { if (state.isPlaying) play(); }, 80);
  }

  function prev() {
    if (state.shuffleHistory.length > 0) {
      loadTrack(state.shuffleHistory.pop());
      setTimeout(function () { if (state.isPlaying) play(); }, 80);
      return;
    }
    if (audio.currentTime > 3) { audio.currentTime = 0; play(); return; }
    var prevIdx = (state.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    loadTrack(prevIdx);
    setTimeout(function () { if (state.isPlaying) play(); }, 80);
  }

  function seek(sec) { if (isFinite(sec)) audio.currentTime = sec; }

  function setVolume(val) {
    state.volume = Math.max(0, Math.min(1, val));
    audio.volume = state.volume;
    dom.volumeSlider.value = Math.round(state.volume * 100);
    updateVolumeIcon();
    persistState();
  }

  function toggleShuffle() {
    state.isShuffled = !state.isShuffled;
    if (state.isShuffled) {
      state.shuffleHistory = [];
      dom.btnShuffle.classList.add('shuffle-on');
    } else {
      dom.btnShuffle.classList.remove('shuffle-on');
    }
  }

  function toggleRepeat() {
    var modes = ['none', 'all', 'one'];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % 3];
    dom.btnRepeat.classList.remove('repeat-on');
    dom.repeatOne.style.display = 'none';
    if (state.repeatMode === 'all') dom.btnRepeat.classList.add('repeat-on');
    else if (state.repeatMode === 'one') { dom.btnRepeat.classList.add('repeat-on'); dom.repeatOne.style.display = 'block'; }
  }

  function updateVolumeIcon() {
    var v = state.volume;
    dom.volWave1.style.opacity = v === 0 ? '0.2' : (v < 0.5 ? '0.6' : '1');
    dom.volWave2.style.opacity = v === 0 ? '0.2' : (v < 0.5 ? '0.2' : '1');
  }

  function persistState() {
    saveState({ currentIndex: state.currentIndex, volume: state.volume });
  }

  // ═══════ UI RENDERING ══════════════════════════════════════

  function renderPlayingState() {
    if (state.isPlaying) {
      dom.iconPlay.style.display = 'none';
      dom.iconPause.style.display = 'block';
      dom.eqBars.classList.add('active');
      dom.btnPlay.setAttribute('aria-label', 'Pause');
      dom.heroGuitar.classList.add('playing');
      setNotesRainSpeed(true);
    } else {
      dom.iconPlay.style.display = 'block';
      dom.iconPause.style.display = 'none';
      dom.eqBars.classList.remove('active');
      dom.btnPlay.setAttribute('aria-label', 'Play');
      dom.heroGuitar.classList.remove('playing');
      setNotesRainSpeed(false);
    }
  }

  function renderProgress() {
    dom.progressBar.value = state.currentTime;
    dom.progressBar.max = state.duration || 100;
    dom.timeCurrent.textContent = formatTime(state.currentTime);
    if (state.duration > 0) dom.timeDuration.textContent = formatTime(state.duration);
    updateLyrics(state.currentTime);
  }

  function renderPlaylist() {
    dom.playlist.innerHTML = '';
    PLAYLIST.forEach(function (track, index) {
      var li = document.createElement('li');
      li.className = 'playlist-item';
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label', 'Play ' + track.title);
      if (index === state.currentIndex) li.classList.add('playlist-item--active');

      // Track number or playing indicator
      var numSpan = document.createElement('span');
      numSpan.className = 'track-num';
      if (index === state.currentIndex && state.isPlaying) {
        numSpan.innerHTML = '<span class="playing-indicator"><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span></span>';
      } else if (index === state.currentIndex) {
        numSpan.innerHTML = '▶';
      } else {
        numSpan.textContent = index + 1;
      }

      // Track name with COVER credit
      var nameSpan = document.createElement('span');
      nameSpan.className = 'track-name';
      var credit = COVER_CREDITS[track.title];
      nameSpan.textContent = credit ? track.title + ' (COVER ' + credit + ')' : track.title;

      // Duration
      var durSpan = document.createElement('span');
      durSpan.className = 'track-duration';
      durSpan.setAttribute('data-index', index);

      li.appendChild(numSpan);
      li.appendChild(nameSpan);
      li.appendChild(durSpan);

      li.addEventListener('click', function () {
        if (index === state.currentIndex) {
          audio.currentTime = 0; play();
        } else {
          state.shuffleHistory.push(state.currentIndex);
          loadTrack(index);
          setTimeout(function () { play(); }, 80);
        }
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
      });

      dom.playlist.appendChild(li);
    });
  }

  // ═══════ AUDIO EVENTS ═════════════════════════════════════

  audio.addEventListener('loadstart', function () {
    dom.trackTitle.textContent = PLAYLIST[state.currentIndex].title;
    dom.trackArtist.textContent = 'Loading...';
  });

  audio.addEventListener('loadedmetadata', function () {
    state.duration = audio.duration;
    dom.progressBar.max = audio.duration || 100;
    dom.timeDuration.textContent = formatTime(audio.duration);
    var durSpan = document.querySelector('.track-duration[data-index="' + state.currentIndex + '"]');
    if (durSpan) durSpan.textContent = formatTime(audio.duration);
    var track = PLAYLIST[state.currentIndex];
    var credit = COVER_CREDITS[track.title];
    dom.trackArtist.textContent = credit ? 'C.Sole · COVER ' + credit : 'C.Sole';
  });

  audio.addEventListener('timeupdate', function () {
    state.currentTime = audio.currentTime;
    if (!state._rafPending) {
      state._rafPending = true;
      requestAnimationFrame(function () {
        state._rafPending = false;
        renderProgress();
      });
    }
  });

  audio.addEventListener('play', function () {
    state.isPlaying = true;
    renderPlayingState();
    renderPlaylist();
  });

  audio.addEventListener('pause', function () {
    state.isPlaying = false;
    renderPlayingState();
    renderPlaylist();
  });

  audio.addEventListener('ended', function () {
    if (state.repeatMode === 'one') { audio.currentTime = 0; play(); }
    else if (state.repeatMode === 'all') { next(); }
    else {
      if (state.currentIndex < PLAYLIST.length - 1) { next(); }
      else { state.isPlaying = false; renderPlayingState(); renderPlaylist(); audio.currentTime = 0; }
    }
  });

  audio.addEventListener('error', function () {
    showToast('Unable to load: ' + PLAYLIST[state.currentIndex].title + ' — skipping...', 'error');
    setTimeout(function () { if (state.currentIndex < PLAYLIST.length - 1) next(); }, 2000);
  });

  audio.addEventListener('waiting', function () { dom.trackArtist.textContent = 'Buffering...'; });
  audio.addEventListener('canplay', function () {
    var track = PLAYLIST[state.currentIndex];
    var credit = COVER_CREDITS[track.title];
    dom.trackArtist.textContent = credit ? 'C.Sole · COVER ' + credit : 'C.Sole';
  });

  // ═══════ UI EVENTS ════════════════════════════════════════

  dom.btnPlay.addEventListener('click', togglePlay);

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); seek(Math.min(audio.currentTime + (e.shiftKey ? 10 : 5), state.duration || 0)); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); seek(Math.max(audio.currentTime - (e.shiftKey ? 10 : 5), 0)); }
  });

  dom.btnPrev.addEventListener('click', prev);
  dom.btnNext.addEventListener('click', next);
  dom.progressBar.addEventListener('input', function () { seek(parseFloat(dom.progressBar.value)); });
  dom.volumeSlider.addEventListener('input', function () { setVolume(parseInt(dom.volumeSlider.value, 10) / 100); });
  dom.btnShuffle.addEventListener('click', toggleShuffle);
  dom.btnRepeat.addEventListener('click', toggleRepeat);

  // ═══════ INIT ═════════════════════════════════════════════

  function init() {
    audio.volume = state.volume;
    dom.volumeSlider.value = Math.round(state.volume * 100);
    updateVolumeIcon();
    initNotesRain();
    initSpectrum();
    loadTrack(state.currentIndex);
    renderPlaylist();
    renderPlayingState();
  }

  init();

})();
