(function () {
  'use strict';

  var THINK_PASSWORD = 'c';
  var GITHUB_OWNER = 'JaiJaiC';
  var GITHUB_REPO = 'C.Sole';
  var GITHUB_BRANCH = 'main';
  var CONTENT_PATH = '5.thinking/thoughts.json';
  var DRAFT_KEY = 'csole-thinking-draft-v1';
  var TOKEN_KEY = 'csole-thinking-github-token';

  var thinkGate = document.getElementById('think-gate');
  var thinkInput = document.getElementById('think-password');
  var thinkError = document.getElementById('think-error');
  var thoughtsContent = document.getElementById('thoughts-content');
  var thoughtsList = document.getElementById('thoughts-list');
  var thoughtTemplate = document.getElementById('thought-template');
  var addButton = document.getElementById('add-thought');
  var publishButton = document.getElementById('publish-thoughts');
  var statusText = document.getElementById('editor-status');
  var statusDot = document.getElementById('editor-status-dot');
  var tokenDialog = document.getElementById('token-dialog');
  var tokenForm = document.getElementById('token-form');
  var tokenInput = document.getElementById('github-token');
  var tokenError = document.getElementById('token-error');
  var confirmPublish = document.getElementById('confirm-publish');

  var baseThoughts = [];
  var isPublishing = false;
  var saveTimer;

  thinkInput.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (thinkInput.value.toLowerCase() === THINK_PASSWORD) {
      unlockThinking();
    } else {
      thinkError.classList.add('show');
      thinkInput.classList.add('shake');
      thinkInput.value = '';
      setTimeout(function () { thinkInput.classList.remove('shake'); }, 400);
    }
  });

  thinkInput.addEventListener('input', function () {
    thinkError.classList.remove('show');
    thinkInput.classList.remove('shake');
  });

  async function unlockThinking() {
    thinkGate.classList.add('think-gate--unlocked');
    thoughtsContent.hidden = false;
    setTimeout(function () { thinkGate.hidden = true; }, 400);
    await loadThoughts();
  }

  async function loadThoughts() {
    setStatus('loading', '正在读取…');
    try {
      var response = await fetch('thoughts.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      baseThoughts = normalizeThoughts(await response.json());
      var draft = readDraft();
      renderThoughts(draft || baseThoughts);
      setStatus(draft ? 'draft' : 'synced', draft ? '已恢复本地草稿' : '已与 GitHub 同步');
    } catch (error) {
      var savedDraft = readDraft();
      if (savedDraft) {
        renderThoughts(savedDraft);
        setStatus('draft', '网络不可用，已恢复本地草稿');
      } else {
        renderThoughts([]);
        setStatus('error', '读取失败，请刷新重试');
      }
    }
  }

  function normalizeThoughts(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (thought) {
      return {
        date: String(thought.date || ''),
        title: String(thought.title || ''),
        body: String(thought.body || '')
      };
    });
  }

  function readDraft() {
    try {
      var value = localStorage.getItem(DRAFT_KEY);
      return value ? normalizeThoughts(JSON.parse(value)) : null;
    } catch (error) {
      return null;
    }
  }

  function renderThoughts(thoughts) {
    thoughtsList.replaceChildren();
    thoughts.forEach(function (thought) { appendThought(thought); });
    if (!thoughts.length) appendThought(createEmptyThought());
  }

  function appendThought(thought, focusTitle) {
    var card = thoughtTemplate.content.firstElementChild.cloneNode(true);
    var date = card.querySelector('.thought-date');
    var title = card.querySelector('.thought-title');
    var body = card.querySelector('.thought-excerpt');
    date.value = thought.date;
    title.textContent = thought.title;
    body.textContent = thought.body;

    card.addEventListener('input', scheduleDraftSave);
    card.addEventListener('change', scheduleDraftSave);
    card.querySelectorAll('[contenteditable="true"]').forEach(function (editable) {
      editable.addEventListener('paste', pastePlainText);
    });
    card.querySelector('.thought-delete').addEventListener('click', function () {
      if (!window.confirm('确定删除这条想法？')) return;
      card.remove();
      if (!thoughtsList.children.length) appendThought(createEmptyThought(), true);
      saveDraftNow();
    });

    thoughtsList.appendChild(card);
    if (focusTitle) title.focus();
  }

  function createEmptyThought() {
    return {
      date: new Date().toISOString().slice(0, 10),
      title: '',
      body: ''
    };
  }

  function pastePlainText(event) {
    event.preventDefault();
    var text = (event.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  function collectThoughts() {
    return Array.from(thoughtsList.querySelectorAll('.thought-card')).map(function (card) {
      return {
        date: card.querySelector('.thought-date').value,
        title: card.querySelector('.thought-title').innerText.trim(),
        body: card.querySelector('.thought-excerpt').innerText.trim()
      };
    }).filter(function (thought) {
      return thought.title || thought.body;
    });
  }

  function scheduleDraftSave() {
    clearTimeout(saveTimer);
    setStatus('saving', '正在保存草稿…');
    saveTimer = setTimeout(saveDraftNow, 250);
  }

  function saveDraftNow() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collectThoughts()));
      setStatus('draft', '草稿已实时保存');
    } catch (error) {
      setStatus('error', '浏览器无法保存草稿');
    }
  }

  function setStatus(state, message) {
    statusDot.dataset.state = state;
    statusText.textContent = message;
  }

  addButton.addEventListener('click', function () {
    appendThought(createEmptyThought(), true);
    saveDraftNow();
  });

  publishButton.addEventListener('click', function () {
    if (!validateThoughts()) return;
    var savedToken = sessionStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      publishToGitHub(savedToken);
      return;
    }
    openTokenDialog();
  });

  function validateThoughts() {
    var thoughts = collectThoughts();
    if (!thoughts.length) {
      window.alert('至少保留一条有内容的想法后再提交。');
      return false;
    }
    var invalid = thoughts.some(function (thought) {
      return !thought.date || !thought.title || !thought.body;
    });
    if (invalid) {
      window.alert('每条想法都需要日期、标题和正文。');
      return false;
    }
    return true;
  }

  function openTokenDialog() {
    tokenError.textContent = '';
    tokenInput.value = '';
    if (typeof tokenDialog.showModal === 'function') {
      tokenDialog.showModal();
      setTimeout(function () { tokenInput.focus(); }, 0);
    } else {
      var token = window.prompt('请输入 GitHub Fine-grained Token');
      if (token) publishToGitHub(token.trim());
    }
  }

  tokenForm.addEventListener('submit', function (event) {
    if (event.submitter && event.submitter.value === 'cancel') return;
    event.preventDefault();
    var token = tokenInput.value.trim();
    if (!token) return;
    publishToGitHub(token, true);
  });

  async function publishToGitHub(token, fromDialog) {
    if (isPublishing) return;
    isPublishing = true;
    publishButton.disabled = true;
    confirmPublish.disabled = true;
    tokenError.textContent = '';
    setStatus('publishing', '正在提交到 GitHub…');

    var endpoint = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/' + CONTENT_PATH;
    var headers = {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    };

    try {
      var currentResponse = await fetch(endpoint + '?ref=' + encodeURIComponent(GITHUB_BRANCH), { headers: headers });
      if (!currentResponse.ok) throw await githubError(currentResponse);
      var currentFile = await currentResponse.json();
      var remoteThoughts = normalizeThoughts(JSON.parse(decodeBase64Utf8(currentFile.content)));

      if (JSON.stringify(remoteThoughts) !== JSON.stringify(baseThoughts)) {
        var overwrite = window.confirm('GitHub 上的内容在你打开页面后发生了变化。是否仍用当前编辑内容覆盖？');
        if (!overwrite) {
          setStatus('draft', '提交已取消，本地草稿仍保留');
          return;
        }
      }

      var thoughts = collectThoughts();
      var json = JSON.stringify(thoughts, null, 2) + '\n';
      var updateResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({
          message: '✏️ Update thinking notes from website',
          content: encodeBase64Utf8(json),
          sha: currentFile.sha,
          branch: GITHUB_BRANCH
        })
      });
      if (!updateResponse.ok) throw await githubError(updateResponse);

      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(DRAFT_KEY);
      baseThoughts = thoughts;
      if (tokenDialog.open) tokenDialog.close();
      setStatus('synced', '提交成功，网站即将更新');
      window.alert('提交成功！GitHub Pages 通常会在 1–2 分钟内完成更新。');
    } catch (error) {
      var message = error && error.message ? error.message : '提交失败，请稍后重试。';
      setStatus('error', '提交失败，本地草稿已保留');
      if (fromDialog && tokenDialog.open) {
        tokenError.textContent = message;
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        window.alert(message + '\n\n本地草稿仍然安全保留。');
      }
    } finally {
      isPublishing = false;
      publishButton.disabled = false;
      confirmPublish.disabled = false;
    }
  }

  async function githubError(response) {
    var detail;
    try { detail = await response.json(); } catch (error) { detail = {}; }
    if (response.status === 401) return new Error('Token 无效，请检查后重试。');
    if (response.status === 403) return new Error('Token 没有 Contents 写入权限，或 GitHub 暂时限制了请求。');
    if (response.status === 404) return new Error('未找到仓库内容。请确认 Token 可访问 JaiJaiC/C.Sole。');
    if (response.status === 409) return new Error('GitHub 内容刚刚发生变化，请刷新页面后重试。');
    return new Error((detail && detail.message) || ('GitHub 返回错误 ' + response.status));
  }

  function encodeBase64Utf8(value) {
    var bytes = new TextEncoder().encode(value);
    var binary = '';
    for (var index = 0; index < bytes.length; index += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 8192));
    }
    return btoa(binary);
  }

  function decodeBase64Utf8(value) {
    var binary = atob(value.replace(/\s/g, ''));
    var bytes = Uint8Array.from(binary, function (character) { return character.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }

  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.firstElementChild;
    if (!trigger) return;
    trigger.addEventListener('click', function (event) {
      if (window.innerWidth > 500) return;
      if (dropdown.classList.contains('dropdown-open')) {
        dropdown.classList.remove('dropdown-open');
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dropdowns.forEach(function (item) { item.classList.remove('dropdown-open'); });
      dropdown.classList.add('dropdown-open');
    });
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.nav-dropdown')) {
      dropdowns.forEach(function (dropdown) { dropdown.classList.remove('dropdown-open'); });
    }
  });
})();
