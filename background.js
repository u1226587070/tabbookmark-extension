// TabBookmark Switcher - Background Service Worker

// --- Bookmarks ---
async function getBookmarkBarItems() {
  const tree = await chrome.bookmarks.getTree();
  const root = tree[0];
  const bookmarkBar = root.children?.find(c =>
    c.id === '1' || c.title === 'Bookmarks Bar' || c.title === '书签栏'
  );
  if (!bookmarkBar?.children) return [];
  return bookmarkBar.children.filter(item => item.url).slice(0, 9);
}

// --- Forward message to active tab's content script ---
function sendToActiveTab(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {
        // Content script not loaded on this page (e.g. edge:// pages)
      });
    }
  });
}

// --- Commands (4 total, within Edge's limit) ---
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'toggle-overlay': sendToActiveTab('toggleOverlay'); break;
    case 'nav-left':       sendToActiveTab('navLeft'); break;
    case 'nav-right':      sendToActiveTab('navRight'); break;
    case 'nav-open':       sendToActiveTab('navOpen'); break;
  }
});

// --- Messages from content script ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openBookmark') {
    getBookmarkBarItems().then(items => {
      const item = items[msg.index];
      if (item?.url) {
        chrome.tabs.create({ url: item.url });
      }
    });
    return false;
  }

  if (msg.action === 'getBookmarks') {
    getBookmarkBarItems().then(items => sendResponse({ items }));
    return true;
  }
});

// --- Open setup page on install ---
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
  }
});
