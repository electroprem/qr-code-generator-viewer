// Storage helpers for persistence
const STORAGE_KEY = 'qr_history_v1';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    alert('Unable to save to localStorage.');
  }
}

function clearHistoryStore() {
  localStorage.removeItem(STORAGE_KEY);
}

// Ensure QRCode library present
function ensureLib() {
  if (typeof QRCode === 'undefined') {
    alert('QR library failed to load.');
    throw new Error('QRCode is not defined');
  }
}

// Tabs handling
const tabs = document.querySelectorAll('.tab');
const tabGenerate = document.getElementById('tab-generate');
const tabView = document.getElementById('tab-view');
function showTab(name) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  tabGenerate.style.display = name === 'generate' ? '' : 'none';
  tabView.style.display = name === 'view' ? '' : 'none';
}
tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

// Elements
const textInput = document.getElementById('textInput');
const btnGenerate = document.getElementById('btnGenerate');
const btnBatch = document.getElementById('btnBatch');
const btnClearInput = document.getElementById('btnClearInput');

const emptyState = document.getElementById('emptyState');
const latestSection = document.getElementById('latestSection');
const latestText = document.getElementById('latestText');
const latestQr = document.getElementById('latestQr');
const btnDownloadLatest = document.getElementById('btnDownloadLatest');

const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const btnClearHistory = document.getElementById('btnClearHistory');

// In-memory history
const history = loadHistory();

function downloadDataUrl(dataUrl, name = `qrcode_${Date.now()}.png`) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderLatest(item) {
  latestText.textContent = item.text;
  latestQr.innerHTML = '';
  const img = new Image();
  img.alt = 'QR';
  img.decoding = 'sync';
  img.src = item.dataUrl;
  img.style.maxWidth = '100%';
  latestQr.appendChild(img);
  emptyState.style.display = 'none';
  latestSection.style.display = '';
}

function makeHistoryCard(item) {
  const card = document.createElement('div'); card.className = 'card';
  const top = document.createElement('div'); top.className = 'card-qr';
  const img = new Image(); img.alt = 'QR'; img.decoding = 'sync'; img.src = item.dataUrl; img.style.maxWidth = '100%';
  top.appendChild(img);
  const text = document.createElement('div'); text.className = 'card-text'; text.textContent = item.text;
  const actions = document.createElement('div'); actions.className = 'card-actions';
  const btn = document.createElement('button'); btn.className = 'primary'; btn.textContent = 'Download';
  btn.addEventListener('click', () => downloadDataUrl(item.dataUrl, `qrcode_${item.id}.png`));
  actions.appendChild(btn);
  card.appendChild(top); card.appendChild(text); card.appendChild(actions);
  return card;
}

function refreshHistoryUI() {
  if (!history.length) {
    emptyState.style.display = '';
    latestSection.style.display = 'none';
    historySection.style.display = 'none';
    historyGrid.innerHTML = '';
    return;
  }
  renderLatest(history[0]);
  historyGrid.innerHTML = '';
  history.forEach(it => historyGrid.appendChild(makeHistoryCard(it)));
  historySection.style.display = '';
}

function splitSemicolons(str) {
  return str.split(';').map(s => s.trim()).filter(Boolean);
}

function generateDataUrl(text, size = 280) {
  ensureLib();
  const temp = document.createElement('div');
  new QRCode(temp, { text, width: size, height: size, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
  return new Promise(resolve => {
    setTimeout(() => {
      const canvas = temp.querySelector('canvas');
      resolve(canvas ? canvas.toDataURL('image/png') : (temp.querySelector('img')?.src || ''));
    }, 0);
  });
}

async function addItemsToHistory(texts) {
  for (const t of texts) {
    const dataUrl = await generateDataUrl(t);
    if (!dataUrl) continue;
    history.unshift({ id: Date.now() + Math.floor(Math.random() * 1000), text: t, dataUrl });
  }
  saveHistory(history);
  refreshHistoryUI();
  showTab('view');
}

async function handleGenerateAuto() {
  const raw = textInput.value.trim();
  if (!raw) { alert('Enter some text first.'); return; }
  const items = splitSemicolons(raw);
  if (items.length > 1) {
    await addItemsToHistory(items);
  } else {
    await addItemsToHistory([raw]);
  }
}

async function handleBatch() {
  const raw = textInput.value;
  const items = splitSemicolons(raw);
  if (!items.length) { alert('No valid items found. Use “;” to separate.'); return; }
  await addItemsToHistory(items);
}

function handleClearInput() { textInput.value = ''; }
function handleDownloadLatest() { if (history.length) downloadDataUrl(history[0].dataUrl, `qrcode_${history[0].id}.png`); }
function handleClearHistory() {
  if (!history.length) return;
  if (!confirm('Clear all saved QR history?')) return;
  history.length = 0;
  clearHistoryStore();
  refreshHistoryUI();
}

// Wire up event listeners
btnGenerate.addEventListener('click', handleGenerateAuto);
btnBatch.addEventListener('click', handleBatch);
btnClearInput.addEventListener('click', handleClearInput);
btnDownloadLatest.addEventListener('click', handleDownloadLatest);
btnClearHistory.addEventListener('click', handleClearHistory);
textInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerateAuto(); });

// Load on start
refreshHistoryUI();
