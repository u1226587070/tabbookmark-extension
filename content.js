// TabBookmark Switcher - Content Script
// Shows a floating bookmark bar overlay on the page

let overlay = null;
let bookmarks = [];
let cursor = 0;
let visible = false;

// --- Create overlay DOM ---
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'tb-overlay';
  overlay.innerHTML = `
    <div class="tb-bar">
      <div class="tb-bar-inner" id="tb-items"></div>
      <div class="tb-hint">
        <span>Esc关闭 · ← → 移动 · 回车打开 · 按数字跳转</span>
        <span class="tb-setup" id="tb-setup-link">⚙️ 设置快捷键</span>
      </div>
    </div>
  `;
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  document.body.appendChild(overlay);
}

// --- Fetch bookmarks from background ---
async function loadBookmarks() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getBookmarks' }, resp => {
      bookmarks = resp?.items || [];
      resolve();
    });
  });
}

// --- Render items ---
function render() {
  const container = document.getElementById('tb-items') || overlay;
  const items = bookmarks.slice(0, 9);
  container.innerHTML = items.map((item, i) => `
    <div class="tb-item ${i === cursor ? 'active' : ''} ${item ? '' : 'empty'}"
         data-index="${i}">
      <span class="tb-num">${i + 1}</span>
      <span class="tb-title">${item ? esc(item.title || item.url) : '—'}</span>
    </div>
  `).join('');
}

// --- Show/hide ---
async function show() {
  await loadBookmarks();
  cursor = 0;
  render();
  overlay.style.display = 'block';
  overlay.querySelector('.tb-item:not(.empty)')?.scrollIntoView({ block: 'nearest' });
  visible = true;
}

function hide() {
  overlay.style.display = 'none';
  visible = false;
}

// --- Navigation ---
function moveLeft() {
  const max = bookmarks.filter(b => b).length;
  if (max === 0) return;
  do {
    cursor = (cursor - 1 + 9) % 9;
  } while (!bookmarks[cursor] && max > 0);
  render();
}

function moveRight() {
  const max = bookmarks.filter(b => b).length;
  if (max === 0) return;
  do {
    cursor = (cursor + 1) % 9;
  } while (!bookmarks[cursor] && max > 0);
  render();
}

function openCurrent() {
  const item = bookmarks[cursor];
  if (item?.url) {
    chrome.runtime.sendMessage({ action: 'openBookmark', index: cursor });
    hide();
  }
}

function openByNumber(num) {
  const idx = num - 1;
  const item = bookmarks[idx];
  if (item?.url) {
    chrome.runtime.sendMessage({ action: 'openBookmark', index: idx });
    hide();
  }
}

// --- Inject styles ---
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #tb-overlay {
      all: initial;
    }
    #tb-overlay .tb-bar {
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid #2a2a4a;
      padding: 8px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    #tb-overlay .tb-bar-inner {
      display: flex;
      gap: 6px;
      flex-wrap: nowrap;
      overflow-x: auto;
    }
    #tb-overlay .tb-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #aaa;
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      transition: all 0.12s;
      flex-shrink: 0;
      max-width: 180px;
      border: 2px solid transparent;
    }
    #tb-overlay .tb-item.active {
      background: rgba(33,150,243,0.15);
      border-color: #2196f3;
      color: #fff;
    }
    #tb-overlay .tb-item.empty {
      opacity: 0.3;
      cursor: default;
    }
    #tb-overlay .tb-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px; height: 18px;
      border-radius: 4px;
      background: rgba(255,255,255,0.08);
      font-size: 10px;
      font-weight: 600;
      color: #64b5f6;
      flex-shrink: 0;
    }
    #tb-overlay .tb-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #tb-overlay .tb-hint {
      font-size: 10px;
      color: #555;
      margin-top: 6px;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 16px;
    }
    #tb-overlay .tb-setup {
      color: #64b5f6;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    #tb-overlay .tb-setup:hover {
      color: #90caf9;
    }
  `;
  document.head.appendChild(style);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Direct keyboard handling (number keys, arrows, enter, esc) ---
document.addEventListener('keydown', (e) => {
  if (!visible || !overlay) return;

  // Number keys 1-9
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 9) {
    e.preventDefault();
    openByNumber(num);
    return;
  }

  // Arrow keys
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    moveLeft();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    moveRight();
    return;
  }

  // Enter
  if (e.key === 'Enter') {
    e.preventDefault();
    openCurrent();
    return;
  }

  // Esc
  if (e.key === 'Escape') {
    e.preventDefault();
    hide();
    return;
  }
});

// --- Setup link click ---
function addSetupHandler() {
  const el = document.getElementById('tb-setup-link');
  if (el) {
    el.onclick = () => {
      chrome.runtime.sendMessage({ action: 'openSetup' });
    };
  }
}

// --- Init ---
createOverlay();
injectStyles();

// --- Listen for messages from background ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleOverlay') {
    if (visible) hide();
    else {
      show();
      // Defer setup link handler until after DOM rendered
      setTimeout(addSetupHandler, 0);
    }
  }
  if (msg.action === 'navLeft') {
    if (visible) moveLeft();
  }
  if (msg.action === 'navRight') {
    if (visible) moveRight();
  }
  if (msg.action === 'navOpen') {
    if (visible) openCurrent();
  }
});
