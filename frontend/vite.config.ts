import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo la API de Spring Boot corre en el puerto 8081.
    proxy: { '/api': 'http://localhost:8081' },
  },
})
