// AuraAudio Popup JS

// Local state copy
let state = { ...DEFAULT_SETTINGS };
let activeBand = 1;
let draggingBand = -1;

// Colors matching the band styles
const bandColors = ['#00f0ff', '#10b981', '#f59e0b', '#f43f5e'];

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const EQ_GAIN_MIN = -24;
const EQ_GAIN_MAX = 24;
const LOG_FREQ_RATIO = Math.log(MAX_FREQ / MIN_FREQ);

// Piecewise Q mapping: slider 0 → 0.1, 500 → 1.0, 1000 → 2.0
function sliderToQ(sliderValue) {
  const t = Math.max(0, Math.min(1, Number(sliderValue) / 1000));
  let q;
  if (t <= 0.5) {
    q = EQ_Q_MIN + (t / 0.5) * (EQ_Q_CENTER - EQ_Q_MIN);
  } else {
    q = EQ_Q_CENTER + ((t - 0.5) / 0.5) * (EQ_Q_MAX - EQ_Q_CENTER);
  }
  return Math.round(q * 10) / 10;
}

function qToSlider(q) {
  const clamped = Math.max(EQ_Q_MIN, Math.min(EQ_Q_MAX, Number(q)));
  let t;
  if (clamped <= EQ_Q_CENTER) {
    t = 0.5 * ((clamped - EQ_Q_MIN) / (EQ_Q_CENTER - EQ_Q_MIN));
  } else {
    t = 0.5 + 0.5 * ((clamped - EQ_Q_CENTER) / (EQ_Q_MAX - EQ_Q_CENTER));
  }
  return Math.round(t * 1000);
}

// Canvas Elements
const canvas = document.getElementById('eq-curve-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Pre-calculate logarithmic frequencies for plotting
const numPoints = 120;
const frequencies = new Float32Array(numPoints);
for (let i = 0; i < numPoints; i++) {
  frequencies[i] = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / (numPoints - 1));
}

// Reuse offline filters for EQ curve visualization
const offlineCtx = new OfflineAudioContext(1, 1, 44100);
const offlineFilters = Array.from({ length: 4 }, () => {
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'peaking';
  return filter;
});
const magResponseScratch = Array.from({ length: 4 }, () => new Float32Array(numPoints));
const phaseScratch = new Float32Array(numPoints);

document.addEventListener('DOMContentLoaded', async () => {
  const items = await chrome.storage.local.get(DEFAULT_SETTINGS);
  state = migrateSettingsQ({ ...DEFAULT_SETTINGS, ...items });
  saveState();
  initUI();
  drawEQCurve();

  if (state.masterEnabled) {
    await activateCurrentTab();
  }
});

const CONTENT_FILES = ['settings.js', 'content.js'];

function isInjectableUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

async function activateCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isInjectableUrl(tab.url)) return;

    await chrome.runtime.sendMessage({ type: 'MARK_TAB_ACTIVE', tabId: tab.id });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      files: CONTENT_FILES
    });

    await chrome.tabs.sendMessage(tab.id, { type: 'WAKE_UP' }).catch(() => {});
  } catch (err) {
    console.warn('AuraAudio popup: Failed to activate tab', err);
  }
}

async function notifyCurrentTabMasterDisabled() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.runtime.sendMessage({ type: 'MASTER_DISABLED', tabId: tab.id });
  } catch (err) {
    console.warn('AuraAudio popup: Failed to notify tab', err);
  }
}

function saveState() {
  chrome.storage.local.set(state);
}

