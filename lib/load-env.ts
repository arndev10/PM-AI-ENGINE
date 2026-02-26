import path from 'path'
import fs from 'fs'

let loaded = false

export function loadEnv (): void {
  if (loaded) return
  const cwd = process.cwd()
  const tryPaths = [
    path.join(cwd, '.env'),
    path.join(cwd, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '..', '..', '.env')
  ]
  for (const envPath of tryPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          if (trimmed && !trimmed.startsWith('#')) {
            const eq = trimmed.indexOf('=')
            if (eq > 0) {
              const key = trimmed.slice(0, eq).trim()
              const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
              if (key && !process.env[key]) process.env[key] = value
            }
          }
        }
        loaded = true
        return
      }
    } catch { /* skip */ }
  }
}
