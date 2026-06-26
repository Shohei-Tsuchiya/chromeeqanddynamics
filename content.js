// AuraAudio EQ & Dynamics Content Script

let audioCtx = null;
let mainInput = null;
let currentSettings = { ...DEFAULT_SETTINGS };
let gestureListenersAttached = false;
const pendingMediaElements = new Set();
let settingsDirty = true;

// Main Routing Gains
let processedPathGain = null;
let bypassPathGain = null;

// EQ Nodes
let eqInput = null;
let eqFilters = [];
let eqActiveGain = null;
let eqBypassGain = null;
let eqOutput = null;

// Compressor Nodes
let compInput = null;
let compNode = null;
let compMakeupGain = null;
let compActiveGain = null;
let compBypassGain = null;
let compOutput = null;

// Limiter Nodes
let limiterInput = null;
let limiterNode = null;
let limiterMakeupGain = null;
let limiterActiveGain = null;
let limiterBypassGain = null;
let limiterOutput = null;

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function isAudioRunning() {
  return audioCtx && audioCtx.state === 'running';
}

function canRequestAudioStart() {
  if (!navigator.userActivation) return true;
  return navigator.userActivation.isActive || navigator.userActivation.hasBeenActive;
}

function setAudioParam(param, value, timeConstant = 0.01) {
  if (!param || !audioCtx) return;
  if (audioCtx.state === 'running') {
    param.setTargetAtTime(value, audioCtx.currentTime, timeConstant);
  } else {
    param.value = value;
  }
}

function initAudioGraph() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  mainInput = audioCtx.createGain();
  processedPathGain = audioCtx.createGain();
  bypassPathGain = audioCtx.createGain();

  eqInput = audioCtx.createGain();
  eqFilters = [
    audioCtx.createBiquadFilter(),
    audioCtx.createBiquadFilter(),
    audioCtx.createBiquadFilter(),
    audioCtx.createBiquadFilter()
  ];
  eqFilters.forEach(f => { f.type = 'peaking'; });
  eqActiveGain = audioCtx.createGain();
  eqBypassGain = audioCtx.createGain();
  eqOutput = audioCtx.createGain();

  compInput = audioCtx.createGain();
  compNode = audioCtx.createDynamicsCompressor();
  compMakeupGain = audioCtx.createGain();
  compActiveGain = audioCtx.createGain();
  compBypassGain = audioCtx.createGain();
  compOutput = audioCtx.createGain();

  limiterInput = audioCtx.createGain();
  limiterNode = audioCtx.createDynamicsCompressor();
  limiterNode.ratio.value = 20;
  limiterNode.attack.value = 0.001;
  limiterNode.release.value = 0.05;
  limiterNode.knee.value = 0;

  limiterMakeupGain = audioCtx.createGain();
  limiterActiveGain = audioCtx.createGain();
  limiterBypassGain = audioCtx.createGain();
  limiterOutput = audioCtx.createGain();

  mainInput.connect(processedPathGain);
  mainInput.connect(bypassPathGain);
  bypassPathGain.connect(audioCtx.destination);

  processedPathGain.connect(eqInput);

  eqInput.connect(eqFilters[0]);
  eqFilters[0].connect(eqFilters[1]);
  eqFilters[1].connect(eqFilters[2]);
  eqFilters[2].connect(eqFilters[3]);
  eqFilters[3].connect(eqActiveGain);
  eqActiveGain.connect(eqOutput);

  eqInput.connect(eqBypassGain);
  eqBypassGain.connect(eqOutput);

  eqOutput.connect(compInput);

  compInput.connect(compNode);
  compNode.connect(compMakeupGain);
  compMakeupGain.connect(compActiveGain);
  compActiveGain.connect(compOutput);

  compInput.connect(compBypassGain);
  compBypassGain.connect(compOutput);

  compOutput.connect(limiterInput);

  limiterInput.connect(limiterNode);
  limiterNode.connect(limiterMakeupGain);
  limiterMakeupGain.connect(limiterActiveGain);
  limiterActiveGain.connect(limiterOutput);

  limiterInput.connect(limiterBypassGain);
  limiterBypassGain.connect(limiterOutput);

  limiterOutput.connect(audioCtx.destination);

  settingsDirty = true;
  applySettings();
}

function resumeAudioContext() {
  if (!audioCtx || audioCtx.state !== 'suspended') {
    return Promise.resolve();
  }
  return audioCtx.resume();
}

function onAudioReady() {
  applySettings();
  connectPendingMediaElements();
}

function startAudioFromUserGesture() {
  initAudioGraph();
  if (!audioCtx || audioCtx.state === 'closed') return;

  if (isAudioRunning()) {
    onAudioReady();
    return;
  }

  // resume() must be called synchronously inside the user-gesture handler.
  resumeAudioContext()
    .then(onAudioReady)
    .catch(err => {
      console.warn('AuraAudio: Failed to start AudioContext', err);
    });
}

function attachGestureListeners() {
  if (gestureListenersAttached) return;
  gestureListenersAttached = true;

  const onUserGesture = () => {
    startAudioFromUserGesture();
  };

  ['click', 'keydown', 'mousedown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, onUserGesture, { passive: true, capture: true });
  });
}