// Helper to get mouse/touch coordinates relative to canvas
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function initUI() {
  // ==========================================
  // Master Control
  // ==========================================
  const masterToggle = document.getElementById('master-toggle');
  masterToggle.checked = state.masterEnabled;
  updateMasterUI(state.masterEnabled);
  
  masterToggle.addEventListener('change', async (e) => {
    state.masterEnabled = e.target.checked;
    updateMasterUI(state.masterEnabled);
    saveState();

    if (state.masterEnabled) {
      await activateCurrentTab();
    } else {
      await notifyCurrentTabMasterDisabled();
    }
  });

  // ==========================================
  // Bypass Toggles
  // ==========================================
  setupBypassButton('eq-bypass-btn', 'eq-card', 'eqEnabled');
  setupBypassButton('comp-bypass-btn', 'comp-card', 'compEnabled');
  setupBypassButton('limiter-bypass-btn', 'limiter-card', 'limiterEnabled');

  // ==========================================
  // Reset EQ Button (DEF)
  // ==========================================
  const eqResetBtn = document.getElementById('eq-reset-btn');
  eqResetBtn.addEventListener('click', () => {
    state.eqBand1Freq = 100;
    state.eqBand1Q = 1.0;
    state.eqBand1Gain = 0;
    
    state.eqBand2Freq = 400;
    state.eqBand2Q = 1.0;
    state.eqBand2Gain = 0;
    
    state.eqBand3Freq = 2000;
    state.eqBand3Q = 1.0;
    state.eqBand3Gain = 0;
    
    state.eqBand4Freq = 8000;
    state.eqBand4Q = 1.0;
    state.eqBand4Gain = 0;
    
    saveState();
    loadActiveBandSliders();
    updateBandTabLabel(1, 100);
    updateBandTabLabel(2, 400);
    updateBandTabLabel(3, 2000);
    updateBandTabLabel(4, 8000);
    drawEQCurve();
  });
  
  // ==========================================
  // Reset Compressor Button (DEF)
  // ==========================================
  const compResetBtn = document.getElementById('comp-reset-btn');
  compResetBtn.addEventListener('click', () => {
    state.compInputGain = 0.0;
    state.compThreshold = -24;
    state.compRatio = 4.0;
    state.compOutputGain = 0.0;
    state.compAttack = 0.03;
    state.compRelease = 0.25;
    
    saveState();
    
    const updates = [
      {id: 'comp-input-gain', val: state.compInputGain, displayId: 'comp-input-gain-val', fmt: v => `${formatGain(v)}`},
      {id: 'comp-threshold', val: state.compThreshold, displayId: 'comp-threshold-val', fmt: v => `${v} dB`},
      {id: 'comp-ratio', val: state.compRatio, displayId: 'comp-ratio-val', fmt: v => `${v.toFixed(1)} : 1`},
      {id: 'comp-output-gain', val: state.compOutputGain, displayId: 'comp-output-gain-val', fmt: v => `${formatGain(v)}`},
      {id: 'comp-attack', val: state.compAttack, displayId: 'comp-attack-val', fmt: v => `${Math.round(v * 1000)} ms`},
      {id: 'comp-release', val: state.compRelease, displayId: 'comp-release-val', fmt: v => `${Math.round(v * 1000)} ms`}
    ];
    
    updates.forEach(u => {
      const el = document.getElementById(u.id);
      if (el) el.value = u.val;
      const disp = document.getElementById(u.displayId);
      if (disp) disp.innerText = u.fmt(u.val);
    });
  });

  // ==========================================
  // Reset Limiter Button (DEF)
  // ==========================================
  const limiterResetBtn = document.getElementById('limiter-reset-btn');
  limiterResetBtn.addEventListener('click', () => {
    state.limiterThreshold = -1.0;
    state.limiterOutputGain = 0.0;
    
    saveState();
    
    const updates = [
      {id: 'limiter-threshold', val: state.limiterThreshold, displayId: 'limiter-threshold-val', fmt: v => `${v.toFixed(1)} dB`},
      {id: 'limiter-output-gain', val: state.limiterOutputGain, displayId: 'limiter-output-gain-val', fmt: v => `${formatGain(v)}`}
    ];
    
    updates.forEach(u => {
      const el = document.getElementById(u.id);
      if (el) el.value = u.val;
      const disp = document.getElementById(u.displayId);
      if (disp) disp.innerText = u.fmt(u.val);
    });
  });

  // ==========================================
  // EQ Band Tabs
  // ==========================================
  const tabButtons = document.querySelectorAll('.band-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBand = parseInt(btn.dataset.band);
      loadActiveBandSliders();
    });
  });
  
  // Initialize slider listeners for EQ
  const freqSlider = document.getElementById('eq-freq-slider');
  const qSlider = document.getElementById('eq-q-slider');
  const gainSlider = document.getElementById('eq-gain-slider');
  
  freqSlider.addEventListener('input', (e) => {
    const pct = parseFloat(e.target.value) / 1000;
    const val = Math.round(MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, pct));
    state[`eqBand${activeBand}Freq`] = val;
    document.getElementById('eq-freq-val').innerText = formatFreq(val);
    updateBandTabLabel(activeBand, val);
    drawEQCurve();
    saveState();
  });
  
  qSlider.addEventListener('input', (e) => {
    const val = sliderToQ(e.target.value);
    state[`eqBand${activeBand}Q`] = val;
    document.getElementById('eq-q-val').innerText = val.toFixed(1);
    drawEQCurve();
    saveState();
  });
  
  gainSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state[`eqBand${activeBand}Gain`] = val;
    document.getElementById('eq-gain-val').innerText = formatGain(val);
    drawEQCurve();
    saveState();
  });

  // ==========================================
  // Canvas Interactive Dragging Listeners
  // ==========================================
  function handleDragStart(e) {
    if (!state.masterEnabled || !state.eqEnabled) return;
    
    const pos = getMousePos(canvas, e);
    const clickRadius = 15; // Click detection radius
    
    for (let i = 0; i < 4; i++) {
      const idx = i + 1;
      const bx = freqToX(state[`eqBand${idx}Freq`]);
      const by = gainToY(state[`eqBand${idx}Gain`]);
      const dist = Math.hypot(pos.x - bx, pos.y - by);
      
      if (dist < clickRadius) {
        draggingBand = idx;
        activeBand = idx;
        
        // Update tab buttons selection
        tabButtons.forEach(b => {
          if (parseInt(b.dataset.band) === activeBand) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        
        loadActiveBandSliders();
        
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }

  function handleDragMove(e) {
    if (draggingBand === -1) return;
    
    const pos = getMousePos(canvas, e);
    
    // Map canvas coordinates back to audio parameters
    let newFreq = Math.round(xToFreq(pos.x));
    let newGain = Math.round(yToGain(pos.y) * 2) / 2; // snap to nearest 0.5 dB
    
    // Boundary check
    newFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, newFreq));
    newGain = Math.max(EQ_GAIN_MIN, Math.min(EQ_GAIN_MAX, newGain));
    
    state[`eqBand${draggingBand}Freq`] = newFreq;
    state[`eqBand${draggingBand}Gain`] = newGain;
    
    // Sync slider panel in real-time if it's the active band
    if (draggingBand === activeBand) {
      const pct = Math.log(newFreq / MIN_FREQ) / LOG_FREQ_RATIO;
      document.getElementById('eq-freq-slider').value = Math.round(pct * 1000);
      document.getElementById('eq-freq-val').innerText = formatFreq(newFreq);
      
      document.getElementById('eq-gain-slider').value = newGain;
      document.getElementById('eq-gain-val').innerText = formatGain(newGain);
    }
    
    updateBandTabLabel(draggingBand, newFreq);
    drawEQCurve();
    saveState();
    
    if (e.cancelable) e.preventDefault();
  }

  function handleDragEnd() {
    draggingBand = -1;
  }

  // Interactive Hover Cursor updates
  canvas.addEventListener('mousemove', (e) => {
    if (draggingBand !== -1) {
      canvas.style.cursor = 'grabbing';
      return;
    }
    if (!state.masterEnabled || !state.eqEnabled) {
      canvas.style.cursor = 'default';
      return;
    }
    
    const pos = getMousePos(canvas, e);
    const hoverRadius = 15;
    let isHovering = false;
    
    for (let i = 0; i < 4; i++) {
      const idx = i + 1;
      const bx = freqToX(state[`eqBand${idx}Freq`]);
      const by = gainToY(state[`eqBand${idx}Gain`]);
      const dist = Math.hypot(pos.x - bx, pos.y - by);
      if (dist < hoverRadius) {
        isHovering = true;
        break;
      }
    }
    canvas.style.cursor = isHovering ? 'pointer' : 'default';
  });

  canvas.addEventListener('mousedown', handleDragStart);
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);
  
  canvas.addEventListener('touchstart', handleDragStart, { passive: false });
  window.addEventListener('touchmove', handleDragMove, { passive: false });
  window.addEventListener('touchend', handleDragEnd);

  // Load sliders for current active band (Band 1)
  loadActiveBandSliders();

  // ==========================================
  // Compressor Sliders
  // ==========================================
  setupSlider('comp-input-gain', 'comp-input-gain-val', 'compInputGain', val => `${formatGain(val)}`);
  setupSlider('comp-threshold', 'comp-threshold-val', 'compThreshold', val => `${val} dB`);
  setupSlider('comp-ratio', 'comp-ratio-val', 'compRatio', val => `${val.toFixed(1)} : 1`);
  setupSlider('comp-output-gain', 'comp-output-gain-val', 'compOutputGain', val => `${formatGain(val)}`);
  setupSlider('comp-attack', 'comp-attack-val', 'compAttack', val => `${Math.round(val * 1000)} ms`);
  setupSlider('comp-release', 'comp-release-val', 'compRelease', val => `${Math.round(val * 1000)} ms`);

  // ==========================================
  // Presets Section
  // ==========================================
  const presetSlotSelect = document.getElementById('preset-slot-select');
  const presetSlotDisplay = document.getElementById('preset-slot-display');
  const presetSaveBtn = document.getElementById('preset-save-btn');
  const presetLoadBtn = document.getElementById('preset-load-btn');

  // Helper to get all current parameters as a clean object
  function getCurrentParams() {
    const params = {};
    SETTING_KEYS.forEach(key => {
      params[key] = state[key];
    });
    return params;
  }

  // Update slot display text
  function updatePresetUI() {
    const slotNum = presetSlotSelect.value;
    presetSlotDisplay.innerText = `Slot ${slotNum}`;
  }
  
  presetSlotSelect.addEventListener('change', updatePresetUI);
  updatePresetUI();

  // Save current state to a specific slot
  presetSaveBtn.addEventListener('click', () => {
    const slotNum = presetSlotSelect.value;
    const params = getCurrentParams();
    
    chrome.storage.local.get(PRESETS_KEY, (items) => {
      let presets = {};
      if (items && items[PRESETS_KEY]) {
        presets = items[PRESETS_KEY];
      }
      presets[`slot${slotNum}`] = params;
      chrome.storage.local.set({ [PRESETS_KEY]: presets }, () => {
        alert(`Slot ${slotNum} saved.`);
      });
    });
  });

  // Load state from a specific slot
  presetLoadBtn.addEventListener('click', () => {
    const slotNum = presetSlotSelect.value;
    chrome.storage.local.get([PRESETS_KEY], (items) => {
      if (items && items[PRESETS_KEY] && items[PRESETS_KEY][`slot${slotNum}`]) {
        const params = items[PRESETS_KEY][`slot${slotNum}`];
        Object.assign(state, DEFAULT_SETTINGS, params);
        migrateSettingsQ(state);
        saveState();
        // Refresh UI without re-registering listeners
        syncUIFromState();
        alert(`Slot ${slotNum} loaded.`);
      } else {
        alert(`Slot ${slotNum} is empty.`);
      }
    });
  });

  // ==========================================
  // Limiter Sliders
  // ==========================================
  setupSlider('limiter-threshold', 'limiter-threshold-val', 'limiterThreshold', val => `${val.toFixed(1)} dB`);
  setupSlider('limiter-output-gain', 'limiter-output-gain-val', 'limiterOutputGain', val => `${formatGain(val)}`);
}

