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
      chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {});
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

// --- All message handling in one listener ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Open bookmark
  if (msg.action === 'openBookmark') {
    getBookmarkBarItems().then(items => {
      const item = items[msg.index];
      if (item?.url) chrome.tabs.create({ url: item.url });
    });
    return false;
  }

  // Get bookmarks
  if (msg.action === 'getBookmarks') {
    getBookmarkBarItems().then(items => sendResponse({ items }));
    return true;
  }

  // Show overlay on active tab (from popup button)
  if (msg.action === 'showOverlay') {
    sendToActiveTab('toggleOverlay');
    sendResponse({ ok: true });
    return false;
  }

  // Open shortcuts setup page (from setup.html button)
  if (msg.action === 'openShortcuts') {
    chrome.tabs.create({ url: 'edge://extensions/shortcuts' }).then(() => {
      sendResponse({ ok: true });
    }).catch(() => {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }).then(() => {
        sendResponse({ ok: true });
      }).catch(() => {
        sendResponse({ ok: false });
      });
    });
    return true;
  }
});

// --- Open setup page on install ---
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
  }
});
