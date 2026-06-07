// Popup script

const btnShow = document.getElementById('btnShow');
const urlEl = document.getElementById('shortcutUrl');

// Button: show overlay on current page
btnShow.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'showOverlay' });
  window.close();
});

// URL click: copy to clipboard
urlEl.addEventListener('click', () => {
  navigator.clipboard.writeText(urlEl.textContent).then(() => {
    const orig = urlEl.textContent;
    urlEl.textContent = '✅ 已复制';
    setTimeout(() => { urlEl.textContent = orig; }, 1500);
  });
});