function updateMasterUI(enabled) {
  const statusText = document.getElementById('master-status-text');
  if (enabled) {
    document.body.classList.remove('master-disabled');
    statusText.innerText = 'ENABLED';
    statusText.style.color = 'var(--active-green)';
  } else {
    document.body.classList.add('master-disabled');
    statusText.innerText = 'DISABLED';
    statusText.style.color = 'var(--text-muted)';
  }

  // Icon updates are handled by background.js via storage changes.
}

function setupBypassButton(btnId, cardId, stateKey) {
  const btn = document.getElementById(btnId);
  const card = document.getElementById(cardId);
  
  // Set initial
  updateBypassUI(btn, card, state[stateKey]);
  
  btn.addEventListener('click', () => {
    state[stateKey] = !state[stateKey];
    updateBypassUI(btn, card, state[stateKey]);
    saveState();
  });
}

function updateBypassUI(btn, card, isActive) {
  if (isActive) {
    btn.classList.add('active');
    btn.innerText = 'ACTIVE';
    card.classList.remove('bypassed');
  } else {
    btn.classList.remove('active');
    btn.innerText = 'BYPASSED';
    card.classList.add('bypassed');
  }
}

function setupSlider(sliderId, valDisplayId, stateKey, formatter) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(valDisplayId);
  
  // Load initial
  slider.value = state[stateKey];
  display.innerText = formatter(state[stateKey]);
  
  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state[stateKey] = val;
    display.innerText = formatter(val);
    saveState();
  });
}

