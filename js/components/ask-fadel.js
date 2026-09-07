(function () {
  const API_URL = 'https://ai.xeroon.my.id/api/chat';
  const SESSION_KEY = 'fadel-ai-session-id';
  const REQUEST_TIMEOUT_MS = 45000;

  const SUGGESTIONS = [
    'What projects has Fadel worked on?',
    "What are Fadel's skills?",
    'How can I contact Fadel?',
  ];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderInlineMarkdown(value) {
    let html = escapeHtml(value);
    const codeTokens = [];
    const linkTokens = [];

    html = html.replace(/`([^`\n]+)`/g, (_, code) => {
      codeTokens.push(`<code>${code}</code>`);
      return `\u0000${codeTokens.length - 1}\u0000`;
    });
    html = html.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
      linkTokens.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return `\u0001${linkTokens.length - 1}\u0001`;
    });
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    html = html.replace(/\u0001(\d+)\u0001/g, (_, index) => linkTokens[Number(index)]);
    html = html.replace(/\u0000(\d+)\u0000/g, (_, index) => codeTokens[Number(index)]);
    return html;
  }

  function renderMarkdown(value) {
    const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let paragraph = [];
    let list = null;
    let code = null;

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (!list) return;
      blocks.push(`<${list.type}>${list.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
      list = null;
    };

    lines.forEach((line) => {
      if (/^\s*```/.test(line)) {
        flushParagraph();
        flushList();
        if (code === null) code = [];
        else {
          blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
          code = null;
        }
        return;
      }
      if (code !== null) {
        code.push(line);
        return;
      }
      if (!line.trim()) {
        flushParagraph();
        flushList();
        return;
      }
      const heading = line.match(/^\s*(#{1,3})\s+(.+?)\s*#*\s*$/);
      const item = line.match(/^\s*([-*+] |\d+\. )(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      } else if (item) {
        flushParagraph();
        const type = /^\d+\./.test(item[1]) ? 'ol' : 'ul';
        if (!list || list.type !== type) {
          flushList();
          list = { type, items: [] };
        }
        list.items.push(item[2]);
      } else {
        flushList();
        paragraph.push(line);
      }
    });

    if (code !== null) blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    flushParagraph();
    flushList();
    return blocks.join('') || '<p></p>';
  }

  function isNearBottom(container, threshold = 32) {
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }

  function scrollToLatest(container) {
    container.scrollTop = container.scrollHeight;
  }

  function slugify(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function getSessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (error) {
      return null;
    }
  }

  async function loadProjectIndex() {
    try {
      const response = await fetch('data/projects.json');
      if (!response.ok) return new Map();
      const projects = await response.json();
      const index = new Map();
      projects.forEach((project) => {
        const titleSlug = slugify(project.title);
        const repo = String(project.githubUrl || '').toLowerCase().split('/').filter(Boolean).pop() || '';
        [titleSlug, repo].forEach((key) => {
          if (key && !index.has(key)) index.set(key, project);
        });
      });
      return index;
    } catch (error) {
      return new Map();
    }
  }

  function findProject(index, slug) {
    const needle = String(slug || '').toLowerCase();
    if (!needle) return null;
    if (index.has(needle)) return index.get(needle);
    for (const [key, project] of index) {
      if (key.includes(needle) || needle.includes(key)) return project;
    }
    return null;
  }

  function renderReferences(references, projectIndex) {
    const refs = (references || []).filter((ref) => ref && ref.type === 'project' && ref.slug);
    if (!refs.length) return '';

    const chips = refs.map((ref) => {
      const project = findProject(projectIndex, ref.slug);
      const title = escapeHtml(ref.title || (project && project.title) || ref.slug);
      const github = project && project.githubUrl
        ? ` <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" title="Open ${title} on GitHub" aria-label="Open ${title} on GitHub">🔗</a>`
        : '';
      return `<span class="ask-ref-chip">📁<button type="button" data-ask-open-projects title="View in Projects window">${title}</button>${github}</span>`;
    }).join('');

    return `<div class="ask-refs" aria-label="Related projects">${chips}</div>`;
  }

  function appendMessage(container, role, html) {
    const wrapper = document.createElement('div');
    wrapper.className = role === 'user' ? 'ask-msg ask-msg-user' : 'ask-msg ask-msg-ai';
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
    return wrapper;
  }

  function setBusy(form, input, button, busy) {
    input.disabled = busy;
    button.disabled = busy;
    button.textContent = busy ? '…' : 'Send ➤';
  }

  async function sendMessage(state, text) {
    const message = String(text || '').trim();
    if (!message || state.busy) return;
    state.busy = true;

    scrollToLatest(state.messages);
    appendMessage(state.messages, 'user', `<span>${escapeHtml(message)}</span>`);
    state.suggestions.hidden = true;
    const typing = appendMessage(state.messages, 'ai', '<span class="ask-typing" aria-label="Fadel AI is typing"><span></span><span></span><span></span></span>');
    setBusy(state.form, state.input, state.button, true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: getSessionId() }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 429) {
        typing.innerHTML = '<span>Rate limit exceeded. Please wait a moment and try again. ⏳</span>';
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const keepLatestVisible = isNearBottom(state.messages);
      const answer = data.answer || 'I received an empty response. Please try again.';
      const refs = renderReferences(data.references, state.projectIndex);
      typing.innerHTML = `<div class="readable-text ask-markdown">${renderMarkdown(answer)}</div>${refs}`;
      if (keepLatestVisible) scrollToLatest(state.messages);
      state.status.textContent = 'STATUS: ONLINE';
    } catch (error) {
      clearTimeout(timer);
      state.status.textContent = 'STATUS: OFFLINE';
      typing.innerHTML = '<span>Fadel AI is unreachable right now. Check your connection and try again. 📡</span>';
    } finally {
      state.busy = false;
      setBusy(state.form, state.input, state.button, false);
      if (isNearBottom(state.messages)) scrollToLatest(state.messages);
      state.input.focus({ preventScroll: true });
    }
  }

  function initAskFadel() {
    const win = document.getElementById('win-ask');
    const messages = document.getElementById('ask-messages');
    const form = document.getElementById('ask-form');
    const input = document.getElementById('ask-input');
    const button = document.getElementById('ask-send');
    const suggestions = document.getElementById('ask-suggestions');
    const status = document.getElementById('ask-status');
    if (!win || !messages || !form || !input || !button || !suggestions || !status) return;

    const state = { busy: false, messages, form, input, button, suggestions, status, projectIndex: new Map() };
    loadProjectIndex().then((index) => { state.projectIndex = index; });

    appendMessage(messages, 'ai', '<span class="readable-text">Hi! I\'m <strong>Fadel AI</strong> 🤖 Ask me anything about Fadel — projects, skills, or contact info.</span>');

    SUGGESTIONS.forEach((text) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ask-suggestion-chip';
      chip.textContent = text;
      chip.addEventListener('click', () => sendMessage(state, text));
      suggestions.appendChild(chip);
    });

    messages.addEventListener('click', (event) => {
      if (event.target.closest('[data-ask-open-projects]')) {
        openWindow('win-projects');
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(state, input.value);
      input.value = '';
    });

    input.addEventListener('focus', () => {
      window.setTimeout(() => input.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
    });
  }

  document.addEventListener('DOMContentLoaded', initAskFadel);
})();
