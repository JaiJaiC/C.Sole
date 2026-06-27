/* ============================================================
   C.Sole — Audio Player Engine + UI
   Vanilla JS, zero dependencies
   ============================================================ */

(function () {
  'use strict';

  // ─── Playlist Data ────────────────────────────────────────
  const PLAYLIST = [
    {
      title: '夜空中最亮的星',
      artist: 'C.Sole',
      src: 'mp3/夜空中最亮的星.mp3',
      cover: 'img/cover-placeholder.svg'
    },
    {
      title: '我是真的爱上你',
      artist: 'C.Sole',
      src: 'mp3/我是真的爱上你.mp3',
      cover: 'img/cover-placeholder.svg'
    },
    {
      title: '我的歌声里',
      artist: 'C.Sole',
      src: 'mp3/我的歌声里.mp3',
      cover: 'img/cover-placeholder.svg'
    }
  ];

  // ─── LocalStorage Helpers ─────────────────────────────────
  const STORAGE_KEY = 'csole_player';

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  // ─── DOM References ───────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);

  const dom = {
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
    playlist:      $('#playlist')
  };

  // ─── Audio Element ────────────────────────────────────────
  const audio = new Audio();
  audio.preload = 'metadata';

  // ─── Player State ─────────────────────────────────────────
  const saved = loadState();

  const state = {
    currentIndex:   saved.currentIndex ?? 0,
    isPlaying:      false,
    currentTime:    0,
    duration:       0,
    volume:         saved.volume ?? 0.8,
    isShuffled:     false,
    repeatMode:     'none',   // 'none' | 'one' | 'all'
    shuffleHistory: []        // stack of previously played indices for "prev" in shuffle
  };

  // ─── Utility ──────────────────────────────────────────────
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function showToast(message, type) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.remove();
    }, 3000);
  }

  // ─── Player Methods ───────────────────────────────────────

  function loadTrack(index) {
    if (index < 0 || index >= PLAYLIST.length) return;

    state.currentIndex = index;
    const track = PLAYLIST[index];

    // Update UI immediately to show "loading" feedback
    dom.trackTitle.textContent = track.title;
    dom.trackArtist.textContent = track.artist;
    dom.coverImg.src = track.cover;
    dom.timeCurrent.textContent = '0:00';
    dom.timeDuration.textContent = '...';
    dom.progressBar.value = 0;

    audio.src = track.src;
    audio.load();
  }

  function play() {
    const promise = audio.play();
    if (promise && promise.catch) {
      promise.catch(function (err) {
        // Autoplay blocked — user hasn't interacted yet
        if (err.name === 'NotAllowedError') {
          // Silently ignore; user must click play
        }
      });
    }
  }

  function pause() {
    audio.pause();
  }

  function togglePlay() {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function next() {
    if (state.repeatMode === 'one') {
      // Replay current track
      audio.currentTime = 0;
      play();
      return;
    }

    // Push current index onto shuffle history before moving
    state.shuffleHistory.push(state.currentIndex);
    // Trim history to last 20 entries
    if (state.shuffleHistory.length > 20) {
      state.shuffleHistory.shift();
    }

    let nextIndex;

    if (state.isShuffled) {
      if (PLAYLIST.length === 1) {
        nextIndex = 0;
      } else {
        // Pick a random index different from current
        do {
          nextIndex = Math.floor(Math.random() * PLAYLIST.length);
        } while (nextIndex === state.currentIndex && PLAYLIST.length > 1);
      }
    } else {
      nextIndex = (state.currentIndex + 1) % PLAYLIST.length;
    }

    loadTrack(nextIndex);

    // Auto-play after switching
    // Small delay to allow browser to load metadata
    setTimeout(function () {
      if (state.isPlaying || state.shuffleHistory.length > 0) {
        play();
      }
    }, 50);
  }

  function prev() {
    // Pop from shuffle history first (if using shuffle)
    if (state.shuffleHistory.length > 0) {
      const prevIndex = state.shuffleHistory.pop();
      loadTrack(prevIndex);
      setTimeout(function () {
        if (state.isPlaying) play();
      }, 50);
      return;
    }

    // If current time > 3 seconds, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      play();
      return;
    }

    // Otherwise go to previous track
    let prevIndex;
    if (state.isShuffled) {
      prevIndex = Math.floor(Math.random() * PLAYLIST.length);
    } else {
      prevIndex = (state.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    }

    loadTrack(prevIndex);
    setTimeout(function () {
      if (state.isPlaying) play();
    }, 50);
  }

  function seek(seconds) {
    if (isFinite(seconds)) {
      audio.currentTime = seconds;
    }
  }

  function setVolume(value) {
    state.volume = Math.max(0, Math.min(1, value));
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
    const modes = ['none', 'all', 'one'];
    const idx = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(idx + 1) % modes.length];

    dom.btnRepeat.classList.remove('repeat-on');
    dom.repeatOne.style.display = 'none';

    if (state.repeatMode === 'all') {
      dom.btnRepeat.classList.add('repeat-on');
    } else if (state.repeatMode === 'one') {
      dom.btnRepeat.classList.add('repeat-on');
      dom.repeatOne.style.display = 'block';
    }
  }

  function updateVolumeIcon() {
    const v = state.volume;
    if (v === 0) {
      dom.volWave1.style.opacity = '0.2';
      dom.volWave2.style.opacity = '0.2';
    } else if (v < 0.5) {
      dom.volWave1.style.opacity = '0.6';
      dom.volWave2.style.opacity = '0.2';
    } else {
      dom.volWave1.style.opacity = '1';
      dom.volWave2.style.opacity = '1';
    }
  }

  function persistState() {
    saveState({
      currentIndex: state.currentIndex,
      volume: state.volume
    });
  }

  // ─── UI Rendering ─────────────────────────────────────────

  function renderPlayingState() {
    if (state.isPlaying) {
      dom.iconPlay.style.display = 'none';
      dom.iconPause.style.display = 'block';
      dom.eqBars.classList.add('active');
      dom.btnPlay.setAttribute('aria-label', 'Pause');
      dom.btnPlay.setAttribute('title', '暂停');
    } else {
      dom.iconPlay.style.display = 'block';
      dom.iconPause.style.display = 'none';
      dom.eqBars.classList.remove('active');
      dom.btnPlay.setAttribute('aria-label', 'Play');
      dom.btnPlay.setAttribute('title', '播放');
    }
  }

  function renderProgress() {
    dom.progressBar.value = state.currentTime;
    dom.progressBar.max = state.duration || 100;
    dom.timeCurrent.textContent = formatTime(state.currentTime);

    // Update duration display once we have it
    if (state.duration > 0) {
      dom.timeDuration.textContent = formatTime(state.duration);
    }
  }

  function renderPlaylist() {
    dom.playlist.innerHTML = '';

    PLAYLIST.forEach(function (track, index) {
      const li = document.createElement('li');
      li.className = 'playlist-item';
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label', 'Play ' + track.title);

      if (index === state.currentIndex) {
        li.classList.add('playlist-item--active');
      }

      // Track number or playing indicator
      const numSpan = document.createElement('span');
      numSpan.className = 'track-num';
      if (index === state.currentIndex && state.isPlaying) {
        // Show animated equalizer bars
        numSpan.innerHTML = '<span class="playing-indicator"><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span><span class="pi-bar"></span></span>';
      } else if (index === state.currentIndex) {
        numSpan.textContent = '▶';
      } else {
        numSpan.textContent = String(index + 1);
      }

      // Track name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'track-name';
      nameSpan.textContent = track.title;

      // Duration (placeholder — gets filled after metadata loads)
      const durSpan = document.createElement('span');
      durSpan.className = 'track-duration';
      durSpan.setAttribute('data-index', index);

      li.appendChild(numSpan);
      li.appendChild(nameSpan);
      li.appendChild(durSpan);

      // Click handler
      li.addEventListener('click', function () {
        if (index === state.currentIndex) {
          // Restart current track
          audio.currentTime = 0;
          play();
        } else {
          state.shuffleHistory.push(state.currentIndex);
          loadTrack(index);
          setTimeout(function () { play(); }, 50);
        }
      });

      // Keyboard handler
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          li.click();
        }
      });

      dom.playlist.appendChild(li);
    });
  }

  // ─── Audio Event Handlers ─────────────────────────────────

  audio.addEventListener('loadstart', function () {
    dom.trackTitle.textContent = PLAYLIST[state.currentIndex].title;
    dom.trackArtist.textContent = 'Loading...';
  });

  audio.addEventListener('loadedmetadata', function () {
    state.duration = audio.duration;
    dom.progressBar.max = audio.duration || 100;
    dom.timeDuration.textContent = formatTime(audio.duration);

    // Update playlist item duration
    const durSpan = document.querySelector('.track-duration[data-index="' + state.currentIndex + '"]');
    if (durSpan) {
      durSpan.textContent = formatTime(audio.duration);
    }

    dom.trackArtist.textContent = 'C.Sole';
  });

  audio.addEventListener('timeupdate', function () {
    state.currentTime = audio.currentTime;
    // Throttle via requestAnimationFrame for smooth but efficient updates
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
    if (state.repeatMode === 'one') {
      audio.currentTime = 0;
      play();
    } else if (state.repeatMode === 'all') {
      next();
    } else {
      // 'none' — advance to next track, but stop at the end of playlist
      if (state.currentIndex < PLAYLIST.length - 1) {
        next();
      } else {
        // End of playlist: stop
        state.isPlaying = false;
        renderPlayingState();
        renderPlaylist();
        audio.currentTime = 0;
      }
    }
  });

  audio.addEventListener('error', function () {
    const track = PLAYLIST[state.currentIndex];
    showToast('无法加载: ' + track.title + '，即将跳过...', 'error');

    // Skip to next track after a short delay
    setTimeout(function () {
      if (state.currentIndex < PLAYLIST.length - 1) {
        next();
      }
    }, 2000);
  });

  audio.addEventListener('waiting', function () {
    dom.trackArtist.textContent = 'Buffering...';
  });

  audio.addEventListener('canplay', function () {
    dom.trackArtist.textContent = 'C.Sole';
  });

  // ─── UI Event Handlers ────────────────────────────────────

  // Play / Pause
  dom.btnPlay.addEventListener('click', togglePlay);

  // Keyboard: Space to toggle play
  document.addEventListener('keydown', function (e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      seek(Math.min(audio.currentTime + (e.shiftKey ? 10 : 5), state.duration || 0));
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      seek(Math.max(audio.currentTime - (e.shiftKey ? 10 : 5), 0));
    }
  });

  // Prev / Next
  dom.btnPrev.addEventListener('click', prev);
  dom.btnNext.addEventListener('click', next);

  // Progress bar
  dom.progressBar.addEventListener('input', function () {
    seek(parseFloat(dom.progressBar.value));
  });

  // Volume
  dom.volumeSlider.addEventListener('input', function () {
    setVolume(parseInt(dom.volumeSlider.value, 10) / 100);
  });

  // Shuffle
  dom.btnShuffle.addEventListener('click', toggleShuffle);

  // Repeat
  dom.btnRepeat.addEventListener('click', toggleRepeat);

  // ─── Init ─────────────────────────────────────────────────

  function init() {
    // Restore volume
    audio.volume = state.volume;
    dom.volumeSlider.value = Math.round(state.volume * 100);
    updateVolumeIcon();

    // Load first track
    loadTrack(state.currentIndex);

    // Render playlist
    renderPlaylist();

    // Initial UI
    renderPlayingState();
  }

  init();

})();
