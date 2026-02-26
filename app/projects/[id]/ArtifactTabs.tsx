'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ArtifactType, Artifact } from '@/types'
import GenerateArtifactButton from './GenerateArtifactButton'
import ArtifactViewer from './ArtifactViewer'

const TABS: Array<{ type: ArtifactType; label: string }> = [
  { type: 'charter', label: 'Charter' },
  { type: 'risk_register', label: 'Risk Register' },
  { type: 'stakeholder_register', label: 'Stakeholders' },
  { type: 'wbs', label: 'WBS' }
]

interface Props {
  projectId: string
  initialArtifacts: Artifact[]
}

export default function ArtifactTabs ({ projectId, initialArtifacts }: Props) {
  const [activeTab, setActiveTab] = useState<ArtifactType>('charter')
  const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts)

  useEffect(() => {
    setArtifacts(initialArtifacts)
  }, [initialArtifacts])

  const activeArtifact = artifacts.find(a => a.type === activeTab) ?? null

  const refreshArtifacts = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/artifacts?_t=${Date.now()}`,
        { cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        setArtifacts(data.artifacts ?? [])
      }
    } catch { /* silent */ }
  }, [projectId])

  useEffect(() => {
    refreshArtifacts()
  }, [refreshArtifacts])

  const handleGenerated = useCallback((artifact?: Artifact) => {
    if (artifact) {
      setArtifacts(prev => {
        const rest = prev.filter(a => a.type !== artifact.type)
        return [...rest, artifact]
      })
    } else {
      refreshArtifacts()
    }
  }, [refreshArtifacts])

  const handleSave = useCallback(async (artifactId: string, contentJson: unknown, observations?: string) => {
    const body: { content_json?: unknown; observations?: string } = {}
    if (contentJson != null && typeof contentJson === 'object') body.content_json = contentJson
    if (observations !== undefined) body.observations = observations
    const res = await fetch(`/api/artifacts/${artifactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al guardar')
    }
    await refreshArtifacts()
  }, [refreshArtifacts])

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.type}
            type="button"
            onClick={() => setActiveTab(tab.type)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.type
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {artifacts.some(a => a.type === tab.type) && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-green-400" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <GenerateArtifactButton
          projectId={projectId}
          type={activeTab}
          hasExisting={activeArtifact !== null}
          onGenerated={handleGenerated}
        />
        {activeArtifact && (
          <span className="text-xs text-slate-400">
            Generado: {new Date(activeArtifact.updated_at).toLocaleString()}
          </span>
        )}
      </div>

      {activeArtifact ? (
        <ArtifactViewer
          artifact={activeArtifact}
          onSave={handleSave}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <p>No se ha generado este artefacto aún.</p>
          <p className="mt-1 text-sm">Haz clic en el botón para generarlo con IA.</p>
        </div>
      )}
    </div>
  )
}
