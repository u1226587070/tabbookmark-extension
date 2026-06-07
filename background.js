// TabBookmark Switcher - Background Service Worker
// Modes: "tab" | "bookmark"

const MODE_KEY = 'activeMode';

// Initialize default mode
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(MODE_KEY);
  if (!data[MODE_KEY]) {
    await chrome.storage.local.set({ [MODE_KEY]: 'tab' });
  }
  updateBadge(data[MODE_KEY] || 'tab');
});

// Get the current mode
async function getMode() {
  const data = await chrome.storage.local.get(MODE_KEY);
  return data[MODE_KEY] || 'tab';
}

// Toggle mode
async function toggleMode() {
  const current = await getMode();
  const next = current === 'tab' ? 'bookmark' : 'tab';
  await chrome.storage.local.set({ [MODE_KEY]: next });
  updateBadge(next);
  return next;
}

// Update toolbar icon badge to show current mode
function updateBadge(mode) {
  const text = mode === 'bookmark' ? 'B' : 'T';
  const color = mode === 'bookmark' ? [76, 175, 80, 255] : [33, 150, 243, 255]; // green / blue
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Get the bookmark bar folder and its first 9 items
async function getBookmarkBarItems() {
  const tree = await chrome.bookmarks.getTree();
  // Find the "Bookmarks Bar" folder
  const root = tree[0];
  const bookmarkBar = root.children?.find(c => c.id === '1' || c.parentId === '0' || c.title === 'Bookmarks Bar' || c.title === '书签栏');
  if (!bookmarkBar || !bookmarkBar.children) return [];

  // Flatten: include bookmarks directly under bar AND in folders (just direct children for simplicity)
  return bookmarkBar.children
    .filter(item => item.url) // only actual bookmarks, skip folders
    .slice(0, 9);
}

// Switch to tab by index (1-based)
async function switchToTab(index) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  // Sort tabs by their index in the window
  tabs.sort((a, b) => a.index - b.index);
  const targetTab = tabs[index - 1];
  if (targetTab) {
    await chrome.tabs.update(targetTab.id, { active: true });
    // Also focus the window
    await chrome.windows.update(targetTab.windowId, { focused: true });
  }
}

// Handle commands (Ctrl+1~9, toggle)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-mode') {
    const newMode = await toggleMode();
    return;
  }

  // Parse "open-bookmark-N" commands
  const match = command.match(/^open-bookmark-(\d)$/);
  if (!match) return;

  const index = parseInt(match[1], 10);
  const mode = await getMode();

  if (mode === 'tab') {
    // Tab mode: switch to tab
    await switchToTab(index);
  } else {
    // Bookmark mode: open bookmark bar item
    const items = await getBookmarkBarItems();
    const item = items[index - 1];
    if (item && item.url) {
      await chrome.tabs.create({ url: item.url });
    } else {
      // No bookmark at this position, fallback to tab switching
      await switchToTab(index);
    }
  }
});

// Listen for popup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMode') {
    getMode().then(mode => sendResponse({ mode }));
    return true; // Keep channel open for async response
  }
  if (message.action === 'toggleMode') {
    toggleMode().then(mode => sendResponse({ mode }));
    return true;
  }
  if (message.action === 'getBookmarks') {
    getBookmarkBarItems().then(items => sendResponse({ items }));
    return true;
  }
});
