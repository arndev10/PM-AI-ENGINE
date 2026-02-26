'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INDUSTRIES = ['IT', 'Telecom', 'Construcción', 'Energía', 'Salud', 'Manufactura', 'Otro']
const METHODOLOGIES = [
  { value: 'predictivo', label: 'Predictivo' },
  { value: 'agil', label: 'Ágil' },
  { value: 'hibrido', label: 'Híbrido' }
] as const

export default function NewProjectPage () {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    duration_estimate: '',
    budget_estimate: '',
    methodology: 'hibrido'
  })
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | null) => {
    if (!file) {
      setFileName(null)
      return
    }
    if (file.type !== 'application/pdf') return
    setFileName(file.name)
    const input = fileInputRef.current
    if (input) {
      const dt = new DataTransfer()
      dt.items.add(file)
      input.files = dt.files
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type === 'application/pdf') handleFile(file)
  }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Selecciona un archivo PDF')
      return
    }

    setIsSubmitting(true)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('name', form.name || 'Sin nombre')
    fd.set('industry', form.industry)
    fd.set('duration_estimate', form.duration_estimate)
    fd.set('budget_estimate', form.budget_estimate)
    fd.set('methodology', form.methodology)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      let data: { error?: string; project_id?: string }
      try {
        data = await res.json()
      } catch {
        setError(res.ok ? 'Error de conexión' : `Error ${res.status}. Comprueba que el servidor esté en marcha.`)
        return
      }
      if (!res.ok) {
        setError(data.error ?? 'Error al subir')
        return
      }
      router.push(`/projects/${data.project_id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de conexión'
      setError(`No se pudo conectar con el servidor. ¿Estás en la misma URL donde corre npm run dev? (ej. http://localhost:3003). ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-800">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          Nuevo proyecto
        </h1>
        <p className="mt-1 text-slate-600">
          Sube un contrato, SoW o RFP y completa los metadatos. Luego podrás procesar el documento y generar los artefactos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Documento PDF *
          </label>
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`mt-1 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
              isDragging
                ? 'border-slate-500 bg-slate-100'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm font-medium text-slate-600">
              {fileName ?? 'Arrastre el PDF aquí o haga clic para seleccionar'}
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Máx. 15 MB. Contrato, SoW, RFP o anexo.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nombre del proyecto
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Implementación ERP 2025"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-700">
            Industria
          </label>
          <select
            id="industry"
            name="industry"
            value={form.industry}
            onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Selecciona</option>
            {INDUSTRIES.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="duration_estimate" className="block text-sm font-medium text-slate-700">
              Duración estimada
            </label>
            <input
              id="duration_estimate"
              name="duration_estimate"
              type="text"
              value={form.duration_estimate}
              onChange={e => setForm(f => ({ ...f, duration_estimate: e.target.value }))}
              placeholder="Ej. 6 meses"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label htmlFor="budget_estimate" className="block text-sm font-medium text-slate-700">
              Presupuesto estimado
            </label>
            <input
              id="budget_estimate"
              name="budget_estimate"
              type="text"
              value={form.budget_estimate}
              onChange={e => setForm(f => ({ ...f, budget_estimate: e.target.value }))}
              placeholder="Ej. 100k USD"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Enfoque
          </label>
          <div className="mt-2 flex flex-wrap gap-4">
            {METHODOLOGIES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="methodology"
                  value={value}
                  checked={form.methodology === value}
                  onChange={() => setForm(f => ({ ...f, methodology: value }))}
                  className="h-4 w-4 border-slate-300 text-slate-800 focus:ring-slate-500"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Subiendo…' : 'Crear proyecto y subir'}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
