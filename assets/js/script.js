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
  const elements = {
    qrSize: document.getElementById('qrSize'),
    errorCorrection: document.getElementById('errorCorrection'),
    exportMargin: document.getElementById('exportMargin'),
    darkColor: document.getElementById('darkColor'),
    lightColor: document.getElementById('lightColor'),
    darkColorText: document.getElementById('darkColorText'),
    lightColorText: document.getElementById('lightColorText'),
    logoSize: document.getElementById('logoSize'),
    rangeValue: document.querySelector('.range-value')
  };

  if (elements.qrSize) elements.qrSize.value = currentSettings.size;
  if (elements.errorCorrection) elements.errorCorrection.value = currentSettings.errorCorrection;
  if (elements.exportMargin) elements.exportMargin.value = currentSettings.exportMargin;
  if (elements.darkColor) elements.darkColor.value = currentSettings.darkColor;
  if (elements.lightColor) elements.lightColor.value = currentSettings.lightColor;
  if (elements.darkColorText) elements.darkColorText.value = currentSettings.darkColor;
  if (elements.lightColorText) elements.lightColorText.value = currentSettings.lightColor;
  if (elements.logoSize) elements.logoSize.value = currentSettings.logoSize;
  if (elements.rangeValue) elements.rangeValue.textContent = currentSettings.logoSize + '%';
}

