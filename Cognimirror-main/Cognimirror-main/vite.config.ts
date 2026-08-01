import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    // Ignorar node_modules de carpetas 3D
    include: [],
  },
  server: {
    fs: {
      // Permitir acceso a RubiksCube para iframe
      allow: ['..', '.'],
    },
    watch: {
      // Ignorar cambios en carpetas 3D
      ignored: [
        '**/public/RubiksCube-threejs-master/**',
        '**/public/3dbrain-master/**'
      ]
    }
  },
  publicDir: 'public',
  // Copiar RubiksCube a public en build
  build: {
    rollupOptions: {
      external: [
        /cogntech-mini-repo/,
      ]
    }
  }
});