function applySettings() {
  if (!audioCtx) {
    settingsDirty = true;
    return;
  }

  settingsDirty = false;

  const s = currentSettings;
  const tc = 0.01;

  const masterOn = s.masterEnabled !== false;
  setAudioParam(processedPathGain.gain, masterOn ? 1.0 : 0.0, tc);
  setAudioParam(bypassPathGain.gain, masterOn ? 0.0 : 1.0, tc);

  const eqOn = s.eqEnabled !== false;
  setAudioParam(eqActiveGain.gain, eqOn ? 1.0 : 0.0, tc);
  setAudioParam(eqBypassGain.gain, eqOn ? 0.0 : 1.0, tc);

  setAudioParam(eqFilters[0].frequency, s.eqBand1Freq, tc);
  setAudioParam(eqFilters[0].Q, s.eqBand1Q, tc);
  setAudioParam(eqFilters[0].gain, s.eqBand1Gain, tc);

  setAudioParam(eqFilters[1].frequency, s.eqBand2Freq, tc);
  setAudioParam(eqFilters[1].Q, s.eqBand2Q, tc);
  setAudioParam(eqFilters[1].gain, s.eqBand2Gain, tc);

  setAudioParam(eqFilters[2].frequency, s.eqBand3Freq, tc);
  setAudioParam(eqFilters[2].Q, s.eqBand3Q, tc);
  setAudioParam(eqFilters[2].gain, s.eqBand3Gain, tc);

  setAudioParam(eqFilters[3].frequency, s.eqBand4Freq, tc);
  setAudioParam(eqFilters[3].Q, s.eqBand4Q, tc);
  setAudioParam(eqFilters[3].gain, s.eqBand4Gain, tc);

  const compOn = s.compEnabled !== false;
  setAudioParam(compActiveGain.gain, compOn ? 1.0 : 0.0, tc);
  setAudioParam(compBypassGain.gain, compOn ? 0.0 : 1.0, tc);

  setAudioParam(compInput.gain, dbToGain(s.compInputGain), tc);
  setAudioParam(compNode.threshold, s.compThreshold, tc);
  setAudioParam(compNode.knee, 0, tc);
  setAudioParam(compNode.ratio, s.compRatio, tc);
  setAudioParam(compNode.attack, s.compAttack, tc);
  setAudioParam(compNode.release, s.compRelease, tc);
  setAudioParam(compMakeupGain.gain, dbToGain(s.compOutputGain), tc);

  const limiterOn = s.limiterEnabled !== false;
  setAudioParam(limiterActiveGain.gain, limiterOn ? 1.0 : 0.0, tc);
  setAudioParam(limiterBypassGain.gain, limiterOn ? 0.0 : 1.0, tc);

  setAudioParam(limiterNode.threshold, s.limiterThreshold, tc);
  setAudioParam(limiterMakeupGain.gain, dbToGain(s.limiterOutputGain), tc);
}

function connectMediaElement(el) {
  if (!audioCtx || el.__auraAudioHooked) return;

  try {
    const source = audioCtx.createMediaElementSource(el);
    source.connect(mainInput);
    el.__auraAudioHooked = true;
    pendingMediaElements.delete(el);
  } catch (e) {
    console.warn('AuraAudio: Could not hook element:', e);
  }
}

function connectPendingMediaElements() {
  if (!audioCtx) return;

  [...pendingMediaElements].forEach(el => {
    if (el.isConnected) {
      connectMediaElement(el);
    } else {
      pendingMediaElements.delete(el);
    }
  });
}

function onMediaPlayback(el) {
  if (!canRequestAudioStart() && !isAudioRunning()) return;

  if (isAudioRunning()) {
    connectMediaElement(el);
    applySettings();
    return;
  }

  startAudioFromUserGesture();
}

function prepareMediaElement(el) {
  if (el.__auraAudioHooked || el.__auraAudioPrepared) return;

  el.__auraAudioPrepared = true;
  pendingMediaElements.add(el);

  el.addEventListener('play', () => onMediaPlayback(el), { passive: true });

  if (isAudioRunning()) {
    connectMediaElement(el);
  }
}

function findMediaElements(root = document) {
  const mediaElements = [...root.querySelectorAll('video, audio')];

  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      mediaElements.push(...findMediaElements(el.shadowRoot));
    }
  });

  return mediaElements;
}

function scanForMediaElements() {
  findMediaElements().forEach(prepareMediaElement);

  if (isAudioRunning()) {
    connectPendingMediaElements();
  }
}

let scanScheduled = false;
function scheduleMediaScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    scanForMediaElements();
  });
}

function mergeSettingsFromStorage(items) {
  SETTING_KEYS.forEach(key => {
    if (items[key] !== undefined) {
      currentSettings[key] = items[key];
    }
  });
  settingsDirty = true;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'local') return;

  let changed = false;
  SETTING_KEYS.forEach(key => {
    if (changes[key]) {
      currentSettings[key] = changes[key].newValue;
      changed = true;
    }
  });

  if (changed) {
    applySettings();
  }
});

attachGestureListeners();

chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
  mergeSettingsFromStorage(items);

  const observer = new MutationObserver(scheduleMediaScan);
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  scanForMediaElements();
});
