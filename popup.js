// Popup script for TabBookmark Switcher

const modeToggle = document.getElementById('modeToggle');
const modeBadge = document.getElementById('modeBadge');
const modeLabel = document.getElementById('modeLabel');
const modeTarget = document.getElementById('modeTarget');
const bookmarkContainer = document.getElementById('bookmarkItems');

// Update UI based on current mode
function updateUI(mode) {
  const isBookmark = mode === 'bookmark';
  modeToggle.checked = isBookmark;
  modeBadge.textContent = isBookmark ? 'B 书签' : 'T 标签页';
  modeBadge.className = `badge ${mode}`;
  modeLabel.textContent = isBookmark ? '书签模式' : 'Tab 模式';
  modeTarget.textContent = isBookmark ? '→ 打开书签栏' : '→ 切换标签页';
}

// Render bookmark list
function renderBookmarks(items) {
  const html = [];
  for (let i = 0; i < 9; i++) {
    const item = items[i];
    html.push(`
      <div class="bookmark-item">
        <span class="index">${i + 1}</span>
        ${item ? `<span class="name" title="${item.url}">${item.title || item.url}</span>` : `<span class="empty">（空）</span>`}
      </div>
    `);
  }
  bookmarkContainer.innerHTML = html.join('');
}

// Initialize popup
async function init() {
  try {
    const modeResp = await chrome.runtime.sendMessage({ action: 'getMode' });
    updateUI(modeResp.mode);
  } catch (e) {
    // Fallback if background not ready
  }

  try {
    const bmResp = await chrome.runtime.sendMessage({ action: 'getBookmarks' });
    renderBookmarks(bmResp.items || []);
  } catch (e) {
    bookmarkContainer.innerHTML = '<div class="bookmark-item"><span class="empty">无法加载书签</span></div>';
  }
}

// Handle toggle click
modeToggle.addEventListener('change', async () => {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'toggleMode' });
    updateUI(resp.mode);
  } catch (e) {
    // Revert toggle on error
    modeToggle.checked = !modeToggle.checked;
  }
});

init();
