// TabBookmark Switcher - Content Script

let overlay = null;
let bookmarks = [];
let cursor = 0;
let visible = false;

// --- Create overlay ---
function init() {
  overlay = document.createElement('div');
  overlay.id = 'tb-overlay';
  overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;z-index:2147483647;font-family:sans-serif';
  overlay.innerHTML = `<div class="tb-bar" style="all:initial;display:block;background:#1a1a2e;border-bottom:1px solid #2a2a4a;padding:10px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.5);font-family:sans-serif;color:#e0e0e0;font-size:13px;text-align:center">📑 加载书签中...</div>`;
  document.body.appendChild(overlay);
}

// --- Show ---
function show() {
  overlay.style.display = 'block';
  visible = true;
  // Load bookmarks in background (if fails, placeholder stays visible)
  chrome.runtime.sendMessage({ action: 'getBookmarks' }, (resp) => {
    bookmarks = resp?.items || [];
    cursor = 0;
    renderFull();
  });
}

function hide() {
  overlay.style.display = 'none';
  visible = false;
}

// --- Render full bar ---
function renderFull() {
  const items = bookmarks.slice(0, 9);
  overlay.innerHTML = `
    <div class="tb-bar" style="all:initial;display:block;background:linear-gradient(180deg,#1a1a2e,#16213e);border-bottom:1px solid #2a2a4a;padding:8px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.5);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <div style="display:flex;gap:6px">
        ${items.map((item, i) => {
          const active = i === cursor ? 'style="background:rgba(33,150,243,0.15);border-color:#2196f3;color:#fff"' : '';
          const empty = item ? '' : 'opacity:0.3';
          return `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:6px;font-size:12px;color:#aaa;background:rgba(255,255,255,0.04);cursor:pointer;flex-shrink:0;max-width:180px;border:2px solid transparent;${empty}" ${active}>
            <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;background:rgba(255,255,255,0.08);font-size:10px;font-weight:600;color:#64b5f6;flex-shrink:0">${i+1}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item ? esc(item.title || item.url) : '—'}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:10px;color:#555;margin-top:6px;text-align:center">← → 移动 · Enter 打开 · 1~9跳转 · Esc关闭</div>
    </div>
  `;
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// --- Navigation ---
function moveLeft() {
  const max = bookmarks.filter(b => b).length;
  if (!max) return;
  do { cursor = (cursor - 1 + 9) % 9; } while (!bookmarks[cursor] && max);
  renderFull();
}
function moveRight() {
  const max = bookmarks.filter(b => b).length;
  if (!max) return;
  do { cursor = (cursor + 1) % 9; } while (!bookmarks[cursor] && max);
  renderFull();
}
function openCurrent() {
  const item = bookmarks[cursor];
  if (item?.url) { chrome.runtime.sendMessage({ action: 'openBookmark', index: cursor }); hide(); }
}
function openByNumber(n) {
  const item = bookmarks[n - 1];
  if (item?.url) { chrome.runtime.sendMessage({ action: 'openBookmark', index: n - 1 }); hide(); }
}

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (!visible) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) { e.preventDefault(); openByNumber(n); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveLeft(); return; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveRight(); return; }
  if (e.key === 'Enter') { e.preventDefault(); openCurrent(); return; }
  if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
});

// --- Messages ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleOverlay') {
    visible ? hide() : show();
  }
  if (msg.action === 'navLeft' && visible) moveLeft();
  if (msg.action === 'navRight' && visible) moveRight();
  if (msg.action === 'navOpen' && visible) openCurrent();
});

// --- Start ---
init();