// Event Listeners Setup
function setupEventListeners() {
  // Tab Navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Generate Controls
  const btnGenerate = document.getElementById('btnGenerate');
  const btnBatch = document.getElementById('btnBatch');
  if (btnGenerate) btnGenerate.addEventListener('click', handleGenerate);
  if (btnBatch) btnBatch.addEventListener('click', handleBatchGenerate);
  
  // Input Actions
  const pasteBtn = document.getElementById('pasteBtn');
  const clearTextBtn = document.getElementById('clearTextBtn');
  if (pasteBtn) pasteBtn.addEventListener('click', handlePaste);
  if (clearTextBtn) {
    clearTextBtn.addEventListener('click', () => {
      document.getElementById('textInput').value = '';
      updatePreview();
    });
  }

  // Settings Controls
  const settingElements = [
    { id: 'qrSize', handler: updateSettings },
    { id: 'errorCorrection', handler: updateSettings },
    { id: 'exportMargin', handler: updateSettings },
    { id: 'darkColor', handler: updateColorSettings },
    { id: 'lightColor', handler: updateColorSettings },
    { id: 'darkColorText', handler: updateColorFromText },
    { id: 'lightColorText', handler: updateColorFromText }
  ];

  settingElements.forEach(({ id, handler }) => {
    const element = document.getElementById(id);
    if (element) {
      const eventType = element.type === 'color' ? 'change' : 'input';
      element.addEventListener(eventType, handler);
    }
  });

  // Logo Upload
  const logoUploadBtn = document.getElementById('logoUploadBtn');
  const logoUpload = document.getElementById('logoUpload');
  const removeLogo = document.getElementById('removeLogo');
  const logoSize = document.getElementById('logoSize');

  if (logoUploadBtn && logoUpload) {
    logoUploadBtn.addEventListener('click', () => logoUpload.click());
    logoUpload.addEventListener('change', handleLogoUpload);
  }
  if (removeLogo) removeLogo.addEventListener('click', removeLogoHandler);
  if (logoSize) logoSize.addEventListener('input', updateLogoSize);

  // Preview Controls
  const previewRefresh = document.getElementById('previewRefresh');
  const textInput = document.getElementById('textInput');
  if (previewRefresh) previewRefresh.addEventListener('click', updatePreview);
  if (textInput) textInput.addEventListener('input', debounce(updatePreview, 300));

  // Advanced Options Toggle
  const collapseOptions = document.getElementById('collapseOptions');
  if (collapseOptions) collapseOptions.addEventListener('click', toggleAdvancedOptions);

  // Template Cards
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => showTemplateForm(card.dataset.template));
  });

  // Template Form Close Buttons
  document.querySelectorAll('.close-form').forEach(btn => {
    btn.addEventListener('click', () => hideTemplateForm(btn.dataset.close));
  });

  // Gallery Controls
  const btnDownloadAll = document.getElementById('btnDownloadAll');
  const btnClearAll = document.getElementById('btnClearAll');
  const searchInput = document.getElementById('searchInput');

  if (btnDownloadAll) btnDownloadAll.addEventListener('click', downloadAllQRCodes);
  if (btnClearAll) btnClearAll.addEventListener('click', clearAllQRCodes);
  if (searchInput) searchInput.addEventListener('input', debounce(filterGallery, 300));
  
  // Gallery Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setGalleryFilter(btn.dataset.filter));
  });

  // Settings
  document.querySelectorAll('.preset-color').forEach(preset => {
    preset.addEventListener('click', () => applyColorPreset(preset));
  });
  
  const exportSettings = document.getElementById('exportSettings');
  const importSettings = document.getElementById('importSettings');
  const importFile = document.getElementById('importFile');

  if (exportSettings) exportSettings.addEventListener('click', exportSettingsHandler);
  if (importSettings && importFile) {
    importSettings.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importSettingsHandler);
  }
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

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function sanitizeFilename(text) {
  return text.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_').substring(0, 50);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const toastMessage = toast.querySelector('.toast-message');
  const toastIcon = toast.querySelector('.toast-icon');

  if (toastMessage) toastMessage.textContent = message;
  
  // Update icon based on type
  if (toastIcon) {
    const icons = {
      success: '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
      error: '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/>'
    };
    toastIcon.innerHTML = icons[type] || icons.success;
  }

  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading(text = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = overlay?.querySelector('.loading-text');
  
  if (overlay) {
    overlay.classList.add('show');
    if (loadingText) loadingText.textContent = text;
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('show');
}

function updateLoadingText(text) {
  const loadingText = document.querySelector('.loading-text');
  if (loadingText) loadingText.textContent = text;
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
  const qrSizeEl = document.getElementById('qrSize');
  const errorCorrectionEl = document.getElementById('errorCorrection');
  const exportMarginEl = document.getElementById('exportMargin');

  if (qrSizeEl) currentSettings.size = parseInt(qrSizeEl.value);
  if (errorCorrectionEl) currentSettings.errorCorrection = errorCorrectionEl.value;
  if (exportMarginEl) currentSettings.exportMargin = parseInt(exportMarginEl.value);
  
  updatePreview();
  saveToStorage();
}

function updateColorSettings() {
  const darkColorEl = document.getElementById('darkColor');
  const lightColorEl = document.getElementById('lightColor');
  const darkColorTextEl = document.getElementById('darkColorText');
  const lightColorTextEl = document.getElementById('lightColorText');

  if (darkColorEl) currentSettings.darkColor = darkColorEl.value;
  if (lightColorEl) currentSettings.lightColor = lightColorEl.value;
  
  // Sync with text inputs
  if (darkColorTextEl) darkColorTextEl.value = currentSettings.darkColor;
  if (lightColorTextEl) lightColorTextEl.value = currentSettings.lightColor;
  
  updatePreview();
  saveToStorage();
}

function updateColorFromText() {
  const darkTextEl = document.getElementById('darkColorText');
  const lightTextEl = document.getElementById('lightColorText');
  
  if (darkTextEl && isValidColor(darkTextEl.value)) {
    currentSettings.darkColor = darkTextEl.value;
    const darkColorEl = document.getElementById('darkColor');
    if (darkColorEl) darkColorEl.value = darkTextEl.value;
  }
  
  if (lightTextEl && isValidColor(lightTextEl.value)) {
    currentSettings.lightColor = lightTextEl.value;
    const lightColorEl = document.getElementById('lightColor');
    if (lightColorEl) lightColorEl.value = lightTextEl.value;
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
  const logoSizeEl = document.getElementById('logoSize');
  const rangeValueEl = document.querySelector('.range-value');

  if (logoSizeEl) {
    currentSettings.logoSize = parseInt(logoSizeEl.value);
    if (rangeValueEl) rangeValueEl.textContent = currentSettings.logoSize + '%';
    updatePreview();
    saveToStorage();
  }
}

function toggleAdvancedOptions() {
  const content = document.getElementById('optionsContent');
  const btn = document.getElementById('collapseOptions');
  
  if (content && btn) {
    content.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
  }
}

// Input Handlers
async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.value = text;
      updatePreview();
      showToast('Text pasted successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to paste text', 'error');
  }
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
      const errorCorrectionEl = document.getElementById('errorCorrection');
      if (errorCorrectionEl) errorCorrectionEl.value = 'H';
      showToast('Error correction changed to High for logo compatibility', 'warning');
    }
  };
  reader.readAsDataURL(file);
}

