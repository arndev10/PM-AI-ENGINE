import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import ProjectRowActions from './ProjectRowActions'

export const dynamic = 'force-dynamic'

interface ProjectRow {
  id: string
  name: string | null
  industry: string | null
  duration_estimate: string | null
  budget_estimate: string | null
  methodology: string | null
  created_at: string
}

export default async function ProjectsListPage () {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, industry, duration_estimate, budget_estimate, methodology, created_at')
    .order('created_at', { ascending: false })

  const projects: ProjectRow[] = data ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-800">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          Proyectos
        </h1>
        <p className="mt-1 text-slate-600">
          Listado de proyectos cargados desde Supabase.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>No se pudieron cargar los proyectos.</p>
        </div>
      )}

      {projects.length === 0 && !error && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          <p>No hay proyectos aún.</p>
          <Link href="/projects/new" className="mt-4 inline-block text-slate-800 underline hover:no-underline">
            Crear nuevo proyecto
          </Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-sm text-slate-600">
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
            </p>
            <Link
              href="/projects/new"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Nuevo proyecto
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {projects.map(project => (
              <li key={project.id} className="flex items-center justify-between gap-4 py-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="min-w-0 flex-1 hover:opacity-90"
                >
                  <span className="block text-sm font-medium text-slate-800 hover:text-slate-900">
                    {project.name || 'Sin nombre'}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[project.industry, project.duration_estimate, project.budget_estimate]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
                <span className="shrink-0 text-xs uppercase tracking-wide text-slate-400">
                  {project.methodology || 'híbrido'}
                </span>
                <ProjectRowActions
                  projectId={project.id}
                  projectName={project.name || 'Sin nombre'}
                  durationEstimate={project.duration_estimate}
                  budgetEstimate={project.budget_estimate}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
