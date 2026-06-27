/* ============================================================
   C.Sole — Audio Player + Note Rain + Spectrum + Lyrics
   Vanilla JS, zero dependencies
   ============================================================ */

(function () {
  'use strict';

  // ─── Lyrics Data ─────────────────────────────────────────
  const LYRICS = {
    '夜空中最亮的星': [
      { time: 0,   text: '夜空中最亮的星' },
      { time: 4,   text: '能否听清' },
      { time: 8,   text: '那仰望的人' },
      { time: 12,  text: '心底的孤独和叹息' },
      { time: 18,  text: '夜空中最亮的星' },
      { time: 22,  text: '能否记起' },
      { time: 26,  text: '曾与我同行' },
      { time: 30,  text: '消失在风里的身影' },
      { time: 36,  text: '我祈祷拥有一颗透明的心灵' },
      { time: 42,  text: '和会流泪的眼睛' },
      { time: 48,  text: '给我再去相信的勇气' },
      { time: 52,  text: '越过谎言去拥抱你' },
      { time: 58,  text: '每当我找不到存在的意义' },
      { time: 64,  text: '每当我迷失在黑夜里' },
      { time: 70,  text: '夜空中最亮的星' },
      { time: 76,  text: '请指引我靠近你' }
    ],
    '我是真的爱上你': [
      { time: 0,   text: '你有一双会说话的眼睛' },
      { time: 5,   text: '你有善解人意的心' },
      { time: 10,  text: '不知天高地厚的我' },
      { time: 15,  text: '你的微笑总是让我为你着迷' },
      { time: 22,  text: '你有一双深情的眼睛' },
      { time: 27,  text: '你有融化冰雪的魔力' },
      { time: 32,  text: '从来不敢奢求的我' },
      { time: 37,  text: '你的美丽总是让我躲不过去' },
      { time: 44,  text: '什么原因你的发香总挥之不去' },
      { time: 50,  text: '我的世界什么时候' },
      { time: 54,  text: '开始昼夜难分' },
      { time: 58,  text: '翻天覆地来去' },
      { time: 60,  text: '都是因为想你' },
      { time: 66,  text: '喔...我偷偷的爱上你' },
      { time: 74,  text: '却不敢告诉你' },
      { time: 78,  text: '因为我知道' },
      { time: 82,  text: '我给不到你要的东西' }
    ],
    '我的歌声里': [
      { time: 0,   text: '没有一点点防备' },
      { time: 4,   text: '也没有一丝顾虑' },
      { time: 8,   text: '你就这样出现' },
      { time: 12,  text: '在我的世界里' },
      { time: 16,  text: '带给我惊喜' },
      { time: 20,  text: '情不自已' },
      { time: 26,  text: '可是你偏又这样' },
      { time: 30,  text: '在我不知不觉中' },
      { time: 34,  text: '悄悄的消失' },
      { time: 38,  text: '从我的世界里' },
      { time: 42,  text: '没有音讯' },
      { time: 46,  text: '剩下的只是回忆' },
      { time: 52,  text: '你存在 我深深的脑海里' },
      { time: 58,  text: '我的梦里 我的心里' },
      { time: 62,  text: '我的歌声里' },
      { time: 68,  text: '你存在 我深深的脑海里' },
      { time: 74,  text: '我的梦里 我的心里' },
      { time: 80,  text: '我的歌声里' }
    ]
  };

  // ─── Song Covers (per-track SVGs with distinct colors) ───
  const COVERS = {
    '夜空中最亮的星': 'img/cover-stars.svg',
    '我是真的爱上你': 'img/cover-love.svg',
    '我的歌声里':     'img/cover-song.svg'
  };

  // ─── Playlist Data ────────────────────────────────────────
  const PLAYLIST = [
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
  const STORAGE_KEY = 'csole_player';
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
    notesCanvas:   $('#notes-rain'),
    heroGuitar:    $('#hero-guitar'),
    trackTitle:    $('#track-title'),
    trackArtist:   $('#track-artist'),
    coverImg:      $('#cover-img'),
    eqBars:        $('#eq-bars'),
    progressBar:   $('#progress-bar'),
    timeCurrent:   $('#time-current'),
    timeDuration:  $('#time-duration'),
    btnPlay:       $('#btn-play'),
    iconPlay:      $('#icon-play'),
    iconPause:     $('#icon-pause'),
    btnPrev:       $('#btn-prev'),
    btnNext:       $('#btn-next'),
    btnShuffle:    $('#btn-shuffle'),
    btnRepeat:     $('#btn-repeat'),
    repeatOne:     $('#repeat-one'),
    volumeSlider:  $('#volume-slider'),
    iconVolume:    $('#icon-volume'),
    volWave1:      $('#vol-wave-1'),
    volWave2:      $('#vol-wave-2'),
    playlist:      $('#playlist'),
    spectrumCanvas:$('#spectrum-canvas'),
    lyricsLines:   $('#lyrics-lines'),
    lyricsPlaceholder: $('#lyrics-placeholder')
  };

  // ─── Audio Element ────────────────────────────────────────
  var audio = new Audio();
  audio.preload = 'metadata';

  // ─── Web Audio Context (for visualizer) ───────────────────
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
      // If already connected or not supported, fallback gracefully
      audioCtx = null;
      analyser = null;
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

  // ─── NOTES RAIN (Canvas) ──────────────────────────────────
  var notesRainRunning = false;
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

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initial spawn
    var noteCount = 120; // 大量音符
    spawnNote(w, noteCount);

    notesRainRunning = true;

    function animate() {
      if (!notesRainRunning) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        n.y += n.speed;
        n.wobbleOffset += n.wobbleSpeed;

        var wobX = Math.sin(n.wobbleOffset) * n.wobbleAmp;

        ctx.font = n.size + 'px serif';
        ctx.fillStyle = 'rgba(232, 168, 80, ' + n.opacity + ')';
        ctx.fillText(n.char, n.x + wobX, n.y);

        // Reset when off screen
        if (n.y > h + 50) {
          n.y = -(Math.random() * 200) - 20;
          n.x = Math.random() * w;
          n.speed = 0.3 + Math.random() * 1.2;
          n.opacity = 0.08 + Math.random() * 0.2;
        }
      }

      // Maintain note count
      while (notes.length < noteCount) {
        spawnNote(w, 1);
      }
      // Cap
      if (notes.length > noteCount + 30) {
        notes.splice(0, notes.length - noteCount);
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Speed up/down notes when playing
  function setNotesRainSpeed(fast) {
    for (var i = 0; i < notes.length; i++) {
      notes[i].speed = fast
        ? 0.6 + Math.random() * 2.0
        : 0.3 + Math.random() * 1.2;
    }
  }

  // ─── SPECTRUM VISUALIZER (Canvas) ─────────────────────────
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
    window.addEventListener('resize', function () {
      resize();
    });

    function draw() {
      if (!visRunning) {
        // Still draw idle bars
        requestAnimationFrame(function () { draw(); });
      }

      ctx.clearRect(0, 0, w, h);

      if (!analyser) {
        // Draw idle flat line
        drawIdleBars(ctx, w, h);
        requestAnimationFrame(function () { draw(); });
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

        // Gradient from amber to dim
        var intensity = val / 255;
        var r = Math.floor(232 * intensity + 160 * (1 - intensity));
        var g = Math.floor(168 * intensity + 160 * (1 - intensity));
        var b = Math.floor(80 * intensity + 160 * (1 - intensity));
        var alpha = 0.3 + intensity * 0.7;

        ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';

        var x = i * (barWidth + gap);
        var y = h - barHeight;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
        ctx.fill();
      }

      requestAnimationFrame(function () { draw(); });
    }

    function drawIdleBars(context, cw, ch) {
      // Nice gentle idle wave when no audio context
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

  // Start visualizer on first user interaction
  function ensureVisRunning() {
    if (!audioCtx) initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!visRunning) {
      visRunning = true;
    }
  }

  // ─── LYRICS DISPLAY ───────────────────────────────────────
  var currentLyrics = null;
  var lastActiveIdx = -1;

  function setLyrics(trackTitle) {
    currentLyrics = LYRICS[trackTitle] || null;

    if (!currentLyrics || currentLyrics.length === 0) {
      dom.lyricsPlaceholder.style.display = 'block';
      dom.lyricsLines.innerHTML = '';
      return;
    }

    dom.lyricsPlaceholder.style.display = 'none';
    dom.lyricsLines.innerHTML = '';

    for (var i = 0; i < currentLyrics.length; i++) {
      var line = document.createElement('p');
      line.className = 'lyric-line';
      line.textContent = currentLyrics[i].text;
      line.setAttribute('data-idx', i);
      dom.lyricsLines.appendChild(line);
    }

    lastActiveIdx = -1;
  }

  function updateLyrics(time) {
    if (!currentLyrics || currentLyrics.length === 0) return;

    var activeIdx = -1;

    // Find the lyric line that should be active at current time
    for (var i = currentLyrics.length - 1; i >= 0; i--) {
      if (time >= currentLyrics[i].time) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx === lastActiveIdx) return;
    lastActiveIdx = activeIdx;

    var lines = dom.lyricsLines.children;
    for (var i = 0; i < lines.length; i++) {
      lines[i].classList.remove('active', 'past');
      if (i < activeIdx) {
        lines[i].classList.add('past');
      } else if (i === activeIdx) {
        lines[i].classList.add('active');
      }
    }

    // Scroll active line into view
    if (activeIdx >= 0 && lines[activeIdx]) {
      lines[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ─── Player Methods ───────────────────────────────────────

  function loadTrack(index) {
    if (index < 0 || index >= PLAYLIST.length) return;
    state.currentIndex = index;
    var track = PLAYLIST[index];

    dom.trackTitle.textContent = track.title;
    dom.trackArtist.textContent = 'C.Sole';
    dom.coverImg.src = track.cover;
    dom.timeCurrent.textContent = '0:00';
    dom.timeDuration.textContent = '...';
    dom.progressBar.value = 0;

    // Load lyrics for this track
    setLyrics(track.title);
    lastActiveIdx = -1;

    audio.src = track.src;
    audio.load();

    persistState();
  }

  function play() {
    ensureVisRunning();
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err.name === 'NotAllowedError') { /* ignore - needs user gesture */ }
      });
    }
  }

  function pause() { audio.pause(); }
  function togglePlay() { state.isPlaying ? pause() : play(); }

  function next() {
    if (state.repeatMode === 'one') {
      audio.currentTime = 0;
      play();
      return;
    }
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
    if (state.repeatMode === 'all') { dom.btnRepeat.classList.add('repeat-on'); }
    else if (state.repeatMode === 'one') { dom.btnRepeat.classList.add('repeat-on'); dom.repeatOne.style.display = 'block'; }
  }

  function updateVolumeIcon() {
    var v = state.volume;
    var o1 = v === 0 ? '0.2' : (v < 0.5 ? '0.6' : '1');
    var o2 = v === 0 ? '0.2' : (v < 0.5 ? '0.2' : '1');
    dom.volWave1.style.opacity = o1;
    dom.volWave2.style.opacity = o2;
  }

  function persistState() {
    saveState({ currentIndex: state.currentIndex, volume: state.volume });
  }

  // ─── UI Rendering ─────────────────────────────────────────

  function renderPlayingState() {
    if (state.isPlaying) {
      dom.iconPlay.style.display = 'none';
      dom.iconPause.style.display = 'block';
      dom.eqBars.classList.add('active');
      dom.btnPlay.setAttribute('aria-label', 'Pause');
      dom.btnPlay.setAttribute('title', '暂停');
      dom.heroGuitar.classList.add('playing');
      setNotesRainSpeed(true);
    } else {
      dom.iconPlay.style.display = 'block';
      dom.iconPause.style.display = 'none';
      dom.eqBars.classList.remove('active');
      dom.btnPlay.setAttribute('aria-label', 'Play');
      dom.btnPlay.setAttribute('title', '播放');
      dom.heroGuitar.classList.remove('playing');
      setNotesRainSpeed(false);
    }
  }

  function renderProgress() {
    dom.progressBar.value = state.currentTime;
    dom.progressBar.max = state.duration || 100;
    dom.timeCurrent.textContent = formatTime(state.currentTime);
    if (state.duration > 0) {
      dom.timeDuration.textContent = formatTime(state.duration);
    }
    // Update lyrics based on current time
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

      var numSpan = document.createElement('span');
      numSpan.className = 'track-num';
      if (index === state.currentIndex && state.isPlaying) {
        numSpan.innerHTML = '<span class="playing-indicator"><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span></span>';
      } else if (index === state.currentIndex) {
        numSpan.innerHTML = '▶';
      } else {
        numSpan.textContent = index + 1;
      }

      var nameSpan = document.createElement('span');
      nameSpan.className = 'track-name';
      nameSpan.textContent = track.title;

      var durSpan = document.createElement('span');
      durSpan.className = 'track-duration';
      durSpan.setAttribute('data-index', index);

      li.appendChild(numSpan);
      li.appendChild(nameSpan);
      li.appendChild(durSpan);

      li.addEventListener('click', function () {
        if (index === state.currentIndex) {
          audio.currentTime = 0;
          play();
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

  // ─── Audio Events ─────────────────────────────────────────

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
    dom.trackArtist.textContent = 'C.Sole';
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
    showToast('无法加载: ' + PLAYLIST[state.currentIndex].title + '，即将跳过...', 'error');
    setTimeout(function () { if (state.currentIndex < PLAYLIST.length - 1) next(); }, 2000);
  });

  audio.addEventListener('waiting', function () { dom.trackArtist.textContent = 'Buffering...'; });
  audio.addEventListener('canplay', function () { dom.trackArtist.textContent = 'C.Sole'; });

  // ─── UI Events ────────────────────────────────────────────

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

  // ─── Init ─────────────────────────────────────────────────

  function init() {
    // Restore volume
    audio.volume = state.volume;
    dom.volumeSlider.value = Math.round(state.volume * 100);
    updateVolumeIcon();

    // Start notes rain
    initNotesRain();

    // Start spectrum (idle wave until audio plays)
    initSpectrum();

    // Load first track
    loadTrack(state.currentIndex);

    // Render playlist
    renderPlaylist();

    // Initial UI
    renderPlayingState();
  }

  init();

})();
