// Application State
let qrHistory = [];
let currentSettings = {
  size: 300,
  errorCorrection: 'M',
  exportMargin: 32,
  darkColor: '#000000',
  lightColor: '#ffffff',
  logoFile: null,
  logoSize: 20
};

// Storage Keys
const STORAGE_KEYS = {
  history: 'qr_history_v2',
  settings: 'qr_settings_v2',
  stats: 'qr_stats_v2'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  loadStoredData();
  setupEventListeners();
  setupKeyboardShortcuts();
  updateUI();
  showToast('Welcome to QR Code Studio!', 'success');
}

// Storage Functions
function loadStoredData() {
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEYS.history);
    if (storedHistory) {
      qrHistory = JSON.parse(storedHistory);
    }
    
    const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      currentSettings = { ...currentSettings, ...settings };
      applyStoredSettings();
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(qrHistory));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(currentSettings));
    updateStorageStats();
  } catch (error) {
    console.error('Error saving to storage:', error);
    showToast('Storage error. Please clear some data.', 'error');
  }
}

function applyStoredSettings() {
  document.getElementById('qrSize').value = currentSettings.size;
  document.getElementById('errorCorrection').value = currentSettings.errorCorrection;
  document.getElementById('exportMargin').value = currentSettings.exportMargin;
  document.getElementById('darkColor').value = currentSettings.darkColor;
  document.getElementById('lightColor').value = currentSettings.lightColor;
  document.getElementById('darkColorText').value = currentSettings.darkColor;
  document.getElementById('lightColorText').value = currentSettings.lightColor;
  document.getElementById('logoSize').value = currentSettings.logoSize;
  document.querySelector('.range-value').textContent = currentSettings.logoSize + '%';
}

// Event Listeners Setup
function setupEventListeners() {
  // Tab Navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Generate Controls
  document.getElementById('btnGenerate').addEventListener('click', handleGenerate);
  document.getElementById('btnBatch').addEventListener('click', handleBatchGenerate);
  
  // Input Actions
  document.getElementById('pasteBtn').addEventListener('click', handlePaste);
  document.getElementById('clearTextBtn').addEventListener('click', () => {
    document.getElementById('textInput').value = '';
    updatePreview();
  });

  // Settings Controls
  document.getElementById('qrSize').addEventListener('change', updateSettings);
  document.getElementById('errorCorrection').addEventListener('change', updateSettings);
  document.getElementById('exportMargin').addEventListener('change', updateSettings);
  document.getElementById('darkColor').addEventListener('change', updateColorSettings);
  document.getElementById('lightColor').addEventListener('change', updateColorSettings);
  document.getElementById('darkColorText').addEventListener('input', updateColorFromText);
  document.getElementById('lightColorText').addEventListener('input', updateColorFromText);

  // Logo Upload
  document.getElementById('logoUploadBtn').addEventListener('click', () => {
    document.getElementById('logoUpload').click();
  });
  document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
  document.getElementById('removeLogo').addEventListener('click', removeLogo);
  document.getElementById('logoSize').addEventListener('input', updateLogoSize);

  // Preview Controls
  document.getElementById('previewRefresh').addEventListener('click', updatePreview);
  document.getElementById('textInput').addEventListener('input', debounce(updatePreview, 300));

  // Advanced Options Toggle
  document.getElementById('collapseOptions').addEventListener('click', toggleAdvancedOptions);

  // Template Cards
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => showTemplateForm(card.dataset.template));
  });

  // Template Form Close Buttons
  document.querySelectorAll('.close-form').forEach(btn => {
    btn.addEventListener('click', () => hideTemplateForm(btn.dataset.close));
  });

  // Gallery Controls
  document.getElementById('btnDownloadAll').addEventListener('click', downloadAllQRCodes);
  document.getElementById('btnClearAll').addEventListener('click', clearAllQRCodes);
  document.getElementById('searchInput').addEventListener('input', debounce(filterGallery, 300));
  
  // Gallery Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setGalleryFilter(btn.dataset.filter));
  });

  // Settings
  document.querySelectorAll('.preset-color').forEach(preset => {
    preset.addEventListener('click', () => applyColorPreset(preset));
  });
  
  document.getElementById('exportSettings').addEventListener('click', exportSettings);
  document.getElementById('importSettings').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importSettings);
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter - Generate QR
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
    
    // Ctrl+V - Paste (when not in input)
    if (e.ctrlKey && e.key === 'v' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      handlePaste();
    }
    
    // Ctrl+S - Download last QR
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (qrHistory.length > 0) {
        downloadQR(qrHistory[0]);
      }
    }
    
    // Escape - Close dialogs
    if (e.key === 'Escape') {
      hideAllTemplateForms();
    }
  });
}

