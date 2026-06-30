// Shared AuraAudio settings (loaded by popup, content script, and background)

(function (root) {
  if (root.__auraAudioSettingsLoaded) return;
  root.__auraAudioSettingsLoaded = true;

  root.DEFAULT_SETTINGS = {
    masterEnabled: true,
    eqEnabled: true,
    compEnabled: true,
    limiterEnabled: true,

    eqBand1Freq: 100,
    eqBand1Q: 1.0,
    eqBand1Gain: 0,

    eqBand2Freq: 400,
    eqBand2Q: 1.0,
    eqBand2Gain: 0,

    eqBand3Freq: 2000,
    eqBand3Q: 1.0,
    eqBand3Gain: 0,

    eqBand4Freq: 8000,
    eqBand4Q: 1.0,
    eqBand4Gain: 0,

    compInputGain: 0,
    compThreshold: -24,
    compRatio: 4.0,
    compAttack: 0.03,
    compRelease: 0.25,
    compOutputGain: 0,

    limiterThreshold: -1.0,
    limiterOutputGain: 0
  };

  root.SETTING_KEYS = Object.keys(root.DEFAULT_SETTINGS);
  root.PRESETS_KEY = 'auraAudio_presets';
})(typeof globalThis !== 'undefined' ? globalThis : self);
