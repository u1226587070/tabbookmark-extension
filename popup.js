// Popup script

const btnShow = document.getElementById('btnShow');
const urlEl = document.getElementById('shortcutUrl');

// Button: show overlay on current page
btnShow.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'showOverlay' });
  window.close();
});

// URL click: try to open directly, fallback to copy
urlEl.addEventListener('click', () => {
  // Try to open the shortcuts page from popup (extension page)
  chrome.tabs.create({ url: 'edge://extensions/shortcuts' }).catch(() => {
    // Fallback: try chrome://
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }).catch(() => {
      // Last resort: copy to clipboard
      navigator.clipboard.writeText('edge://extensions/shortcuts').then(() => {
        urlEl.textContent = '✅ 地址已复制';
        setTimeout(() => { urlEl.textContent = 'edge://extensions/shortcuts'; }, 2000);
      });
    });
  });
  window.close();
});
