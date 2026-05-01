import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["./src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    platform: "node",
    // ESM stays .js (package.json has "type": "module"); CJS gets .cjs
    fixedExtension: false,
    minify: process.env.NODE_ENV === "production",
  },
});
