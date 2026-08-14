(function () {
  'use strict';

  var THINK_PASSWORD = 'c';
  var GITHUB_OWNER = 'JaiJaiC';
  var GITHUB_REPO = 'C.Sole';
  var GITHUB_BRANCH = 'main';
  var CONTENT_PATH = '5.thinking/thoughts.json';
  var DRAFT_KEY = 'csole-thinking-draft-v2';
  var LEGACY_DRAFT_KEY = 'csole-thinking-draft-v1';
  var TOKEN_KEY = 'csole-thinking-github-token';
  var AUTO_SAVE_INTERVAL = 60 * 1000;
  var MAX_INPUT_IMAGE_BYTES = 12 * 1024 * 1024;
  var MAX_STORED_IMAGE_BYTES = 1.5 * 1024 * 1024;

  var $ = function (id) { return document.getElementById(id); };
  var thinkGate = $('think-gate');
  var thinkInput = $('think-password');
  var thinkError = $('think-error');
  var thoughtsContent = $('thoughts-content');
  var thoughtsList = $('thoughts-list');
  var thoughtTemplate = $('thought-template');
  var addButton = $('add-thought');
  var publishButton = $('publish-thoughts');
  var settingsButton = $('github-settings');
  var statusText = $('editor-status');
  var statusDot = $('editor-status-dot');
  var tokenDialog = $('token-dialog');
  var tokenForm = $('token-form');
  var tokenInput = $('github-token');
  var tokenError = $('token-error');
  var rememberToken = $('remember-token');
  var forgetToken = $('forget-token');
  var confirmPublish = $('confirm-publish');

  var baseThoughts = [];
  var currentSection = 'important';
  var isPublishing = false;
  var isDirty = false;
  var saveTimer;

  thinkInput.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (thinkInput.value.toLowerCase() === THINK_PASSWORD) unlockThinking();
    else {
      thinkError.classList.add('show');
      thinkInput.classList.add('shake');
      thinkInput.value = '';
      setTimeout(function () { thinkInput.classList.remove('shake'); }, 400);
    }
  });
  thinkInput.addEventListener('input', function () { thinkError.classList.remove('show'); });

  async function unlockThinking() {
    thinkGate.classList.add('think-gate--unlocked');
    thoughtsContent.hidden = false;
    setTimeout(function () { thinkGate.hidden = true; }, 400);
    await loadThoughts();
    setInterval(autoSync, AUTO_SAVE_INTERVAL);
  }

  async function loadThoughts() {
    setStatus('loading', 'Loading…');
    try {
      var response = await fetch('thoughts.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      baseThoughts = normalizeThoughts(await response.json());
      var draft = readDraft();
      isDirty = Boolean(draft);
      renderThoughts(draft || baseThoughts);
      setStatus(draft ? 'draft' : 'synced', draft ? 'Local draft restored · waiting to sync' : 'Synced with GitHub');
    } catch (error) {
      var savedDraft = readDraft();
      isDirty = Boolean(savedDraft);
      renderThoughts(savedDraft || []);
      setStatus(savedDraft ? 'draft' : 'error', savedDraft ? 'Offline · local draft restored' : 'Unable to load · refresh to retry');
    }
  }

  function normalizeThoughts(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (thought) {
      return {
        id: String(thought.id || makeId()),
        type: thought.type === 'notes' ? 'notes' : 'important',
        date: String(thought.date || ''),
        title: String(thought.title || ''),
        bodyHtml: sanitizeBodyHtml(thought.bodyHtml || textToHtml(thought.body || ''))
      };
    });
  }

  function makeId() {
    return 't-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function textToHtml(text) {
    var holder = document.createElement('div');
    holder.textContent = String(text || '');
    return holder.innerHTML.replace(/\n/g, '<br>');
  }

  function sanitizeBodyHtml(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html || '');
    template.content.querySelectorAll('*').forEach(function (node) {
      if (node.tagName === 'IMG') {
        var src = node.getAttribute('src') || '';
        if (!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src)) node.remove();
        else Array.from(node.attributes).forEach(function (attr) { if (!['src', 'alt'].includes(attr.name)) node.removeAttribute(attr.name); });
      } else if (node.tagName === 'BR') {
        Array.from(node.attributes).forEach(function (attr) { node.removeAttribute(attr.name); });
      } else {
        node.replaceWith(document.createTextNode(node.textContent || ''));
      }
    });
    return template.innerHTML;
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY);
      return raw ? normalizeThoughts(JSON.parse(raw)) : null;
    } catch (error) { return null; }
  }

  function renderThoughts(thoughts) {
    thoughtsList.replaceChildren();
    thoughts.filter(function (thought) { return thought.type === currentSection; }).forEach(function (thought) { appendThought(thought); });
    updateEmptyState();
  }

  function appendThought(thought, focusTitle) {
    var card = thoughtTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.id = thought.id || makeId();
    card.dataset.type = thought.type || currentSection;
    var date = card.querySelector('.thought-date');
    var title = card.querySelector('.thought-title');
    var body = card.querySelector('.thought-excerpt');
    var isRecord = card.dataset.type === 'notes';
    card.classList.toggle('thought-card--record', isRecord);
    date.value = thought.date;
    title.textContent = isRecord ? '' : thought.title;
    body.innerHTML = sanitizeBodyHtml(isRecord && thought.title ? textToHtml(thought.title) + (thought.bodyHtml ? '<br>' + thought.bodyHtml : '') : thought.bodyHtml);
    card.addEventListener('input', scheduleDraftSave);
    card.addEventListener('change', scheduleDraftSave);
    title.addEventListener('paste', pastePlainText);
    setupImageInput(body);
    card.querySelector('.thought-delete').addEventListener('click', function () {
      if (!window.confirm('Delete this note?')) return;
      card.remove();
      saveDraftNow();
      updateEmptyState();
    });
    thoughtsList.appendChild(card);
    if (focusTitle) (isRecord ? body : title).focus();
  }

  function setupImageInput(editor) {
    editor.addEventListener('paste', function (event) {
      var files = Array.from((event.clipboardData && event.clipboardData.items) || []).filter(function (item) { return item.kind === 'file' && item.type.indexOf('image/') === 0; }).map(function (item) { return item.getAsFile(); });
      if (!files.length) { pastePlainText(event); return; }
      event.preventDefault();
      insertImages(editor, files);
    });
    editor.addEventListener('dragover', function (event) { event.preventDefault(); editor.classList.add('is-dragging'); });
    editor.addEventListener('dragleave', function () { editor.classList.remove('is-dragging'); });
    editor.addEventListener('drop', function (event) {
      event.preventDefault();
      editor.classList.remove('is-dragging');
      var files = Array.from(event.dataTransfer.files || []).filter(function (file) { return file.type.indexOf('image/') === 0; });
      if (files.length) insertImages(editor, files);
    });
  }

  async function insertImages(editor, files) {
    for (var index = 0; index < files.length; index++) {
      var file = files[index];
      if (file.size > MAX_INPUT_IMAGE_BYTES) {
        window.alert('“' + file.name + '” is over 12 MB. Please compress it first.');
        continue;
      }
      var dataUrl;
      try {
        dataUrl = await optimizeImage(file);
      } catch (error) {
        window.alert('Could not process “' + (file.name || 'untitled image') + '”. Please try another image.');
        continue;
      }
      if (dataUrl.length * 0.75 > MAX_STORED_IMAGE_BYTES) {
        window.alert('“' + (file.name || 'untitled image') + '” is still too large after compression.');
        continue;
      }
      var image = document.createElement('img');
      image.src = dataUrl;
      image.alt = file.name || 'Pasted image';
      editor.appendChild(image);
      editor.appendChild(document.createElement('br'));
    }
    scheduleDraftSave();
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function optimizeImage(file) {
    if (file.size < 700 * 1024 || file.type === 'image/gif') return readFileAsDataUrl(file);
    var bitmap = await createImageBitmap(file);
    var scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/webp', 0.82);
  }

  function pastePlainText(event) {
    event.preventDefault();
    var text = (event.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  function collectVisibleThoughts() {
    return Array.from(thoughtsList.querySelectorAll('.thought-card:not(.thought-card--placeholder)')).map(function (card) {
      return {
        id: card.dataset.id,
        type: card.dataset.type,
        date: card.querySelector('.thought-date').value,
        title: card.querySelector('.thought-title').innerText.trim(),
        bodyHtml: sanitizeBodyHtml(card.querySelector('.thought-excerpt').innerHTML)
      };
    }).filter(hasContent);
  }

  function collectThoughts() {
    var current = collectVisibleThoughts();
    var other = (readDraft() || baseThoughts).filter(function (thought) { return thought.type !== currentSection; });
    return current.concat(other).sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  function hasContent(thought) {
    var probe = document.createElement('div');
    probe.innerHTML = thought.bodyHtml;
    return Boolean(thought.title || probe.textContent.trim() || probe.querySelector('img'));
  }

  function scheduleDraftSave() {
    clearTimeout(saveTimer);
    isDirty = true;
    setStatus('saving', 'Saving locally…');
    saveTimer = setTimeout(saveDraftNow, 300);
  }

  function saveDraftNow() {
    clearTimeout(saveTimer);
    try {
      var thoughts = collectThoughts();
      isDirty = JSON.stringify(thoughts) !== JSON.stringify(baseThoughts);
      if (isDirty) localStorage.setItem(DRAFT_KEY, JSON.stringify(thoughts));
      else localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      setStatus(isDirty ? 'draft' : 'synced', isDirty ? 'Saved locally · syncing within 1 min' : 'Synced with GitHub');
    } catch (error) {
      var storageFull = error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
      setStatus('error', storageFull ? 'Local storage is full · remove or resize images' : 'Local save failed · refresh to retry');
      console.error('Thinking draft save failed:', error);
    }
  }

  function updateEmptyState() {
    var old = thoughtsList.querySelector('.thought-card--placeholder');
    if (old) old.remove();
    if (thoughtsList.querySelector('.thought-card')) return;
    var placeholder = document.createElement('div');
    placeholder.className = 'thought-card thought-card--placeholder';
    placeholder.textContent = currentSection === 'important' ? 'No chats yet.' : 'No records yet.';
    thoughtsList.appendChild(placeholder);
  }

  function setStatus(state, message) { statusDot.dataset.state = state; statusText.textContent = message; }

  document.querySelectorAll('.thinking-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      saveDraftNow();
      currentSection = tab.dataset.section;
      document.querySelectorAll('.thinking-tab').forEach(function (item) { item.classList.toggle('is-active', item === tab); });
      renderThoughts(readDraft() || baseThoughts);
    });
  });

  addButton.addEventListener('click', function () {
    var placeholder = thoughtsList.querySelector('.thought-card--placeholder');
    if (placeholder) placeholder.remove();
    appendThought({ id: makeId(), type: currentSection, date: new Date().toISOString().slice(0, 10), title: '', bodyHtml: '' }, true);
    saveDraftNow();
  });

  publishButton.addEventListener('click', function () {
    saveDraftNow();
    var token = getSavedToken();
    if (token) publishToGitHub(token, false);
    else openTokenDialog();
  });
  settingsButton.addEventListener('click', openTokenDialog);

  function getSavedToken() { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); }

  function openTokenDialog() {
    tokenError.textContent = '';
    tokenInput.value = getSavedToken() || '';
    rememberToken.checked = Boolean(localStorage.getItem(TOKEN_KEY)) || !getSavedToken();
    if (typeof tokenDialog.showModal === 'function') tokenDialog.showModal();
  }

  forgetToken.addEventListener('click', function () {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    tokenInput.value = '';
    tokenError.textContent = 'GitHub authorization cleared from this device.';
  });

  tokenForm.addEventListener('submit', function (event) {
    if (event.submitter && event.submitter.value === 'cancel') return;
    event.preventDefault();
    var token = tokenInput.value.trim();
    if (!token) { tokenError.textContent = 'Enter a GitHub Token.'; return; }
    if (rememberToken.checked) { localStorage.setItem(TOKEN_KEY, token); sessionStorage.removeItem(TOKEN_KEY); }
    else { sessionStorage.setItem(TOKEN_KEY, token); localStorage.removeItem(TOKEN_KEY); }
    publishToGitHub(token, true);
  });

  function autoSync() {
    if (!isDirty || isPublishing) return;
    saveDraftNow();
    var token = getSavedToken();
    if (token) publishToGitHub(token, false, true);
    else setStatus('draft', 'Saved locally · add GitHub authorization to auto-sync');
  }

  async function publishToGitHub(token, fromDialog, silent) {
    if (isPublishing) return;
    isPublishing = true;
    publishButton.disabled = true;
    confirmPublish.disabled = true;
    tokenError.textContent = '';
    setStatus('publishing', silent ? 'Changes detected · auto-syncing…' : 'Syncing with GitHub…');
    var endpoint = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + CONTENT_PATH;
    var headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' };
    try {
      var currentResponse = await fetch(endpoint + '?ref=' + encodeURIComponent(GITHUB_BRANCH), { headers: headers });
      if (!currentResponse.ok) throw await githubError(currentResponse);
      var currentFile = await currentResponse.json();
      var thoughts = collectThoughts();
      var json = JSON.stringify(thoughts, null, 2) + '\n';
      var updateResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({ message: 'autosave: update thinking notes ' + new Date().toISOString().slice(0, 10), content: encodeBase64Utf8(json), sha: currentFile.sha, branch: GITHUB_BRANCH })
      });
      if (!updateResponse.ok) throw await githubError(updateResponse);
      localStorage.removeItem(DRAFT_KEY);
      baseThoughts = thoughts;
      isDirty = false;
      if (tokenDialog.open) tokenDialog.close();
      setStatus('synced', 'Auto-saved and synced with GitHub');
    } catch (error) {
      var message = error && error.message ? error.message : 'Sync failed. Please try again later.';
      setStatus('error', 'Sync failed · local draft is safe');
      if (fromDialog && tokenDialog.open) tokenError.textContent = message;
      else if (!silent) window.alert(message + '\n\nYour local draft is still safe.');
    } finally {
      isPublishing = false;
      publishButton.disabled = false;
      confirmPublish.disabled = false;
    }
  }

  async function githubError(response) {
    var detail;
    try { detail = await response.json(); } catch (error) { detail = {}; }
    if (response.status === 401) return new Error('Invalid token. Update it in GitHub Settings.');
    if (response.status === 403) return new Error('The token needs Contents: Read and write permission.');
    if (response.status === 404) return new Error('Repository not found. Check access to JaiJaiC/C.Sole.');
    if (response.status === 409) return new Error('Remote content changed. Refresh and try again.');
    return new Error(detail.message || ('GitHub error ' + response.status));
  }

  function encodeBase64Utf8(value) {
    var bytes = new TextEncoder().encode(value); var binary = '';
    for (var index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 8192));
    return btoa(binary);
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden && isDirty) saveDraftNow(); });
  window.addEventListener('beforeunload', function () { if (isDirty) saveDraftNow(); });

  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.firstElementChild;
    trigger.addEventListener('click', function (event) {
      if (window.innerWidth > 500) return;
      if (dropdown.classList.contains('dropdown-open')) { dropdown.classList.remove('dropdown-open'); return; }
      event.preventDefault(); event.stopPropagation();
      dropdowns.forEach(function (item) { item.classList.remove('dropdown-open'); });
      dropdown.classList.add('dropdown-open');
    });
  });
  document.addEventListener('click', function (event) { if (!event.target.closest('.nav-dropdown')) dropdowns.forEach(function (item) { item.classList.remove('dropdown-open'); }); });
})();