function showLogoPreview(dataUrl) {
  const preview = document.getElementById('logoPreview');
  const img = document.getElementById('logoImage');
  const options = document.getElementById('logoOptions');
  
  if (img) img.src = dataUrl;
  if (preview) preview.style.display = 'block';
  if (options) options.style.display = 'block';
}

function removeLogoHandler() {
  currentSettings.logoFile = null;
  const preview = document.getElementById('logoPreview');
  const options = document.getElementById('logoOptions');
  const logoUpload = document.getElementById('logoUpload');
  
  if (preview) preview.style.display = 'none';
  if (options) options.style.display = 'none';
  if (logoUpload) logoUpload.value = '';
  
  updatePreview();
  saveToStorage();
}

// QR Code Generation
async function handleGenerate() {
  const textInput = document.getElementById('textInput');
  if (!textInput) return;

  const text = textInput.value.trim();
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
  const textInput = document.getElementById('textInput');
  if (!textInput) return;

  const text = textInput.value.trim();
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
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const sizeInfo = document.getElementById('sizeInfo');
  const preview = document.getElementById('qrPreview');
  
  if (!textInput || !charCount || !sizeInfo || !preview) return;

  const text = textInput.value.trim();
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
  const formsContainer = document.querySelector('.template-forms');
  
  if (form && formsContainer) {
    form.style.display = 'block';
    formsContainer.style.display = 'block';
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
  const formsContainer = document.querySelector('.template-forms');
  
  if (visibleForms.length === 0 && formsContainer) {
    formsContainer.style.display = 'none';
  }
}

function hideAllTemplateForms() {
  document.querySelectorAll('.template-form').forEach(form => {
    form.style.display = 'none';
  });
  
  const formsContainer = document.querySelector('.template-forms');
  if (formsContainer) formsContainer.style.display = 'none';
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
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.value = templateText;
      hideAllTemplateForms();
      await handleGenerate();
    }
    
  } catch (error) {
    console.error('Template generation error:', error);
    showToast('Error generating from template', 'error');
  }
}

function generateWiFiQR() {
  const ssidEl = document.getElementById('wifiSSID');
  const passwordEl = document.getElementById('wifiPassword');
  const securityEl = document.getElementById('wifiSecurity');
  const hiddenEl = document.getElementById('wifiHidden');

  if (!ssidEl) return '';
  
  const ssid = ssidEl.value.trim();
  const password = passwordEl ? passwordEl.value : '';
  const security = securityEl ? securityEl.value : 'WPA';
  const hidden = hiddenEl ? hiddenEl.checked : false;
  
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
  const elements = {
    name: document.getElementById('vcardName'),
    phone: document.getElementById('vcardPhone'),
    email: document.getElementById('vcardEmail'),
    company: document.getElementById('vcardCompany'),
    address: document.getElementById('vcardAddress'),
    website: document.getElementById('vcardWebsite')
  };

  const name = elements.name ? elements.name.value.trim() : '';
  if (!name) return '';

  const phone = elements.phone ? elements.phone.value.trim() : '';
  const email = elements.email ? elements.email.value.trim() : '';
  const company = elements.company ? elements.company.value.trim() : '';
  const address = elements.address ? elements.address.value.trim() : '';
  const website = elements.website ? elements.website.value.trim() : '';
  
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
  const emailEl = document.getElementById('emailTo');
  const subjectEl = document.getElementById('emailSubject');
  const bodyEl = document.getElementById('emailBody');

  if (!emailEl) return '';
  
  const email = emailEl.value.trim();
  const subject = subjectEl ? subjectEl.value.trim() : '';
  const body = bodyEl ? bodyEl.value.trim() : '';
  
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
  const numberEl = document.getElementById('smsNumber');
  const messageEl = document.getElementById('smsMessage');

  if (!numberEl) return '';
  
  const number = numberEl.value.trim();
  const message = messageEl ? messageEl.value.trim() : '';
  
  if (!number) return '';
  
  let smsString = `sms:${number}`;
  if (message) {
    smsString += `?body=${encodeURIComponent(message)}`;
  }
  
  return smsString;
}

