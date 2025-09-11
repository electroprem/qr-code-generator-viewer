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
const exportMarginInput = document.getElementById('exportMargin');
const btnGenerate = document.getElementById('btnGenerate');
const btnBatch = document.getElementById('btnBatch');
const btnClearInput = document.getElementById('btnClearInput');

const emptyState = document.getElementById('emptyState');
const latestSection = document.getElementById('latestSection');
const latestText = document.getElementById('latestText');
const latestQr = document.getElementById('latestQr');
const btnDownloadLatest = document.getElementById('btnDownloadLatest');
const btnDownloadZip = document.getElementById('btnDownloadZip');

const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const historyCount = document.getElementById('historyCount');
const btnClearHistory = document.getElementById('btnClearHistory');

// In-memory history
const history = loadHistory();

// Get export margin value
function getExportMargin() {
  const n = parseInt(exportMarginInput?.value || '32', 10);
  return Number.isFinite(n) && n >= 0 ? n : 32;
}

// Pad a PNG data URL with outer white margin and return a new PNG data URL
function padPngDataUrl(dataUrl, marginPx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const outW = w + marginPx * 2;
      const outH = h + marginPx * 2;
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      // fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);
      // draw original centered with margin offset
      ctx.drawImage(img, marginPx, marginPx, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl); // fallback if load fails
    img.src = dataUrl;
  });
}

// Utility: dataURL -> Blob
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new Blob([u8], { type: mime });
}

// Filename helper
function sanitizeForFile(s, max = 60) {
  const clean = s.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, max);
  return clean || 'qr';
}

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
  const card = document.createElement('div'); 
  card.className = 'card';
  
  const top = document.createElement('div'); 
  top.className = 'card-qr';
  const img = new Image(); 
  img.alt = 'QR'; 
  img.decoding = 'sync'; 
  img.src = item.dataUrl; 
  img.style.maxWidth = '100%';
  top.appendChild(img);
  
  const text = document.createElement('div'); 
  text.className = 'card-text'; 
  text.textContent = item.text;
  
  const actions = document.createElement('div'); 
  actions.className = 'card-actions';
  const btn = document.createElement('button'); 
  btn.className = 'primary'; 
  btn.textContent = 'Download';
  btn.addEventListener('click', async () => {
    const margin = getExportMargin();
    const padded = await padPngDataUrl(item.dataUrl, margin);
    downloadDataUrl(padded, `qrcode_${item.id}.png`);
  });
  actions.appendChild(btn);
  
  card.appendChild(top); 
  card.appendChild(text); 
  card.appendChild(actions);
  return card;
}

function refreshHistoryUI() {
  historyCount.textContent = history.length;
  
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
  new QRCode(temp, { 
    text, 
    width: size, 
    height: size, 
    colorDark: '#000', 
    colorLight: '#fff', 
    correctLevel: QRCode.CorrectLevel.M 
  });
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
    history.unshift({ 
      id: Date.now() + Math.floor(Math.random() * 1000), 
      text: t, 
      dataUrl 
    });
  }
  saveHistory(history);
  refreshHistoryUI();
  showTab('view');
}

async function handleGenerateAuto() {
  const raw = textInput.value.trim();
  if (!raw) { 
    alert('Enter some text first.'); 
    return; 
  }
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
  if (!items.length) { 
    alert('No valid items found. Use ";" to separate.'); 
    return; 
  }
  await addItemsToHistory(items);
}

function handleClearInput() { 
  textInput.value = ''; 
}

async function handleDownloadLatest() {
  if (!history.length) return;
  const margin = getExportMargin();
  const padded = await padPngDataUrl(history[0].dataUrl, margin);
  downloadDataUrl(padded, `qrcode_${history[0].id}.png`);
}

// Download all as ZIP
async function handleDownloadZip() {
  if (!history.length) { 
    alert('No QR codes in history.'); 
    return; 
  }
  if (typeof JSZip === 'undefined') { 
    alert('Zip library failed to load.'); 
    return; 
  }

  const zip = new JSZip();
  const folder = zip.folder('qr-codes');

  const margin = getExportMargin();
  let index = 1;

  // Show progress (optional)
  btnDownloadZip.textContent = 'Creating ZIP...';
  btnDownloadZip.disabled = true;

  try {
    for (const item of history.slice().reverse()) { // oldest to newest for natural order
      const paddedDataUrl = await padPngDataUrl(item.dataUrl, margin);
      const blob = dataUrlToBlob(paddedDataUrl);
      const base = sanitizeForFile(item.text);
      const name = `${String(index).padStart(3, '0')}-${base}.png`;
      folder.file(name, blob);
      index++;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `qr-codes-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (error) {
    alert('Error creating ZIP file: ' + error.message);
  } finally {
    btnDownloadZip.textContent = 'Download All (ZIP)';
    btnDownloadZip.disabled = false;
  }
}

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
btnDownloadZip.addEventListener('click', handleDownloadZip);
btnClearHistory.addEventListener('click', handleClearHistory);
textInput.addEventListener('keydown', e => { 
  if (e.key === 'Enter' && e.ctrlKey) handleGenerateAuto(); 
});

// Load on start
refreshHistoryUI();
