import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["./src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    platform: "node",
    fixedExtension: true,
    minify: process.env.NODE_ENV === "production",
  },
});
