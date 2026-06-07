// TabBookmark Picker

let items = [];       // { url, title } or null
let cursor = 0;
let mode = 'bookmark'; // 'bookmark' | 'tab'
const container = document.getElementById('list');
const modeTitle = document.getElementById('modeTitle');
const btnBookmark = document.getElementById('modeBookmark');
const btnTab = document.getElementById('modeTab');

// --- Mode toggle ---
btnBookmark.addEventListener('click', () => switchMode('bookmark'));
btnTab.addEventListener('click', () => switchMode('tab'));

function switchMode(newMode) {
  if (newMode === mode) return;
  mode = newMode;
  btnBookmark.classList.toggle('active', mode === 'bookmark');
  btnTab.classList.toggle('active', mode === 'tab');
  loadItems();
}

function loadItems() {
  if (mode === 'bookmark') {
    modeTitle.textContent = '📑 书签';
    chrome.runtime.sendMessage({ action: 'getBookmarks' }, (resp) => {
      items = (resp?.items || []).map(i => i ? { url: i.url, title: i.title || i.url } : null);
      render();
      select(0);
    });
  } else {
    modeTitle.textContent = '📂 标签页';
    chrome.runtime.sendMessage({ action: 'getTabs' }, (resp) => {
      items = (resp?.tabs || []).map(t => t ? { url: t.url, title: t.title || t.url, tabId: t.id, windowId: t.windowId } : null);
      render();
      select(0);
    });
  }
}

// --- Render ---
function render() {
  if (!items.length) {
    container.innerHTML = `<div class="row empty" style="cursor:default;opacity:0.5;justify-content:center;padding:20px">暂无内容</div>`;
    return;
  }
  const html = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    html.push(`
      <div class="row ${item ? '' : 'empty'}" data-idx="${i}">
        <span class="num">${i + 1}</span>
        <span class="tit">${item ? esc(item.title) : '（空）'}</span>
      </div>
    `);
  }
  container.innerHTML = html.join('');

  container.querySelectorAll('.row:not(.empty)').forEach(el => {
    el.addEventListener('click', () => openItem(parseInt(el.dataset.idx)));
  });
}

function select(idx) {
  document.querySelectorAll('.row').forEach((r, i) => r.classList.toggle('active', i === idx));
  cursor = idx;
  const active = document.querySelector('.row.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

// --- Open item ---
function openItem(idx) {
  const item = items[idx];
  if (!item) return;
  if (mode === 'bookmark') {
    chrome.runtime.sendMessage({ action: 'openBookmark', index: idx });
  } else {
    chrome.runtime.sendMessage({ action: 'switchToTab', tabId: item.tabId, windowId: item.windowId });
  }
  window.close();
}

// --- Count valid ---
function validCount() {
  return items.filter(i => i).length;
}
function nextValid(from, dir) {
  if (validCount() === 0) return from;
  const total = items.length;
  let i = from;
  do { i = (i + dir + total) % total; } while (!items[i] && i !== from);
  return i;
}

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= items.length) {
    e.preventDefault();
    select(n - 1);
    openItem(n - 1);
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const n = nextValid(cursor, -1); if (items[n]) select(n); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); const n = nextValid(cursor, 1); if (items[n]) select(n); return; }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(cursor); return; }
  if (e.key === 'Escape') { window.close(); }

  // Mode switching shortcuts
  if (e.key === 'b' || e.key === 'B') { switchMode('bookmark'); return; }
  if (e.key === 't' || e.key === 'T') { switchMode('tab'); return; }
});

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// --- Start ---
loadItems();