// Tab Management
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Show/hide content
  document.querySelectorAll('.content').forEach(content => {
    content.style.display = content.id === `tab-${tabName}` ? 'block' : 'none';
  });
  
  // Update gallery when switching to view tab
  if (tabName === 'view') {
    updateGalleryDisplay();
  }
}

// Settings Management
function updateSettings() {
  currentSettings.size = parseInt(document.getElementById('qrSize').value);
  currentSettings.errorCorrection = document.getElementById('errorCorrection').value;
  currentSettings.exportMargin = parseInt(document.getElementById('exportMargin').value);
  
  updatePreview();
  saveToStorage();
}

function updateColorSettings() {
  currentSettings.darkColor = document.getElementById('darkColor').value;
  currentSettings.lightColor = document.getElementById('lightColor').value;
  
  // Sync with text inputs
  document.getElementById('darkColorText').value = currentSettings.darkColor;
  document.getElementById('lightColorText').value = currentSettings.lightColor;
  
  updatePreview();
  saveToStorage();
}

function updateColorFromText() {
  const darkText = document.getElementById('darkColorText').value;
  const lightText = document.getElementById('lightColorText').value;
  
  if (isValidColor(darkText)) {
    currentSettings.darkColor = darkText;
    document.getElementById('darkColor').value = darkText;
  }
  
  if (isValidColor(lightText)) {
    currentSettings.lightColor = lightText;
    document.getElementById('lightColor').value = lightText;
  }
  
  updatePreview();
  saveToStorage();
}

function isValidColor(color) {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}

function updateLogoSize() {
  currentSettings.logoSize = parseInt(document.getElementById('logoSize').value);
  document.querySelector('.range-value').textContent = currentSettings.logoSize + '%';
  updatePreview();
  saveToStorage();
}

function toggleAdvancedOptions() {
  const content = document.getElementById('optionsContent');
  const btn = document.getElementById('collapseOptions');
  
  content.classList.toggle('collapsed');
  btn.classList.toggle('collapsed');
}

// Logo Management
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    showToast('Image too large. Please select a file under 5MB.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentSettings.logoFile = e.target.result;
    showLogoPreview(e.target.result);
    updatePreview();
    saveToStorage();
    
    // Auto-adjust error correction for logo
    if (currentSettings.errorCorrection === 'L') {
      currentSettings.errorCorrection = 'H';
      document.getElementById('errorCorrection').value = 'H';
      showToast('Error correction changed to High for logo compatibility', 'warning');
    }
  };
  reader.readAsDataURL(file);
}

function showLogoPreview(dataUrl) {
  const preview = document.getElementById('logoPreview');
  const img = document.getElementById('logoImage');
  const options = document.getElementById('logoOptions');
  
  img.src = dataUrl;
  preview.style.display = 'block';
  options.style.display = 'block';
}

function removeLogo() {
  currentSettings.logoFile = null;
  document.getElementById('logoPreview').style.display = 'none';
  document.getElementById('logoOptions').style.display = 'none';
  document.getElementById('logoUpload').value = '';
  updatePreview();
  saveToStorage();
}

