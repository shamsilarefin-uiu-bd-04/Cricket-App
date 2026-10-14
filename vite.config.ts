import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cricketSyncPlugin } from './src/server/viteCricketSync.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cricketSyncPlugin(),
  ],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) for mobile access
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
})

