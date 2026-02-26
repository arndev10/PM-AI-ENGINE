'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EditProjectModal from '../EditProjectModal'

interface Props {
  projectId: string
  name: string
  industry: string | null
  durationEstimate: string | null
  budgetEstimate: string | null
}

export default function ProjectHeader ({
  projectId,
  name,
  industry,
  durationEstimate,
  budgetEstimate
}: Props) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)

  const subtitle = [industry, durationEstimate, budgetEstimate].filter(Boolean).join(' · ')

  return (
    <div>
      <Link href="/projects" className="text-sm text-slate-600 hover:text-slate-800">
        ← Proyectos
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-800">
          {name || 'Sin nombre'}
        </h1>
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Editar
        </button>
      </div>
      <p className="mt-1 text-slate-600">{subtitle}</p>
      {showEditModal && (
        <EditProjectModal
          projectId={projectId}
          initialName={name || 'Sin nombre'}
          initialDuration={durationEstimate ?? ''}
          initialBudget={budgetEstimate ?? ''}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
