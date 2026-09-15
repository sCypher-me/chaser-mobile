import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], exclude: ['tests/e2e/**','node_modules/**'] }, resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } } })
