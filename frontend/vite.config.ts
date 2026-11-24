import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const currentDir = typeof import.meta.dirname !== 'undefined'
  ? import.meta.dirname
  : path.dirname(fileURLToPath(import.meta.url))

// Prioriza o .env unificado na raiz do projeto (..) se existir; caso contrário, usa o diretório local (.)
const rootEnvPath = path.resolve(currentDir, '../.env')
const envDir = fs.existsSync(rootEnvPath) ? '../' : '.'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir,
})
