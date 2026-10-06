import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to '/<repository-name>/' for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/ai-vendor-radar/',
})
