import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => { // Removed 'dev' from destructured args
    // Run this configuration on the client-side build only
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              // Monaco Editor Workers
              from: path.resolve('node_modules/monaco-editor/esm/vs'),
              to: path.resolve('public/monaco-workers/vs'),
            },
          ],
        }),
      );
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
