import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    build: {
        outDir: '../../templates',
        assetsDir: 'assets',
        emptyOutDir: false,
    },
    server: {
        fs: {
            allow: [
                '..',
                '../src/'
            ]
        },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
})