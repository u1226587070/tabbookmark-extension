// Popup script

const btnShow = document.getElementById('btnShow');
const urlEl = document.getElementById('shortcutUrl');

// Button: show overlay on current page
btnShow.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'showOverlay' });
  window.close();
});

// URL click: open the full setup guide page
urlEl.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
  window.close();
});
