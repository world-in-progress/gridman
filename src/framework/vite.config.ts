import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: '../../templates',
        assetsDir: 'assets',
        emptyOutDir: false,
    },
    server: {
        fs: {
            allow: ['..', '../src/'],
        },
        proxy: {
            '/server': {
                // target: 'http://192.168.1.5:8000',
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/server/, ''),
            },
            '/localhost': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/localhost/, ''),
            },
            '/bear': {
                target: 'http://192.168.31.199:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/bear/, ''),
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    worker: {
        format: 'es',
    },
});