function loadActiveBandSliders() {
  const freq = state[`eqBand${activeBand}Freq`];
  const q = state[`eqBand${activeBand}Q`];
  const gain = state[`eqBand${activeBand}Gain`];
  
  const freqSlider = document.getElementById('eq-freq-slider');
  const qSlider = document.getElementById('eq-q-slider');
  const gainSlider = document.getElementById('eq-gain-slider');
  
  // Convert actual frequency back to logarithmic slider value (0-1000)
  const pct = Math.log(freq / MIN_FREQ) / LOG_FREQ_RATIO;
  freqSlider.value = Math.round(pct * 1000);
  qSlider.value = qToSlider(q);
  gainSlider.value = gain;
  
  document.getElementById('eq-freq-val').innerText = formatFreq(freq);
  document.getElementById('eq-q-val').innerText = q.toFixed(1);
  document.getElementById('eq-gain-val').innerText = formatGain(gain);
  
  // Apply band thumb color accent
  const panel = document.querySelector('.band-sliders-panel');
  panel.style.setProperty('--band-accent', bandColors[activeBand - 1]);
}

function syncUIFromState() {
  // Master / bypass
  const masterToggle = document.getElementById('master-toggle');
  masterToggle.checked = state.masterEnabled;
  updateMasterUI(state.masterEnabled);
  
  updateBypassUI(
    document.getElementById('eq-bypass-btn'),
    document.getElementById('eq-card'),
    state.eqEnabled
  );
  updateBypassUI(
    document.getElementById('comp-bypass-btn'),
    document.getElementById('comp-card'),
    state.compEnabled
  );
  updateBypassUI(
    document.getElementById('limiter-bypass-btn'),
    document.getElementById('limiter-card'),
    state.limiterEnabled
  );
  
  // EQ labels / sliders
  updateBandTabLabel(1, state.eqBand1Freq);
  updateBandTabLabel(2, state.eqBand2Freq);
  updateBandTabLabel(3, state.eqBand3Freq);
  updateBandTabLabel(4, state.eqBand4Freq);
  loadActiveBandSliders();
  
  // Compressor sliders
  document.getElementById('comp-input-gain').value = state.compInputGain;
  document.getElementById('comp-input-gain-val').innerText = formatGain(state.compInputGain);
  document.getElementById('comp-threshold').value = state.compThreshold;
  document.getElementById('comp-threshold-val').innerText = `${state.compThreshold} dB`;
  document.getElementById('comp-ratio').value = state.compRatio;
  document.getElementById('comp-ratio-val').innerText = `${state.compRatio.toFixed(1)} : 1`;
  document.getElementById('comp-output-gain').value = state.compOutputGain;
  document.getElementById('comp-output-gain-val').innerText = formatGain(state.compOutputGain);
  document.getElementById('comp-attack').value = state.compAttack;
  document.getElementById('comp-attack-val').innerText = `${Math.round(state.compAttack * 1000)} ms`;
  document.getElementById('comp-release').value = state.compRelease;
  document.getElementById('comp-release-val').innerText = `${Math.round(state.compRelease * 1000)} ms`;
  
  // Limiter sliders
  document.getElementById('limiter-threshold').value = state.limiterThreshold;
  document.getElementById('limiter-threshold-val').innerText = `${state.limiterThreshold.toFixed(1)} dB`;
  document.getElementById('limiter-output-gain').value = state.limiterOutputGain;
  document.getElementById('limiter-output-gain-val').innerText = formatGain(state.limiterOutputGain);
  
  drawEQCurve();
}

