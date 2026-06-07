// Setup page script
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnShortcuts');
  if (btn) {
    btn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'edge://extensions/shortcuts' }).catch(() => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
      });
    });
  }
});
