// TabBookmark Switcher - Content Script
// Shows a floating bookmark bar overlay on the page

let overlay = null;
let bookmarks = [];
let cursor = 0;
let visible = false;
let setupDone = false; // false = show setup guide first

// --- Create overlay DOM ---
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'tb-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  document.body.appendChild(overlay);
}

// --- Show setup guide (first time) ---
function showSetupGuide() {
  overlay.innerHTML = `
    <div class="tb-bar tb-setup-mode">
      <div class="tb-setup-title">⚙️ 先设置快捷键</div>
      <div class="tb-setup-url">
        复制到地址栏：<span class="tb-url" onclick="navigator.clipboard.writeText(this.textContent)">edge://extensions/shortcuts</span>
      </div>
      <table class="tb-key-table">
        <tr><th>命令</th><th>按键</th><th>功能</th></tr>
        <tr><td>toggle-overlay</td><td><kbd>Ctrl+Shift+Space</kbd></td><td>显示/隐藏</td></tr>
        <tr><td>nav-left</td><td><kbd>Ctrl+Shift+,</kbd></td><td>左移</td></tr>
        <tr><td>nav-right</td><td><kbd>Ctrl+Shift+.</kbd></td><td>右移</td></tr>
        <tr><td>nav-open</td><td><kbd>Ctrl+Shift+O</kbd></td><td>打开</td></tr>
      </table>
      <button class="tb-done-btn" id="tb-done-btn">✅ 已设置好，开始使用</button>
    </div>
  `;
  overlay.style.display = 'block';
  visible = true;

  document.getElementById('tb-done-btn').onclick = () => {
    chrome.storage.local.set({ tb_setup_done: true });
    setupDone = true;
    // Immediately switch to normal mode
    showBookmarks();
  };
}

// --- Show bookmarks (normal mode) ---
async function showBookmarks() {
  await loadBookmarks();
  cursor = 0;
  overlay.innerHTML = `
    <div class="tb-bar">
      <div class="tb-bar-inner" id="tb-items"></div>
      <div class="tb-hint">
        <span>Esc关闭 · ← → 移动 · 回车打开 · 1~9跳转</span>
        <span class="tb-setup-link" id="tb-setup-link">⚙️ 设置</span>
      </div>
    </div>
  `;
  render();
  overlay.style.display = 'block';
  visible = true;
  addSetupHandler();
}

// --- Fetch bookmarks ---
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
  const container = document.getElementById('tb-items');
  if (!container) return;
  const items = bookmarks.slice(0, 9);
  container.innerHTML = items.map((item, i) => `
    <div class="tb-item ${i === cursor ? 'active' : ''} ${item ? '' : 'empty'}"
         data-index="${i}">
      <span class="tb-num">${i + 1}</span>
      <span class="tb-title">${item ? escHtml(item.title || item.url) : '—'}</span>
    </div>
  `).join('');
}

// --- Main show logic ---
async function show() {
  // Check if setup is done
  const data = await chrome.storage.local.get('tb_setup_done');
  setupDone = !!data.tb_setup_done;

  if (setupDone) {
    await showBookmarks();
  } else {
    showSetupGuide();
  }
}

function hide() {
  overlay.style.display = 'none';
  visible = false;
}

// --- Navigation ---
function moveLeft() {
  const max = bookmarks.filter(b => b).length;
  if (max === 0) return;
  do { cursor = (cursor - 1 + 9) % 9; } while (!bookmarks[cursor] && max > 0);
  render();
}

function moveRight() {
  const max = bookmarks.filter(b => b).length;
  if (max === 0) return;
  do { cursor = (cursor + 1) % 9; } while (!bookmarks[cursor] && max > 0);
  render();
}

function openCurrent() {
  const item = bookmarks[cursor];
  if (item?.url) { chrome.runtime.sendMessage({ action: 'openBookmark', index: cursor }); hide(); }
}

function openByNumber(num) {
  const idx = num - 1;
  const item = bookmarks[idx];
  if (item?.url) { chrome.runtime.sendMessage({ action: 'openBookmark', index: idx }); hide(); }
}

