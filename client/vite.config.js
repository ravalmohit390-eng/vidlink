import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4400,
    proxy: {
      '/api': 'http://localhost:8800',
      '/uploads': 'http://localhost:8800'
    }
  }
})
