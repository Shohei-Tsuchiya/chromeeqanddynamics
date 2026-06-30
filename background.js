// AuraAudio background service worker

importScripts('settings.js');

const SESSION_KEY = 'auraAudio_activeTabs';

function updateIcon(masterEnabled) {
  const iconPath = masterEnabled ? 'icon.png' : 'icon_disabled.png';
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.warn('AuraAudio background: Failed to set icon:', chrome.runtime.lastError.message);
    }
  });
}

async function getActiveTabs() {
  const data = await chrome.storage.session.get(SESSION_KEY);
  return data[SESSION_KEY] || {};
}

async function markTabActive(tabId) {
  const tabs = await getActiveTabs();
  tabs[String(tabId)] = true;
  await chrome.storage.session.set({ [SESSION_KEY]: tabs });
}

async function unmarkTabActive(tabId) {
  const tabs = await getActiveTabs();
  delete tabs[String(tabId)];
  await chrome.storage.session.set({ [SESSION_KEY]: tabs });
}

async function activateTab(tabId) {
  if (!tabId) return;
  await markTabActive(tabId);
}

async function notifyTabMasterDisabled(tabId) {
  if (!tabId) return;

  try {
    await chrome.tabs.sendMessage(tabId, { type: 'MASTER_DISABLED' });
  } catch (err) {
    // Content script may not be loaded yet.
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'MARK_TAB_ACTIVE' || message?.type === 'ACTIVATE_TAB') {
    activateTab(message.tabId || sender.tab?.id).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'MASTER_DISABLED') {
    notifyTabMasterDisabled(message.tabId).then(() => sendResponse({ ok: true }));
    return true;
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.masterEnabled) {
    updateIcon(changes.masterEnabled.newValue !== false);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  unmarkTabActive(tabId);
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
