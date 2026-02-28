import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: {
                entry: resolve('electron/main.ts'),
                fileName: () => 'main.js',
                formats: ['cjs']
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: {
                entry: resolve('electron/preload.ts'),
                fileName: () => 'index.js',
                formats: ['cjs']
            }
        }
    },
    renderer: {
        root: '.',
        publicDir: resolve('public'),
        build: {
            rollupOptions: {
                input: resolve('index.html')
            }
        },
        resolve: {
            alias: {
                '@renderer': resolve('src'),
                '@': resolve('src')
            }
        },
        plugins: [react()]
    }
})
