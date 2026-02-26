import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage ({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="space-y-8">
      <div>
        <Link href="/projects" className="text-sm text-slate-600 hover:text-slate-800">
          ← Proyectos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          {project.name || 'Sin nombre'}
        </h1>
        <p className="mt-1 text-slate-600">
          {project.industry && `${project.industry} · `}
          {project.duration_estimate && `${project.duration_estimate} · `}
          {project.budget_estimate && project.budget_estimate}
        </p>
      </div>

      {!hasContext && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Documento subido</p>
          <p className="mt-1 text-sm">
            El siguiente paso es procesar el documento (extracción + estructuración) para generar el contexto y luego los artefactos. El endpoint <code className="rounded bg-amber-100 px-1">/api/process</code> estará disponible en la siguiente iteración.
          </p>
        </div>
      )}

      {hasContext && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800">Artefactos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Genera o edita Charter, Risk Register, Stakeholder Register y WBS/Backlog. (UI en siguiente iteración.)
          </p>
        </section>
      )}
    </div>
  )
}