// QR Code Generation
async function handleGenerate() {
  const text = document.getElementById('textInput').value.trim();
  if (!text) {
    showToast('Please enter text to generate QR code', 'error');
    return;
  }
  
  showLoading('Generating QR code...');
  
  try {
    const items = text.includes(';') ? splitBatchText(text) : [text];
    await generateQRCodes(items);
    
    if (items.length === 1) {
      showToast('QR code generated successfully!', 'success');
    } else {
      showToast(`Generated ${items.length} QR codes successfully!`, 'success');
    }
    
    switchTab('view');
  } catch (error) {
    console.error('Generation error:', error);
    showToast('Error generating QR code. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

async function handleBatchGenerate() {
  const text = document.getElementById('textInput').value.trim();
  if (!text) {
    showToast('Please enter text for batch generation', 'error');
    return;
  }
  
  const items = splitBatchText(text);
  if (items.length < 2) {
    showToast('Use semicolon (;) to separate multiple items for batch generation', 'warning');
    return;
  }
  
  showLoading(`Generating ${items.length} QR codes...`);
  
  try {
    await generateQRCodes(items);
    showToast(`Generated ${items.length} QR codes successfully!`, 'success');
    switchTab('view');
  } catch (error) {
    console.error('Batch generation error:', error);
    showToast('Error in batch generation. Some QR codes may not have been created.', 'error');
  } finally {
    hideLoading();
  }
}

function splitBatchText(text) {
  return text.split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

async function generateQRCodes(textArray) {
  const results = [];
  
  for (let i = 0; i < textArray.length; i++) {
    try {
      const qrData = await generateSingleQR(textArray[i]);
      results.push(qrData);
      
      // Update progress for batch
      if (textArray.length > 1) {
        updateLoadingText(`Generating QR codes... (${i + 1}/${textArray.length})`);
      }
    } catch (error) {
      console.error(`Error generating QR for item ${i}:`, error);
    }
  }
  
  // Add to history (newest first)
  qrHistory.unshift(...results);
  saveToStorage();
  updateUI();
  
  return results;
}

function generateSingleQR(text) {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const qr = new QRCode(container, {
        text: text,
        width: currentSettings.size,
        height: currentSettings.size,
        colorDark: currentSettings.darkColor,
        colorLight: currentSettings.lightColor,
        correctLevel: QRCode.CorrectLevel[currentSettings.errorCorrection]
      });
      
      setTimeout(async () => {
        try {
          let canvas = container.querySelector('canvas');
          if (!canvas) {
            const img = container.querySelector('img');
            if (img) {
              canvas = await convertImgToCanvas(img);
            }
          }
          
          if (canvas) {
            // Apply logo if present
            if (currentSettings.logoFile) {
              canvas = await applyLogoToCanvas(canvas, currentSettings.logoFile);
            }
            
            const dataUrl = canvas.toDataURL('image/png');
            const qrData = {
              id: Date.now() + Math.random(),
              text: text,
              dataUrl: dataUrl,
              timestamp: new Date().toISOString(),
              settings: { ...currentSettings },
              type: detectQRType(text)
            };
            
            document.body.removeChild(container);
            resolve(qrData);
          } else {
            throw new Error('Failed to generate QR canvas');
          }
        } catch (error) {
          document.body.removeChild(container);
          reject(error);
        }
      }, 100);
      
    } catch (error) {
      reject(error);
    }
  });
}

function convertImgToCanvas(img) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    
    if (img.complete) {
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    }
  });
}

function applyLogoToCanvas(canvas, logoDataUrl) {
  return new Promise((resolve) => {
    const logoImg = new Image();
    logoImg.onload = () => {
      const ctx = canvas.getContext('2d');
      const logoSize = (currentSettings.logoSize / 100) * Math.min(canvas.width, canvas.height);
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      
      // Add white background behind logo for better visibility
      ctx.fillStyle = 'white';
      ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
      
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      resolve(canvas);
    };
    logoImg.src = logoDataUrl;
  });
}

function detectQRType(text) {
  if (text.startsWith('http://') || text.startsWith('https://')) return 'url';
  if (text.startsWith('WIFI:')) return 'wifi';
  if (text.startsWith('BEGIN:VCARD')) return 'vcard';
  if (text.startsWith('mailto:')) return 'email';
  if (text.startsWith('sms:')) return 'sms';
  if (text.startsWith('geo:')) return 'location';
  return 'text';
}

