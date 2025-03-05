# React Scanner Extension

Browser extension for scanning React applications and identifying performance issues.


### Environment Variables

When developing with Brave, you need to set the `BRAVE_BINARY` environment variable. Create a `.env` file (copy from `.env.example`):

```env
# For macOS
BRAVE_BINARY="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# For Windows
BRAVE_BINARY="C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"

# For Linux
BRAVE_BINARY="/usr/bin/brave"
```

### Development Setup
#### For Chrome
1. Run development server:
   ```bash
   pnpm dev
   ```
3. This will automatically open Chrome with the extension loaded.

<i>If you need to inspect the extension, open `chrome://extensions` in Chrome</i>
#### For Firefox

<br />

#### For Firefox
1. Run development server:
   ```bash
   pnpm dev:firefox
   ```
2. This will automatically open Firefox with the extension loaded.

<i>If you need to inspect the extension, open `about:debugging#/runtime/this-firefox` in Firefox</i>

<br />

#### For Brave

1. Run development server:
   ```bash
   pnpm dev:brave
   ```

2. This will automatically open Brave with the extension loaded.

<i>If you need to inspect the extension, open `brave://extensions` in Brave</i>

<br />

### Building for Production

To build the extension for all browsers:

```bash
pnpm pack:all
```

This will create:
- `chrome-extension-v1.0.7.zip`
- `firefox-extension-v1.0.7.zip`
- `brave-extension-v1.0.7.zip`

in the `build` directory.
