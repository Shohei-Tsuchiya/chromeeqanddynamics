// Shared AuraAudio settings (loaded by popup, content script, and background)

(function (root) {
  if (root.__auraAudioSettingsLoaded) return;
  root.__auraAudioSettingsLoaded = true;

  root.DEFAULT_SETTINGS = {
    masterEnabled: false,
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

  // EQ Q range: 0.1 (min) / 1.0 (center) / 2.0 (max)
  // Legacy values used max 10; old Q=6.0 maps to new Q=2.0.
  root.EQ_Q_MIN = 0.1;
  root.EQ_Q_CENTER = 1.0;
  root.EQ_Q_MAX = 2.0;
  root.EQ_Q_LEGACY_MAX = 6.0;

  root.migrateQValue = function migrateQValue(oldQ) {
    const q = Number(oldQ);
    if (!Number.isFinite(q)) return root.EQ_Q_CENTER;
    if (q <= root.EQ_Q_CENTER) {
      return Math.max(root.EQ_Q_MIN, Math.min(root.EQ_Q_CENTER, Math.round(q * 10) / 10));
    }
    const remapped = root.EQ_Q_CENTER
      + (q - root.EQ_Q_CENTER) * (root.EQ_Q_MAX - root.EQ_Q_CENTER) / (root.EQ_Q_LEGACY_MAX - root.EQ_Q_CENTER);
    return Math.max(root.EQ_Q_CENTER, Math.min(root.EQ_Q_MAX, Math.round(remapped * 10) / 10));
  };

  root.migrateSettingsQ = function migrateSettingsQ(settings) {
    if (!settings || typeof settings !== 'object') return settings;
    ['eqBand1Q', 'eqBand2Q', 'eqBand3Q', 'eqBand4Q'].forEach((key) => {
      if (settings[key] !== undefined) {
        settings[key] = root.migrateQValue(settings[key]);
      }
    });
    return settings;
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
