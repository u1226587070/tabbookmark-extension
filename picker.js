// TabBookmark Picker

let books = [];
let cursor = 0;
let container = document.getElementById('list');

// Load bookmarks and render
chrome.runtime.sendMessage({ action: 'getBookmarks' }, (resp) => {
  books = (resp?.items || []).map(i => i ? { url: i.url, title: i.title || i.url } : null);
  render();
  select(0);
});

function render() {
  const html = [];
  for (let i = 0; i < 9; i++) {
    const item = books[i];
    html.push(`
      <div class="row ${item ? '' : 'empty'}" data-idx="${i}">
        <span class="num">${i + 1}</span>
        <span class="tit">${item ? esc(item.title) : '（空）'}</span>
      </div>
    `);
  }
  container.innerHTML = html.join('');

  // Click handlers
  container.querySelectorAll('.row:not(.empty)').forEach(el => {
    el.addEventListener('click', () => openBookmark(parseInt(el.dataset.idx)));
  });
}

function select(idx) {
  document.querySelectorAll('.row').forEach((r, i) => r.classList.toggle('active', i === idx));
  cursor = idx;
  const active = document.querySelector('.row.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function openBookmark(idx) {
  const b = books[idx];
  if (b) {
    chrome.runtime.sendMessage({ action: 'openBookmark', index: idx });
    window.close();
  }
}

// Keyboard
document.addEventListener('keydown', (e) => {
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) {
    e.preventDefault();
    select(n - 1);
    openBookmark(n - 1);
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const max = books.filter(b => b).length - 1;
    if (max < 0) return;
    let next = cursor;
    do { next = (next - 1 + 9) % 9; } while (!books[next] && next !== cursor);
    if (books[next]) select(next);
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    const max = books.filter(b => b).length - 1;
    if (max < 0) return;
    let next = cursor;
    do { next = (next + 1) % 9; } while (!books[next] && next !== cursor);
    if (books[next]) select(next);
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openBookmark(cursor);
    return;
  }
  if (e.key === 'Escape') {
    window.close();
  }
});

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
