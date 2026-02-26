'use client'

import { useState, useEffect } from 'react'
import type {
  Artifact,
  ArtifactContent,
  CharterContent,
  RiskRegisterContent,
  StakeholderRegisterContent,
  WBSContent,
  WBSTask
} from '@/types'

interface Props {
  artifact: Artifact
  onSave: (artifactId: string, contentJson: unknown, observations?: string) => Promise<void>
}

export default function ArtifactViewer ({ artifact, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ArtifactContent>(artifact.content_json)
  const [observations, setObservations] = useState(artifact.observations ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setObservations(artifact.observations ?? '')
  }, [artifact.id, artifact.observations])

  const handleStartEdit = () => {
    setEditData(JSON.parse(JSON.stringify(artifact.content_json)))
    setIsEditing(true)
    setSaveError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(artifact.id, editData, observations)
      setIsEditing(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  const content = isEditing ? editData : artifact.content_json

  const EXPORT_NAMES: Record<string, string> = {
    charter: '01_Project-Charter',
    risk_register: '02_Risk-register',
    stakeholder_register: '03_Stakeholders',
    wbs: '04_WBS',
    backlog: '04_WBS'
  }
  const exportBaseName = EXPORT_NAMES[artifact.type] ?? 'artifact'

  const handleExport = async (format: 'docx' | 'pdf') => {
    const url = `/api/artifacts/${artifact.id}/export?format=${format}`
    const ext = format
    const filename = `${exportBaseName}.${ext}`
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      if (!res.ok) {
        const text = await blob.text()
        try {
          const data = JSON.parse(text)
          alert(data.error ?? 'Error al descargar')
        } catch {
          alert('Error al descargar')
        }
        return
      }
      const u = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u
      a.download = filename
      a.click()
      URL.revokeObjectURL(u)
    } catch {
      alert('Error de conexión')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Editar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => handleExport('docx')}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Descargar Word
        </button>
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Descargar PDF
        </button>
        {saveError && <span className="text-xs text-red-600">{saveError}</span>}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Observaciones</label>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Notas u observaciones sobre este artefacto…"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 min-h-[80px] focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                setIsSaving(true)
                setSaveError(null)
                try {
                  await onSave(artifact.id, artifact.content_json, observations)
                } catch (e) {
                  setSaveError(e instanceof Error ? e.message : 'Error al guardar')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {isSaving ? 'Guardando…' : 'Guardar observaciones'}
            </button>
          </div>
        </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 overflow-x-auto">
        {artifact.type === 'charter' && (
          <CharterView
            data={content as CharterContent}
            isEditing={isEditing}
            onChange={setEditData as (d: CharterContent) => void}
          />
        )}
        {artifact.type === 'risk_register' && (
          <RiskRegisterView
            data={content as RiskRegisterContent}
            isEditing={isEditing}
            onChange={setEditData as (d: RiskRegisterContent) => void}
          />
        )}
        {artifact.type === 'stakeholder_register' && (
          <StakeholderView
            data={content as StakeholderRegisterContent}
            isEditing={isEditing}
            onChange={setEditData as (d: StakeholderRegisterContent) => void}
          />
        )}
        {(artifact.type === 'wbs' || artifact.type === 'backlog') && (
          <WBSView data={content as WBSContent} />
        )}
      </div>
      </div>
    </div>
  )
}

/* ── Charter ── */

function CharterView ({ data, isEditing, onChange }: {
  data: CharterContent
  isEditing: boolean
  onChange: (d: CharterContent) => void
}) {
  const update = (field: keyof CharterContent, value: unknown) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-5 text-sm">
      <Section title="Proyecto">
        <EditableField value={data.project_name} isEditing={isEditing} onChange={v => update('project_name', v)} />
      </Section>

      <Section title="Alcance">
        <EditableTextarea value={data.scope_summary} isEditing={isEditing} onChange={v => update('scope_summary', v)} />
      </Section>

      <Section title="Objetivos">
        <EditableList items={data.objectives} isEditing={isEditing} onChange={v => update('objectives', v)} />
      </Section>

      <Section title="Entregables">
        <table className="w-full text-left">
          <thead><tr className="border-b border-slate-200">
            <th className="py-1 pr-4 font-medium text-slate-600">Nombre</th>
            <th className="py-1 font-medium text-slate-600">Descripción</th>
          </tr></thead>
          <tbody>
            {data.deliverables.map((d, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-4 font-medium">{d.name}</td>
                <td className="py-1.5 text-slate-600">{d.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Hitos">
        <table className="w-full text-left">
          <thead><tr className="border-b border-slate-200">
            <th className="py-1 pr-4 font-medium text-slate-600">Hito</th>
            <th className="py-1 font-medium text-slate-600">Fecha estimada</th>
          </tr></thead>
          <tbody>
            {data.milestones.map((m, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-4">{m.name}</td>
                <td className="py-1.5 text-slate-500">{m.date_estimate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Restricciones">
          <EditableList items={data.constraints} isEditing={isEditing} onChange={v => update('constraints', v)} />
        </Section>
        <Section title="Supuestos">
          <EditableList items={data.assumptions} isEditing={isEditing} onChange={v => update('assumptions', v)} />
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Presupuesto">
          <EditableField value={data.budget_summary} isEditing={isEditing} onChange={v => update('budget_summary', v)} />
        </Section>
        <Section title="Duración">
          <EditableField value={data.duration_summary} isEditing={isEditing} onChange={v => update('duration_summary', v)} />
        </Section>
      </div>

      <Section title="Stakeholders">
        <table className="w-full text-left">
          <thead><tr className="border-b border-slate-200">
            <th className="py-1 pr-4 font-medium text-slate-600">Rol</th>
            <th className="py-1 font-medium text-slate-600">Responsabilidad</th>
          </tr></thead>
          <tbody>
            {data.stakeholders.map((s, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-4 font-medium">{s.role}</td>
                <td className="py-1.5 text-slate-600">{s.responsibility}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Criterios de Aprobación">
        <EditableList items={data.approval_criteria} isEditing={isEditing} onChange={v => update('approval_criteria', v)} />
      </Section>
    </div>
  )
}

/* ── Risk Register ── */

const SEVERITY_COLORS: Record<string, string> = {
  critico: 'bg-red-100 text-red-800',
  alto: 'bg-orange-100 text-orange-800',
  medio: 'bg-yellow-100 text-yellow-800',
  bajo: 'bg-green-100 text-green-800'
}

function RiskRegisterView ({ data, isEditing, onChange }: {
  data: RiskRegisterContent
  isEditing: boolean
  onChange: (d: RiskRegisterContent) => void
}) {
  const updateRow = (idx: number, field: string, value: string) => {
    const updated = data.risks.map((r, i) => i === idx ? { ...r, [field]: value } : r)
    onChange({ risks: updated })
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="py-2 pr-2 font-medium text-slate-600">#</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Descripción</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Prob.</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Impacto</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Severidad</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Mitigación</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Owner</th>
          <th className="py-2 font-medium text-slate-600">Estado</th>
        </tr>
      </thead>
      <tbody>
        {data.risks.map((r, i) => (
          <tr key={r.id} className="border-b border-slate-100">
            <td className="py-2 pr-2 text-slate-400">{r.id}</td>
            <td className="py-2 pr-2 max-w-xs">
              {isEditing
                ? <input className="w-full rounded border border-slate-200 px-1 py-0.5 text-sm" value={r.description} onChange={e => updateRow(i, 'description', e.target.value)} />
                : r.description}
            </td>
            <td className="py-2 pr-2 capitalize">{r.probability}</td>
            <td className="py-2 pr-2 capitalize">{r.impact}</td>
            <td className="py-2 pr-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_COLORS[r.severity] ?? ''}`}>
                {r.severity}
              </span>
            </td>
            <td className="py-2 pr-2 max-w-xs">
              {isEditing
                ? <input className="w-full rounded border border-slate-200 px-1 py-0.5 text-sm" value={r.mitigation} onChange={e => updateRow(i, 'mitigation', e.target.value)} />
                : r.mitigation}
            </td>
            <td className="py-2 pr-2">{r.owner}</td>
            <td className="py-2 capitalize">{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Stakeholder Register ── */

const INFLUENCE_COLORS: Record<string, string> = {
  alta: 'bg-purple-100 text-purple-800',
  media: 'bg-blue-100 text-blue-800',
  baja: 'bg-slate-100 text-slate-600'
}

function StakeholderView ({ data, isEditing, onChange }: {
  data: StakeholderRegisterContent
  isEditing: boolean
  onChange: (d: StakeholderRegisterContent) => void
}) {
  const updateRow = (idx: number, field: string, value: string) => {
    const updated = data.stakeholders.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange({ stakeholders: updated })
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="py-2 pr-2 font-medium text-slate-600">#</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Rol / Nombre</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Interés</th>
          <th className="py-2 pr-2 font-medium text-slate-600">Influencia</th>
          <th className="py-2 font-medium text-slate-600">Estrategia</th>
        </tr>
      </thead>
      <tbody>
        {data.stakeholders.map((s, i) => (
          <tr key={s.id} className="border-b border-slate-100">
            <td className="py-2 pr-2 text-slate-400">{s.id}</td>
            <td className="py-2 pr-2 font-medium">
              {isEditing
                ? <input className="w-full rounded border border-slate-200 px-1 py-0.5 text-sm" value={s.name_role} onChange={e => updateRow(i, 'name_role', e.target.value)} />
                : s.name_role}
            </td>
            <td className="py-2 pr-2">
              {isEditing
                ? <input className="w-full rounded border border-slate-200 px-1 py-0.5 text-sm" value={s.interest} onChange={e => updateRow(i, 'interest', e.target.value)} />
                : s.interest}
            </td>
            <td className="py-2 pr-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INFLUENCE_COLORS[s.influence] ?? ''}`}>
                {s.influence}
              </span>
            </td>
            <td className="py-2">
              {isEditing
                ? <input className="w-full rounded border border-slate-200 px-1 py-0.5 text-sm" value={s.engagement_strategy} onChange={e => updateRow(i, 'engagement_strategy', e.target.value)} />
                : s.engagement_strategy}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── WBS Tree ── */

function WBSView ({ data }: { data: WBSContent }) {
  return (
    <div className="space-y-1">
      {data.phases.map(phase => (
        <WBSNode key={phase.id} node={phase} depth={0} />
      ))}
    </div>
  )
}

function WBSNode ({ node, depth }: { node: WBSTask; depth: number }) {
  const isPhase = depth === 0
  const isDeliverable = depth === 1
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className={`flex items-center gap-2 py-1 ${isPhase ? 'font-semibold text-slate-800' : isDeliverable ? 'font-medium text-slate-700' : 'text-slate-600'}`}>
        <span className="text-xs text-slate-400 font-mono w-10 shrink-0">{node.id}</span>
        <span>{node.name}</span>
      </div>
      {node.children?.map(child => (
        <WBSNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

/* ── Shared editable primitives ── */

function Section ({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

function EditableField ({ value, isEditing, onChange }: { value: string; isEditing: boolean; onChange: (v: string) => void }) {
  if (isEditing) {
    return <input className="w-full rounded border border-slate-200 px-2 py-1 text-sm" value={value} onChange={e => onChange(e.target.value)} />
  }
  return <p className="text-slate-700">{value}</p>
}

function EditableTextarea ({ value, isEditing, onChange }: { value: string; isEditing: boolean; onChange: (v: string) => void }) {
  if (isEditing) {
    return <textarea className="w-full rounded border border-slate-200 px-2 py-1 text-sm min-h-[80px]" value={value} onChange={e => onChange(e.target.value)} />
  }
  return <p className="text-slate-700 whitespace-pre-wrap">{value}</p>
}

function EditableList ({ items, isEditing, onChange }: { items: string[]; isEditing: boolean; onChange: (v: string[]) => void }) {
  if (isEditing) {
    return (
      <div className="space-y-1">
        {items.map((item, i) => (
          <input
            key={i}
            className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
            value={item}
            onChange={e => {
              const updated = [...items]
              updated[i] = e.target.value
              onChange(updated)
            }}
          />
        ))}
      </div>
    )
  }
  return (
    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}
