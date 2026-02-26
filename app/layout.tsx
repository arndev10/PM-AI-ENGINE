import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PM AI Engine',
  description: 'Analiza contratos y genera artefactos de gestión alineados a PMBOK 8'
}

export default function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <a href="/" className="text-lg font-semibold text-slate-800">
              PM AI Engine
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
