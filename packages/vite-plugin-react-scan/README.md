# @react-scan/vite-plugin-react-scan

A Vite plugin that integrates React Scan into your Vite application, automatically detecting performance issues in your React components.

## Installation

```bash
# npm
npm install -D @react-scan/vite-plugin-react-scan react-scan

# pnpm
pnpm add -D @react-scan/vite-plugin-react-scan react-scan

# yarn
yarn add -D @react-scan/vite-plugin-react-scan react-scan
```

## Usage

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      // options (optional)
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | `boolean` | `process.env.NODE_ENV === 'development'` | Enable/disable scanning |
| `scanOptions` | `object` | `{ ... }` | Custom React Scan options |
| `autoDisplayNames` | `boolean` | `true` | Automatically add display names to React components |
| `debug` | `boolean` | `false` | Enable debug logging |

## Example Configuration

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      enable: true,
      autoDisplayNames: true,
      scanOptions: {} // React Scan specific options
    }),
  ],
});
```

## Development vs Production

- In development: The plugin injects React Scan directly into your application for real-time analysis
- In production: The plugin can be disabled/enabled by default with specific options

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

React Scan Vite Plugin is [MIT-licensed](LICENSE) open-source software by Aiden Bai, [Million Software, Inc.](https://million.dev), and [contributors](https://github.com/aidenybai/react-scan/graphs/contributors):
