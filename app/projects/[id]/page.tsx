import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import ProcessDocumentButton from './ProcessDocumentButton'
import ArtifactTabs from './ArtifactTabs'
import ProjectHeader from './ProjectHeader'
import ProjectRefreshOnEnter from './ProjectRefreshOnEnter'
import type { Artifact } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage ({ params }: { params: Promise<{ id: string }> }) {
  unstable_noStore()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, industry, duration_estimate, budget_estimate, methodology, structured_context_json, created_at')
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const hasContext = project.structured_context_json != null

  let artifacts: Artifact[] = []
  if (hasContext) {
    const { data } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', id)
      .order('created_at')
    artifacts = (data ?? []) as Artifact[]
  }

  return (
    <div className="space-y-8">
      <ProjectHeader
        projectId={project.id}
        name={project.name || 'Sin nombre'}
        industry={project.industry}
        durationEstimate={project.duration_estimate}
        budgetEstimate={project.budget_estimate}
      />

      {!hasContext && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Documento subido</p>
          <p className="mt-1 text-sm">
            Procesa el documento para extraer el texto del PDF y preparar el contexto. Luego podrás generar los artefactos (Charter, Risk Register, etc.).
          </p>
          <div className="mt-4">
            <ProcessDocumentButton projectId={id} />
          </div>
        </div>
      )}

      {hasContext && (
        <>
          <ProjectRefreshOnEnter />
          <ArtifactTabs projectId={id} initialArtifacts={artifacts} />
        </>
      )}
    </div>
  )
}
