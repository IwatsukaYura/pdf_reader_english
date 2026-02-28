import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        exclude: ['**/node_modules/**', '**/electron/**']
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@renderer': resolve(__dirname, 'src')
        }
    }
})
