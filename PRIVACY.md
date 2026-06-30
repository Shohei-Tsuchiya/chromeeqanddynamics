# AuraAudio EQ & Dynamics — Privacy Policy

**Last updated:** June 30, 2026  
**Applies to:** Chrome Web Store version 1.0.4 and later

AuraAudio EQ & Dynamics ("this extension") is a browser extension that applies audio effects (parametric EQ, compressor, limiter) to web page media using the Web Audio API.

## Data collection

This extension **does not collect, transmit, or sell** any personal data.

No analytics, advertising, crash reporting, or third-party tracking services are used.

## Data stored locally

The extension uses Chrome's `storage` API to save your settings on your device only, including:

- Master on/off state
- EQ, compressor, and limiter parameters
- Up to 3 user preset slots

This data never leaves your browser and is not sent to any server operated by the developer.

## How the extension accesses web pages

Starting with version 1.0.4, this extension **does not run on all websites automatically**.

Processing occurs **only when you click the extension icon and open the popup** on the tab you want to process. At that moment, the extension injects its audio processing script into the **currently active tab** using Chrome's `activeTab` and `scripting` permissions.

When the master switch is **off**, the extension does not apply effects. If audio was previously connected, it is routed without processing until you turn the master switch back on or refresh the page for fully native playback.

The extension:

- Does **not** read or log page text, URLs for tracking, or personal information
- Does **not** modify page content other than connecting media elements to the Web Audio graph for audio output processing
- Does **not** send audio or page data to external servers

## Permissions

| Permission | Why it is required |
|------------|-------------------|
| `storage` | Save and restore your effect settings and preset slots locally on your device |
| `activeTab` | Access only the tab where you explicitly open the extension popup, so processing is limited to tabs you choose |
| `scripting` | Inject the audio processing script into that tab on demand to connect media playback to the Web Audio API |

This extension **does not** request broad host permissions (e.g. `<all_urls>`) or permanent access to every website.

## Remote code

This extension **does not use remote code**. All scripts are included in the extension package.

## Third parties

This extension does not integrate third-party analytics, advertising, or tracking services.

## Changes from earlier versions

Versions before 1.0.4 used automatic content scripts on http/https pages. Version 1.0.4 and later inject processing code only when you open the popup on the active tab, reducing background activity and improving privacy.

## Contact

For privacy questions, open an issue on the GitHub repository listed on the Chrome Web Store listing:  
https://github.com/Shohei-Tsuchiya/chromeeqanddynamics
