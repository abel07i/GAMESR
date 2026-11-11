import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: process.env.VITE_ADMIN_BASE || (command === 'build' ? '/admin/' : '/'),
  plugins: [react()],
  server: {
    port: 5174
  }
}))
