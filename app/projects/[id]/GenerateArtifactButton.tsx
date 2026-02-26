'use client'

import { useState } from 'react'
import type { ArtifactType, Artifact } from '@/types'

const LABELS: Record<ArtifactType, string> = {
  charter: 'Charter',
  risk_register: 'Risk Register',
  stakeholder_register: 'Stakeholder Register',
  wbs: 'WBS',
  backlog: 'Backlog'
}

interface Props {
  projectId: string
  type: ArtifactType
  hasExisting: boolean
  onGenerated: (artifact?: Artifact) => void
}

export default function GenerateArtifactButton ({ projectId, type, hasExisting, onGenerated }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, artifact_type: type })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al generar')
        return
      }
      onGenerated(data.artifact)
    } catch {
      setError('Error de conexión')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isGenerating
          ? 'Generando…'
          : hasExisting
            ? `Regenerar ${LABELS[type]}`
            : `Generar ${LABELS[type]}`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
