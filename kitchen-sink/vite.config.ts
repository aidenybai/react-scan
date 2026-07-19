import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client", "react/jsx-dev-runtime"],
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
