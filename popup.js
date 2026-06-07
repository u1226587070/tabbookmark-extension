// Popup script

const btnShow = document.getElementById('btnShow');
const btnGuide = document.getElementById('btnGuide');

// Button: show overlay on current page
btnShow.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'showOverlay' });
  window.close();
});

// Button: open setup guide page
btnGuide.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
  window.close();
});
