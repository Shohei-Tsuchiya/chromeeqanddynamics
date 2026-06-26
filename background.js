// AuraAudio background service worker for dynamically changing action icon based on state

importScripts('settings.js');

function updateIcon(masterEnabled) {
  const iconPath = masterEnabled ? 'icon.png' : 'icon_disabled.png';
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.warn('AuraAudio background: Failed to set icon:', chrome.runtime.lastError.message);
    }
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.masterEnabled) {
    updateIcon(changes.masterEnabled.newValue !== false);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ masterEnabled: DEFAULT_SETTINGS.masterEnabled }, (items) => {
    updateIcon(items.masterEnabled !== false);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ masterEnabled: DEFAULT_SETTINGS.masterEnabled }, (items) => {
    updateIcon(items.masterEnabled !== false);
  });
});

chrome.storage.local.get({ masterEnabled: DEFAULT_SETTINGS.masterEnabled }, (items) => {
  updateIcon(items.masterEnabled !== false);
});