// Preview Management
function updatePreview() {
  const text = document.getElementById('textInput').value.trim();
  const charCount = document.getElementById('charCount');
  const sizeInfo = document.getElementById('sizeInfo');
  const preview = document.getElementById('qrPreview');
  
  charCount.textContent = text.length;
  sizeInfo.textContent = `${currentSettings.size}×${currentSettings.size}`;
  
  if (!text) {
    preview.innerHTML = `
      <div class="preview-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <rect x="7" y="7" width="3" height="3"/>
          <rect x="14" y="7" width="3" height="3"/>
          <rect x="7" y="14" width="3" height="3"/>
          <rect x="14" y="14" width="3" height="3"/>
        </svg>
        <p>Preview will appear here</p>
      </div>
    `;
    return;
  }
  
  // Generate preview QR
  try {
    const container = document.createElement('div');
    const qr = new QRCode(container, {
      text: text,
      width: 200,
      height: 200,
      colorDark: currentSettings.darkColor,
      colorLight: currentSettings.lightColor,
      correctLevel: QRCode.CorrectLevel[currentSettings.errorCorrection]
    });
    
    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      const img = container.querySelector('img');
      
      preview.innerHTML = '';
      if (canvas) {
        preview.appendChild(canvas.cloneNode(true));
      } else if (img) {
        preview.appendChild(img.cloneNode(true));
      }
    }, 50);
    
  } catch (error) {
    console.error('Preview error:', error);
  }
}

