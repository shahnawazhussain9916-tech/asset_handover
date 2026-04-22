import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/asset_handover/' // 🔴 MUST MATCH REPO NAME
})