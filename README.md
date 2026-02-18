# Text Quick Copy

A Chromium extension for quickly copying text from web pages. Works only on whitelisted URLs.

## Features

- **Alt + Click** — Hold `Alt` (Option on Mac) to enter copy mode. The cursor changes to a copy icon and elements highlight as you hover. Click to copy the element's direct text (excludes nested child element text).
- **Right-click → Copy Text (direct only)** — Copies only the direct text of the element, stripping child elements. For example, clicking on a `<div>` containing `user@example.com` followed by a `<span>Verified</span>` copies only the email.
- **Right-click → Copy Full Text (with children)** — Copies the full `innerText` including all nested child elements.
- **URL Whitelist** — The extension is disabled by default. Add URL patterns in the popup to enable it on specific sites.
- **Wildcard support** — Use `*` in URL patterns (e.g. `https://example.com/*` matches all pages on that domain).
- **Quick add** — One-click button to whitelist the current tab's origin.
- **Editable entries** — View full URLs without truncation; edit or remove any whitelisted pattern inline.

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome/Chromium.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select this folder.
5. Pin the extension to your toolbar for easy access.

## Usage

1. Click the extension icon and add a URL pattern (e.g. `https://app.example.com/*`).
2. Refresh the target page.
3. Hold `Alt` and click any text to copy it, or right-click and choose one of the copy options.

## File Structure

```
text-copy-extension/
├── manifest.json    # Extension manifest (Manifest V3)
├── background.js    # Service worker (context menus, whitelist checks)
├── content.js       # Content script (Alt+Click, right-click text capture)
├── popup.html       # Popup UI
├── popup.css        # Popup styles
├── popup.js         # Popup logic (whitelist CRUD)
└── icons/           # Extension icons (16, 48, 128px)
```

## License

MIT
