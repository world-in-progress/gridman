import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {

    const env = loadEnv(mode, process.cwd(), '')

    return {
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
                '/local': {
                    target: env.VITE_LOCAL_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/local/, ''),
                },
                '/local_model': {
                    target: env.VITE_LOCAL_MODEL_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/local_model/, ''),
                },
                '/remote': {
                    target: env.VITE_REMOTE_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/remote/, ''),
                },
                '/model': {
                    target: env.VITE_MODEL_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/model/, ''),
                },
                '/resource': {
                    target: env.VITE_RESOURCE_API_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/resource/, ''),
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
    }
});