import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    allowedHosts: [
      '1e77-49-36-113-87.ngrok-free.app',
      // ... other allowed hosts if you have them
    ],
  },

}
)