function updateBandTabLabel(bandNum, freq) {
  const tabBtn = document.querySelector(`.band-tab-btn[data-band="${bandNum}"]`);
  if (!tabBtn) return;
  
  let labelPrefix = '';
  if (bandNum === 1) labelPrefix = 'L';
  else if (bandNum === 2) labelPrefix = 'LM';
  else if (bandNum === 3) labelPrefix = 'HM';
  else if (bandNum === 4) labelPrefix = 'H';
  
  // Render clean text like L (100Hz) or HM (2.4kHz)
  let freqText = '';
  if (freq >= 1000) {
    freqText = `${(freq / 1000).toFixed(1)}kHz`;
  } else {
    freqText = `${Math.round(freq)}Hz`;
  }
  
  // Re-generate inner HTML containing the dot
  tabBtn.innerHTML = `<span class="band-dot"></span>${labelPrefix} (${freqText})`;
}

// Formatters
function formatFreq(freq) {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)} kHz`;
  }
  return `${Math.round(freq)} Hz`;
}

function formatGain(gain) {
  if (gain > 0) return `+${gain.toFixed(1)} dB`;
  return `${gain.toFixed(1)} dB`;
}

// Convert frequency to logarithmic X coordinate
function freqToX(freq) {
  return width * (Math.log(freq / MIN_FREQ) / LOG_FREQ_RATIO);
}

function xToFreq(x) {
  const pct = Math.max(0, Math.min(1, x / width));
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, pct);
}

// Convert gain dB to Y coordinate
function gainToY(gainDb) {
  const pct = (gainDb - EQ_GAIN_MIN) / (EQ_GAIN_MAX - EQ_GAIN_MIN);
  return height * (1 - pct);
}

// Convert canvas Y to gain dB (inverse linear)
function yToGain(y) {
  const pct = 1 - Math.max(0, Math.min(1, y / height));
  return EQ_GAIN_MIN + pct * (EQ_GAIN_MAX - EQ_GAIN_MIN);
}

function drawEQCurve() {
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    offlineFilters[i].frequency.value = state[`eqBand${idx}Freq`];
    offlineFilters[i].Q.value = state[`eqBand${idx}Q`];
    offlineFilters[i].gain.value = state[`eqBand${idx}Gain`];
    offlineFilters[i].getFrequencyResponse(frequencies, magResponseScratch[i], phaseScratch);
  }

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#161d31';
  ctx.lineWidth = 1;
  const gridFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  gridFreqs.forEach(freq => {
    const x = freqToX(freq);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  });

  const gridGains = [-12, -6, 0, 6, 12];
  gridGains.forEach(g => {
    const y = gainToY(g);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '8px monospace';
    ctx.fillText(`${g > 0 ? '+' : ''}${g}`, 4, y - 2);
  });

  const curvePoints = [];
  for (let j = 0; j < numPoints; j++) {
    let combinedMag = 1;
    for (let i = 0; i < 4; i++) {
      combinedMag *= magResponseScratch[i][j];
    }
    const sumDb = 20 * Math.log10(Math.max(combinedMag, 0.0001));
    curvePoints.push({
      x: freqToX(frequencies[j]),
      y: gainToY(sumDb)
    });
  }
  
  // Draw filled translucent glow area under the curve
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
  gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  curvePoints.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(width, height / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw the main curve line
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
  for (let i = 1; i < curvePoints.length; i++) {
    ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
  }
  ctx.stroke();
  
  // Draw interactive frequency dots on the line
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const bandFreq = state[`eqBand${idx}Freq`];
    const bandGain = state[`eqBand${idx}Gain`];
    const x = freqToX(bandFreq);
    const y = gainToY(bandGain);
    
    // Glowing ring
    ctx.fillStyle = bandColors[i];
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Center white dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label index
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText(`${idx}`, x - 2.5, y - 9);
  }
}
