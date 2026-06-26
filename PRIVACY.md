# AuraAudio EQ & Dynamics — Privacy Policy

**Last updated:** June 26, 2026

AuraAudio EQ & Dynamics ("this extension") is a browser extension that applies audio effects (EQ, compressor, limiter) to web page media using the Web Audio API.

## Data collection

This extension **does not collect, transmit, or sell** any personal data.

## Data stored locally

The extension uses Chrome's `storage` API to save your settings on your device only, including:

- Master on/off state
- EQ, compressor, and limiter parameters
- Up to 3 user preset slots

This data never leaves your browser and is not sent to any server operated by the developer.

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save and restore your effect settings and presets locally |

Content scripts run on web pages solely to intercept and process `<audio>` / `<video>` playback through the Web Audio graph. No page content is read, logged, or transmitted.

## Third parties

This extension does not integrate third-party analytics, advertising, or tracking services.

## Contact

For privacy questions, open an issue on the GitHub repository listed on the Chrome Web Store listing.
