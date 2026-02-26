'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EditProjectModal from './EditProjectModal'

interface Props {
  projectId: string
  projectName: string
  durationEstimate?: string | null
  budgetEstimate?: string | null
}

export default function ProjectRowActions ({
  projectId,
  projectName,
  durationEstimate = '',
  budgetEstimate = ''
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [isOpen])

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el proyecto "${projectName}"? Se borrarán documentos y artefactos.`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Error al eliminar')
        return
      }
      window.location.href = '/projects'
    } catch {
      alert('Error de conexión')
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <Link
        href={`/projects/${projectId}`}
        className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Abrir
      </Link>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Menú"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <Link
            href={`/projects/${projectId}`}
            className="block px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setIsOpen(false)}
          >
            Abrir proyecto
          </Link>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setShowEditModal(true) }}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Editar proyecto
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      )}
      {showEditModal && (
        <EditProjectModal
          projectId={projectId}
          initialName={projectName}
          initialDuration={durationEstimate ?? ''}
          initialBudget={budgetEstimate ?? ''}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
