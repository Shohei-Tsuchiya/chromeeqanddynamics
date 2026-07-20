// AuraAudio EQ & Dynamics Content Script (injected on demand via activeTab)

(function () {
  if (window.__auraAudioContentLoaded) {
    if (typeof window.__auraAudioReinit === 'function') {
      window.__auraAudioReinit();
    }
    return;
  }
  window.__auraAudioContentLoaded = true;

  const SCAN_DEBOUNCE_MS = 500;
  const YOUTUBE_HOST = 'youtube.com';

  let audioCtx = null;
  let mainInput = null;
  let currentSettings = { ...DEFAULT_SETTINGS };
  let gestureListenersAttached = false;
  const pendingMediaElements = new Set();
  const hookedElements = new Map();
  const preparedElements = new WeakSet();
  let settingsDirty = true;
  let mutationObserver = null;
  let scanTimer = null;

  let processedPathGain = null;

  let eqInput = null;
  let eqFilters = [];
  let eqActiveGain = null;
  let eqBypassGain = null;
  let eqOutput = null;

  let compInput = null;
  let compNode = null;
  let compMakeupGain = null;
  let compActiveGain = null;
  let compBypassGain = null;
  let compOutput = null;

  let limiterInput = null;
  let limiterNode = null;
  let limiterMakeupGain = null;
  let limiterActiveGain = null;
  let limiterBypassGain = null;
  let limiterOutput = null;

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function shouldProcessAudio() {
    return currentSettings.masterEnabled !== false;
  }

  function isYouTubePage() {
    return location.hostname === YOUTUBE_HOST || location.hostname.endsWith('.' + YOUTUBE_HOST);
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

  function resetGraphRefs() {
    mainInput = null;
    processedPathGain = null;
    eqInput = null;
    eqFilters = [];
    eqActiveGain = null;
    eqBypassGain = null;
    eqOutput = null;
    compInput = null;
    compNode = null;
    compMakeupGain = null;
    compActiveGain = null;
    compBypassGain = null;
    compOutput = null;
    limiterInput = null;
    limiterNode = null;
    limiterMakeupGain = null;
    limiterActiveGain = null;
    limiterBypassGain = null;
    limiterOutput = null;
  }

  function initAudioGraph() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'playback'
    });

    mainInput = audioCtx.createGain();
    processedPathGain = audioCtx.createGain();

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
    applyEffectSettings();
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
    if (!shouldProcessAudio()) return;

    initAudioGraph();
    if (!audioCtx || audioCtx.state === 'closed') return;

    if (isAudioRunning()) {
      onAudioReady();
      return;
    }

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

  function detachGestureListeners() {
    if (!gestureListenersAttached) return;
    gestureListenersAttached = false;
  }

  function stopMonitoring() {
    detachGestureListeners();

    if (scanTimer) {
      clearTimeout(scanTimer);
      scanTimer = null;
    }

    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }

  function clearLegacyDomFlags() {
    document.querySelectorAll('video, audio').forEach(el => {
      delete el.__auraAudioHooked;
      delete el.__auraAudioPrepared;
    });
  }

  function disconnectAllMedia() {
    hookedElements.forEach((entry) => {
      try {
        entry.source.disconnect();
      } catch (e) {
        console.warn('AuraAudio: Failed to disconnect source', e);
      }
    });
    hookedElements.clear();
    pendingMediaElements.clear();
  }

  function releaseProcessingFully() {
    disconnectAllMedia();
    stopMonitoring();

    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }

    audioCtx = null;
    resetGraphRefs();
    settingsDirty = true;
  }

  function enterMasterBypassMode() {
    if (hookedElements.size === 0) {
      releaseProcessingFully();
      return;
    }

    initAudioGraph();
    if (!audioCtx) return;

    hookedElements.forEach((entry) => {
      try {
        entry.source.disconnect();
        entry.source.connect(audioCtx.destination);
        entry.directBypass = true;
      } catch (e) {
        console.warn('AuraAudio: Failed to enter bypass mode', e);
      }
    });

    stopMonitoring();
    resumeAudioContext().catch(() => {});
  }

  function enableMasterProcessing() {
    if (!shouldProcessAudio()) return;

    clearLegacyDomFlags();
    initAudioGraph();
    if (!audioCtx) return;

    const resume = audioCtx.state === 'suspended' ? resumeAudioContext() : Promise.resolve();

    resume.then(() => {
      hookedElements.forEach((entry) => {
        try {
          entry.source.disconnect();
          entry.source.connect(mainInput);
          entry.directBypass = false;
        } catch (e) {
          console.warn('AuraAudio: Failed to reconnect source', e);
        }
      });

      applyEffectSettings();
      connectPendingMediaElements();
      startMonitoring();
    }).catch(err => {
      console.warn('AuraAudio: Failed to enable processing', err);
    });
  }

  function applyEffectSettings() {
    if (!audioCtx) {
      settingsDirty = true;
      return;
    }

    settingsDirty = false;

    const s = currentSettings;
    const tc = 0.01;

    setAudioParam(processedPathGain.gain, 1.0, tc);

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

  function applySettings() {
    if (!shouldProcessAudio()) {
      enterMasterBypassMode();
      return;
    }

    if (!audioCtx) {
      settingsDirty = true;
      return;
    }

    applyEffectSettings();
  }

  function connectMediaElement(el) {
    if (!audioCtx || !shouldProcessAudio()) return;

    const existing = hookedElements.get(el);
    if (existing) {
      try {
        existing.source.disconnect();
        existing.source.connect(mainInput);
        existing.directBypass = false;
        pendingMediaElements.delete(el);
      } catch (e) {
        console.warn('AuraAudio: Failed to reconnect hooked element', e);
      }
      return;
    }

    try {
      const source = audioCtx.createMediaElementSource(el);
      source.connect(mainInput);
      hookedElements.set(el, { source, directBypass: false });
      pendingMediaElements.delete(el);
    } catch (e) {
      console.warn('AuraAudio: Could not hook element. Try refreshing the page:', e);
    }
  }

  function connectPendingMediaElements() {
    if (!audioCtx || !shouldProcessAudio()) return;

    [...pendingMediaElements].forEach(el => {
      if (el.isConnected) {
        connectMediaElement(el);
      } else {
        pendingMediaElements.delete(el);
      }
    });
  }

  function onMediaPlayback(el) {
    if (!shouldProcessAudio()) return;
    if (!canRequestAudioStart() && !isAudioRunning()) return;

    if (isAudioRunning()) {
      connectMediaElement(el);
      applySettings();
      return;
    }

    startAudioFromUserGesture();
  }

  function prepareMediaElement(el) {
    if (!shouldProcessAudio()) return;
    if (hookedElements.has(el)) return;

    if (!preparedElements.has(el)) {
      preparedElements.add(el);
      el.addEventListener('play', () => onMediaPlayback(el), { passive: true });
    }

    pendingMediaElements.add(el);

    if (isAudioRunning()) {
      connectMediaElement(el);
      return;
    }

    if (!el.paused && el.readyState >= 2) {
      onMediaPlayback(el);
    }
  }

  function wakeUp() {
    if (!shouldProcessAudio()) return;

    clearLegacyDomFlags();
    startMonitoring();

    findMediaElements().forEach(el => {
      if (!hookedElements.has(el)) {
        pendingMediaElements.add(el);
      }
    });

    if (isAudioRunning()) {
      connectPendingMediaElements();
      applySettings();
    }
  }

  function collectFromShadowRoots(root, media, depth, maxDepth) {
    if (depth > maxDepth) return;

    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        media.push(...el.shadowRoot.querySelectorAll('video, audio'));
        collectFromShadowRoots(el.shadowRoot, media, depth + 1, maxDepth);
      }
    });
  }

  function findMediaElements() {
    if (!shouldProcessAudio()) return [];

    if (isYouTubePage()) {
      const seen = new Set();
      const results = [];

      for (const selector of [
        'video.html5-main-video',
        '#movie_player video',
        'ytd-player video',
        'video'
      ]) {
        document.querySelectorAll(selector).forEach(el => {
          if (!seen.has(el)) {
            seen.add(el);
            results.push(el);
          }
        });
        if (results.length > 0) break;
      }

      return results.slice(0, 2);
    }

    const media = [...document.querySelectorAll('video, audio')];
    collectFromShadowRoots(document, media, 0, 2);
    return media;
  }

  function scanForMediaElements() {
    if (!shouldProcessAudio()) return;

    findMediaElements().forEach(prepareMediaElement);

    if (isAudioRunning()) {
      connectPendingMediaElements();
    }
  }

  function scheduleMediaScan() {
    if (!shouldProcessAudio()) return;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scanForMediaElements();
    }, SCAN_DEBOUNCE_MS);
  }

  function startMonitoring() {
    if (!shouldProcessAudio()) return;

    attachGestureListeners();

    if (!mutationObserver && document.documentElement) {
      mutationObserver = new MutationObserver(scheduleMediaScan);
      mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    scanForMediaElements();
  }

  function mergeSettingsFromStorage(items) {
    SETTING_KEYS.forEach(key => {
      if (items[key] !== undefined) {
        currentSettings[key] = items[key];
      }
    });
    migrateSettingsQ(currentSettings);
    settingsDirty = true;
  }

  function onStorageChanged(changes) {
    let changed = false;
    SETTING_KEYS.forEach(key => {
      if (changes[key]) {
        currentSettings[key] = changes[key].newValue;
        changed = true;
      }
    });

    if (!changed) return;

    migrateSettingsQ(currentSettings);

    if (!shouldProcessAudio()) {
      enterMasterBypassMode();
      return;
    }

    if (changes.masterEnabled && changes.masterEnabled.newValue === true) {
      enableMasterProcessing();
      return;
    }

    applyEffectSettings();
    if (!mutationObserver) {
      startMonitoring();
    }
  }

  function bootstrap() {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      mergeSettingsFromStorage(items);

      if (shouldProcessAudio()) {
        if (hookedElements.size > 0) {
          enableMasterProcessing();
        } else {
          startMonitoring();
        }
      } else {
        enterMasterBypassMode();
      }
    });
  }

  window.__auraAudioReinit = bootstrap;

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      onStorageChanged(changes);
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'MASTER_DISABLED') {
      currentSettings.masterEnabled = false;
      enterMasterBypassMode();
    } else if (message?.type === 'REFRESH_SETTINGS' || message?.type === 'WAKE_UP') {
      bootstrap();
      if (message?.type === 'WAKE_UP') {
        wakeUp();
      }
    }
  });

  bootstrap();
})();