function generateSocialQR() {
  const platformEl = document.getElementById('socialPlatform');
  const usernameEl = document.getElementById('socialUsername');

  if (!platformEl || !usernameEl) return '';
  
  const platform = platformEl.value;
  const username = usernameEl.value.trim().replace('@', '');
  
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
  const latEl = document.getElementById('locationLat');
  const lngEl = document.getElementById('locationLng');
  const labelEl = document.getElementById('locationLabel');

  if (!latEl || !lngEl) return '';
  
  const lat = latEl.value.trim();
  const lng = lngEl.value.trim();
  const label = labelEl ? labelEl.value.trim() : '';
  
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
    if (emptyState) emptyState.style.display = 'block';
    if (galleryContent) galleryContent.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (galleryContent) galleryContent.style.display = 'block';
    if (galleryCount) galleryCount.textContent = qrHistory.length;
    renderGalleryItems();
  }
}

function renderGalleryItems(filteredItems = null) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

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
  const searchInput = document.getElementById('searchInput');
  const activeFilter = document.querySelector('.filter-btn.active');
  
  if (!searchInput || !activeFilter) return;

  const searchTerm = searchInput.value.toLowerCase();
  const filter = activeFilter.dataset.filter;
  
  let filtered = qrHistory;
  
  // Apply type filter
  if (filter !== 'all') {
    filtered = filtered.filter(qr => qr.type === filter);
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
async function downloadQR(qrData) {
  try {
    showLoading('Preparing download...');
    
    const paddedDataUrl = await addMarginToQR(qrData.dataUrl, currentSettings.exportMargin);
    const filename = `qr_${sanitizeFilename(qrData.text)}_${Date.now()}.png`;
    
    downloadDataUrl(paddedDataUrl, filename);
    showToast('QR code downloaded successfully!', 'success');
    
  } catch (error) {
    console.error('Download error:', error);
    showToast('Error downloading QR code', 'error');
  } finally {
    hideLoading();
  }
}

function duplicateQR(qrData) {
  const textInput = document.getElementById('textInput');
  if (textInput) {
    textInput.value = qrData.text;
    updatePreview();
    switchTab('generate');
    showToast('QR code content copied to generator', 'success');
  }
}

function deleteQR(index) {
  if (confirm('Are you sure you want to delete this QR code?')) {
    qrHistory.splice(index, 1);
    saveToStorage();
    updateGalleryDisplay();
    updateUI();
    showToast('QR code deleted successfully', 'success');
  }
}

async function downloadAllQRCodes() {
  if (qrHistory.length === 0) {
    showToast('No QR codes to download', 'warning');
    return;
  }

  if (typeof JSZip === 'undefined') {
    showToast('JSZip library not loaded', 'error');
    return;
  }

  showLoading(`Creating ZIP with ${qrHistory.length} QR codes...`);

  try {
    const zip = new JSZip();
    const folder = zip.folder('qr-codes');

    for (let i = 0; i < qrHistory.length; i++) {
      const qr = qrHistory[i];
      const paddedDataUrl = await addMarginToQR(qr.dataUrl, currentSettings.exportMargin);
      const blob = dataUrlToBlob(paddedDataUrl);
      const filename = `${String(i + 1).padStart(3, '0')}-${sanitizeFilename(qr.text)}.png`;
      folder.file(filename, blob);
      
      updateLoadingText(`Processing QR codes... (${i + 1}/${qrHistory.length})`);
    }

    updateLoadingText('Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `qr-codes-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast(`Downloaded ${qrHistory.length} QR codes successfully!`, 'success');

  } catch (error) {
    console.error('Zip download error:', error);
    showToast('Error creating ZIP file', 'error');
  } finally {
    hideLoading();
  }
}

function clearAllQRCodes() {
  if (qrHistory.length === 0) {
    showToast('No QR codes to clear', 'warning');
    return;
  }

  if (confirm(`Are you sure you want to delete all ${qrHistory.length} QR codes? This cannot be undone.`)) {
    qrHistory.length = 0;
    saveToStorage();
    updateGalleryDisplay();
    updateUI();
    showToast('All QR codes cleared successfully', 'success');
  }
}

// Utility Functions for Downloads
async function addMarginToQR(dataUrl, marginPx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const newWidth = img.width + (marginPx * 2);
      const newHeight = img.height + (marginPx * 2);
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, newWidth, newHeight);
      
      // Draw original image centered
      ctx.drawImage(img, marginPx, marginPx);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Settings Functions
function applyColorPreset(presetElement) {
  const darkColor = presetElement.dataset.dark;
  const lightColor = presetElement.dataset.light;
  
  if (darkColor && lightColor) {
    currentSettings.darkColor = darkColor;
    currentSettings.lightColor = lightColor;
    
    const darkColorEl = document.getElementById('darkColor');
    const lightColorEl = document.getElementById('lightColor');
    const darkColorTextEl = document.getElementById('darkColorText');
    const lightColorTextEl = document.getElementById('lightColorText');
    
    if (darkColorEl) darkColorEl.value = darkColor;
    if (lightColorEl) lightColorEl.value = lightColor;
    if (darkColorTextEl) darkColorTextEl.value = darkColor;
    if (lightColorTextEl) lightColorTextEl.value = lightColor;
    
    updatePreview();
    saveToStorage();
    showToast('Color preset applied successfully', 'success');
  }
}

function exportSettingsHandler() {
  const settingsData = {
    settings: currentSettings,
    history: qrHistory,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(settingsData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const a = document.createElement('a');
  a.href = URL.createObjectURL(dataBlob);
  a.download = `qr-studio-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showToast('Settings exported successfully', 'success');
}

function importSettingsHandler(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.type !== 'application/json') {
    showToast('Please select a valid JSON file', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.settings) {
        currentSettings = { ...currentSettings, ...data.settings };
        applyStoredSettings();
      }
      
      if (data.history && Array.isArray(data.history)) {
        if (confirm('Import QR code history as well? This will replace your current history.')) {
          qrHistory.splice(0, qrHistory.length, ...data.history);
        }
      }
      
      saveToStorage();
      updateUI();
      updateGalleryDisplay();
      showToast('Settings imported successfully', 'success');
      
    } catch (error) {
      console.error('Import error:', error);
      showToast('Error importing settings file', 'error');
    }
  };
  reader.readAsText(file);
}

// UI Updates
function updateUI() {
  updateStorageStats();
  updateHeaderStats();
}

function updateStorageStats() {
  const totalQRsEl = document.getElementById('totalQRs');
  const storageUsedEl = document.getElementById('storageUsed');
  
  if (totalQRsEl) totalQRsEl.textContent = qrHistory.length;
  
  if (storageUsedEl) {
    const dataSize = JSON.stringify(qrHistory).length;
    const sizeInKB = Math.round(dataSize / 1024);
    storageUsedEl.textContent = `${sizeInKB} KB`;
  }
}

function updateHeaderStats() {
  const totalGeneratedEl = document.getElementById('totalGenerated');
  if (totalGeneratedEl) {
    totalGeneratedEl.textContent = qrHistory.length;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