// --- Setup link in normal mode ---
function addSetupHandler() {
  const el = document.getElementById('tb-setup-link');
  if (el) el.onclick = () => chrome.runtime.sendMessage({ action: 'openSetup' });
}

// --- Inject styles ---
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #tb-overlay { all: initial; }
    #tb-overlay .tb-bar {
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid #2a2a4a;
      padding: 8px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    #tb-overlay .tb-bar-inner { display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; }
    #tb-overlay .tb-item {
      display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 6px;
      font-size: 12px; color: #aaa; background: rgba(255,255,255,0.04); cursor: pointer;
      transition: all 0.12s; flex-shrink: 0; max-width: 180px; border: 2px solid transparent;
    }
    #tb-overlay .tb-item.active { background: rgba(33,150,243,0.15); border-color: #2196f3; color: #fff; }
    #tb-overlay .tb-item.empty { opacity: 0.3; cursor: default; }
    #tb-overlay .tb-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 4px; background: rgba(255,255,255,0.08);
      font-size: 10px; font-weight: 600; color: #64b5f6; flex-shrink: 0;
    }
    #tb-overlay .tb-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #tb-overlay .tb-hint {
      font-size: 10px; color: #555; margin-top: 6px; text-align: center; display: flex;
      justify-content: center; gap: 16px;
    }
    #tb-overlay .tb-setup-link { color: #64b5f6; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
    #tb-overlay .tb-setup-link:hover { color: #90caf9; }

    /* Setup guide styles */
    #tb-overlay .tb-setup-mode { padding: 16px 20px; text-align: center; }
    #tb-overlay .tb-setup-title { font-size: 15px; color: #fff; font-weight: 600; margin-bottom: 10px; }
    #tb-overlay .tb-setup-url { font-size: 11px; color: #888; margin-bottom: 10px; }
    #tb-overlay .tb-url {
      color: #4fc3f7; cursor: pointer; user-select: all; font-size: 13px;
      background: #0f3460; padding: 3px 10px; border-radius: 4px;
    }
    #tb-overlay .tb-url:hover { background: #1a4a7a; }
    #tb-overlay .tb-key-table {
      margin: 0 auto 12px; border-collapse: collapse; font-size: 11px;
    }
    #tb-overlay .tb-key-table th {
      color: #888; font-weight: 400; padding: 4px 10px; border-bottom: 1px solid #2a2a4a;
    }
    #tb-overlay .tb-key-table td {
      color: #ccc; padding: 4px 10px; border-bottom: 1px solid #222;
    }
    #tb-overlay .tb-key-table kbd {
      background: #0f3460; padding: 1px 6px; border-radius: 3px; font-size: 10px;
      color: #64b5f6; font-family: inherit; border: 1px solid #1a4a7a;
    }
    #tb-overlay .tb-done-btn {
      background: #4caf50; color: #fff; border: none; padding: 10px 24px;
      border-radius: 8px; font-size: 13px; cursor: pointer; margin-top: 4px;
    }
    #tb-overlay .tb-done-btn:hover { background: #388e3c; }
  `;
  document.head.appendChild(style);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Keyboard handling ---
document.addEventListener('keydown', (e) => {
  if (!visible || !overlay) return;
  // In setup mode: only Esc works
  if (!setupDone) {
    if (e.key === 'Escape') { hide(); e.preventDefault(); }
    return;
  }

  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 9) { e.preventDefault(); openByNumber(num); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveLeft(); return; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveRight(); return; }
  if (e.key === 'Enter') { e.preventDefault(); openCurrent(); return; }
  if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
});

// --- Init ---
createOverlay();
injectStyles();

// --- Listen for messages ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleOverlay') {
    if (visible) hide();
    else show();
  }
  if (msg.action === 'navLeft' && visible && setupDone) moveLeft();
  if (msg.action === 'navRight' && visible && setupDone) moveRight();
  if (msg.action === 'navOpen' && visible && setupDone) openCurrent();
});
