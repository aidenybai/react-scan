import type { NextConfig } from "next";
import ReactComponentNamePlugin from "react-scan/react-component-name/webpack";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.plugins.push(ReactComponentNamePlugin({}))
    return config
  }
};

export default nextConfig;
