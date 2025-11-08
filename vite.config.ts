import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      base: './', // Ensure relative paths for Electron build
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: Replaced `process.cwd()` with `.` to fix a TypeScript error.
          // `__dirname` is unavailable in ES modules, and `process.cwd()` can have type issues.
          // `path.resolve('.')` reliably resolves to the project root.
          '@': path.resolve('.'),
        }
      }
    };
});