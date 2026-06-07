// Popup script

const container = document.getElementById('bookmarkItems');

async function init() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'getBookmarks' });
    const items = resp.items || [];
    const html = [];
    for (let i = 0; i < 9; i++) {
      const item = items[i];
      html.push(`
        <div class="bookmark-item">
          <span class="index">${i + 1}</span>
          ${item
            ? `<span class="name" title="${item.url}">${item.title || item.url}</span>`
            : `<span class="empty">（空）</span>`}
        </div>
      `);
    }
    container.innerHTML = html.join('');
  } catch (_) {
    container.innerHTML = '<div class="bookmark-item"><span class="empty">无法加载书签</span></div>';
  }
}

init();