// Template Management
function showTemplateForm(templateType) {
  hideAllTemplateForms();
  const form = document.getElementById(`${templateType}-form`);
  if (form) {
    form.style.display = 'block';
    document.querySelector('.template-forms').style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function hideTemplateForm(templateType) {
  const form = document.getElementById(`${templateType}-form`);
  if (form) {
    form.style.display = 'none';
  }
  
  // Hide container if no forms are visible
  const visibleForms = document.querySelectorAll('.template-form[style*="block"]');
  if (visibleForms.length === 0) {
    document.querySelector('.template-forms').style.display = 'none';
  }
}

function hideAllTemplateForms() {
  document.querySelectorAll('.template-form').forEach(form => {
    form.style.display = 'none';
  });
  document.querySelector('.template-forms').style.display = 'none';
}

async function generateFromTemplate(templateType) {
  let templateText = '';
  
  try {
    switch (templateType) {
      case 'wifi':
        templateText = generateWiFiQR();
        break;
      case 'vcard':
        templateText = generateVCardQR();
        break;
      case 'email':
        templateText = generateEmailQR();
        break;
      case 'sms':
        templateText = generateSMSQR();
        break;
      case 'social':
        templateText = generateSocialQR();
        break;
      case 'location':
        templateText = generateLocationQR();
        break;
      default:
        throw new Error('Unknown template type');
    }
    
    if (!templateText) {
      showToast('Please fill in the required fields', 'error');
      return;
    }
    
    // Set the text and generate
    document.getElementById('textInput').value = templateText;
    hideAllTemplateForms();
    await handleGenerate();
    
  } catch (error) {
    console.error('Template generation error:', error);
    showToast('Error generating from template', 'error');
  }
}

function generateWiFiQR() {
  const ssid = document.getElementById('wifiSSID').value.trim();
  const password = document.getElementById('wifiPassword').value;
  const security = document.getElementById('wifiSecurity').value;
  const hidden = document.getElementById('wifiHidden').checked;
  
  if (!ssid) return '';
  
  let wifiString = `WIFI:T:${security};S:${ssid};`;
  if (password && security !== 'nopass') {
    wifiString += `P:${password};`;
  }
  if (hidden) {
    wifiString += 'H:true;';
  }
  wifiString += ';';
  
  return wifiString;
}

function generateVCardQR() {
  const name = document.getElementById('vcardName').value.trim();
  const phone = document.getElementById('vcardPhone').value.trim();
  const email = document.getElementById('vcardEmail').value.trim();
  const company = document.getElementById('vcardCompany').value.trim();
  const address = document.getElementById('vcardAddress').value.trim();
  const website = document.getElementById('vcardWebsite').value.trim();
  
  if (!name) return '';
  
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vcard += `FN:${name}\n`;
  if (phone) vcard += `TEL:${phone}\n`;
  if (email) vcard += `EMAIL:${email}\n`;
  if (company) vcard += `ORG:${company}\n`;
  if (address) vcard += `ADR:;;${address};;;;\n`;
  if (website) vcard += `URL:${website}\n`;
  vcard += 'END:VCARD';
  
  return vcard;
}

function generateEmailQR() {
  const email = document.getElementById('emailTo').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const body = document.getElementById('emailBody').value.trim();
  
  if (!email) return '';
  
  let emailString = `mailto:${email}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    emailString += '?' + params.join('&');
  }
  
  return emailString;
}

function generateSMSQR() {
  const number = document.getElementById('smsNumber').value.trim();
  const message = document.getElementById('smsMessage').value.trim();
  
  if (!number) return '';
  
  let smsString = `sms:${number}`;
  if (message) {
    smsString += `?body=${encodeURIComponent(message)}`;
  }
  
  return smsString;
}

function generateSocialQR() {
  const platform = document.getElementById('socialPlatform').value;
  const username = document.getElementById('socialUsername').value.trim().replace('@', '');
  
  if (!username) return '';
  
  const baseUrls = {
    facebook: 'https://facebook.com/',
    twitter: 'https://twitter.com/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/@',
    tiktok: 'https://tiktok.com/@'
  };
  
  return baseUrls[platform] + username;
}

function generateLocationQR() {
  const lat = document.getElementById('locationLat').value.trim();
  const lng = document.getElementById('locationLng').value.trim();
  const label = document.getElementById('locationLabel').value.trim();
  
  if (!lat || !lng) return '';
  
  let locationString = `geo:${lat},${lng}`;
  if (label) {
    locationString += `?q=${lat},${lng}(${encodeURIComponent(label)})`;
  }
  
  return locationString;
}

// Gallery Management
function updateGalleryDisplay() {
  const emptyState = document.getElementById('emptyState');
  const galleryContent = document.getElementById('galleryContent');
  const galleryCount = document.getElementById('galleryCount');
  
  if (qrHistory.length === 0) {
    emptyState.style.display = 'block';
    galleryContent.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    galleryContent.style.display = 'block';
    galleryCount.textContent = qrHistory.length;
    renderGalleryItems();
  }
}

function renderGalleryItems(filteredItems = null) {
  const grid = document.getElementById('galleryGrid');
  const items = filteredItems || qrHistory;
  
  grid.innerHTML = '';
  
  items.forEach((qr, index) => {
    const card = createGalleryCard(qr, index);
    grid.appendChild(card);
  });
}

function createGalleryCard(qrData, index) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.dataset.type = qrData.type;
  card.dataset.text = qrData.text.toLowerCase();
  
  const typeIcons = {
    url: '🔗',
    wifi: '📶',
    vcard: '👤',
    email: '📧',
    sms: '💬',
    location: '📍',
    text: '📄'
  };
  
  card.innerHTML = `
    <div class="gallery-card-image">
      <img src="${qrData.dataUrl}" alt="QR Code" />
    </div>
    <div class="gallery-card-content">
      <div class="gallery-card-text">${qrData.text}</div>
      <div class="gallery-card-actions">
        <button class="primary" onclick="downloadQR(qrHistory[${qrHistory.indexOf(qrData)}])">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button class="secondary" onclick="duplicateQR(qrHistory[${qrHistory.indexOf(qrData)}])">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
        <button class="danger" onclick="deleteQR(${qrHistory.indexOf(qrData)})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  return card;
}

function filterGallery() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
  
  let filtered = qrHistory;
  
  // Apply type filter
  if (activeFilter !== 'all') {
    filtered = filtered.filter(qr => qr.type === activeFilter);
  }
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(qr => qr.text.toLowerCase().includes(searchTerm));
  }
  
  renderGalleryItems(filtered);
}

function setGalleryFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  filterGallery();
}

// QR Actions
async function downloadQR(qrData, format = 'png') {
  try {
    showLoading('Preparing download...');
    
    const paddedDataUrl = await addMarginToQR(qrData.dataUrl, currentSettings.exportMargin);
    const filename = `qr_${sanitizeFilename(qrData.text)}_${Date.now()}`;
    
    switch (format) {
      case 'png':
        downloadDataUrl(paddedDataUrl, `${filename}.png`);
        break
