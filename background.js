// TabBookmark Switcher - Background Service Worker

async function getBookmarkBarItems() {
  const tree = await chrome.bookmarks.getTree();
  const root = tree[0];
  const bookmarkBar = root.children?.find(c =>
    c.id === '1' || c.title === 'Bookmarks Bar' || c.title === '书签栏'
  );
  if (!bookmarkBar?.children) return [];
  return bookmarkBar.children.filter(item => item.url).slice(0, 9);
}

// --- Open picker window ---
async function openPicker() {
  const win = await chrome.windows.getCurrent();
  const w = 340, h = 430;
  const left = Math.round((win.width - w) / 2 + (win.left || 0));
  const top = Math.round((win.height - h) / 2 + (win.top || 0));
  chrome.windows.create({
    url: chrome.runtime.getURL('picker.html'),
    type: 'popup',
    width: w, height: h,
    left, top,
    focused: true
  });
}

// --- Commands ---
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-overlay') openPicker();
});

// --- Messages ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openBookmark') {
    getBookmarkBarItems().then(items => {
      const item = items[msg.index];
      if (item?.url) chrome.tabs.create({ url: item.url });
    });
    return false;
  }
  if (msg.action === 'getBookmarks') {
    getBookmarkBarItems().then(items => sendResponse({ items }));
    return true;
  }
  if (msg.action === 'showOverlay') {
    openPicker();
    sendResponse({ ok: true });
    return false;
  }
  if (msg.action === 'openSetup') {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
    sendResponse({ ok: true });
    return false;
  }
});

// --- Install ---
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install')
    chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
});
