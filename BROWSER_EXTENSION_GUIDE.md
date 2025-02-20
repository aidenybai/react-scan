# Browser Extension Installation Guide

> [!WARNING]
> React Scan's Browser extension is still pending approvals from the Chrome Web Store, Firefox Add-ons, and Brave Browser. Below is a guide to installing the extension manually.

## Chrome

1. Download the [`chrome-extension-v1.0.5.zip`](https://github.com/aidenybai/react-scan/tree/main/packages/extension/build) file.
2. Unzip the file.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" if it is not already enabled.
5. Click "Load unpacked" and select the unzipped folder (or drag the folder into the page).

## Firefox

1. Download the [`firefox-extension-v1.0.5.zip`](https://github.com/aidenybai/react-scan/tree/main/packages/extension/build) file.
2. Unzip the file.
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
4. Click "Load Temporary Add-on..."
5. Select `manifest.json` from the unzipped folder

## Brave

1. Download the [`brave-extension-v1.0.5.zip`](https://github.com/aidenybai/react-scan/tree/main/packages/extension/build) file.
2. Unzip the file.
3. Open Brave and navigate to `brave://extensions`.
4. Click "Load unpacked" and select the unzipped folder (or drag the folder into the page).

> [!NOTE]
> The React Scan browser extension currently uses `react-scan@0.0.55`
