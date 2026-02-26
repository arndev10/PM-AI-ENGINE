import Link from 'next/link'

export default function HomePage () {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-800">
          PM AI Engine
        </h1>
        <p className="mt-2 text-slate-600">
          Sube un contrato, SoW o RFP y genera artefactos de gestión (Charter, Risk Register, Stakeholder Register, WBS/Backlog) alineados a PMBOK 8.
        </p>
      </section>
      <section className="flex flex-wrap gap-4">
        <Link
          href="/projects/new"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuevo proyecto
        </Link>
        <Link
          href="/projects"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver proyectos
        </Link>
      </section>
    </div>
  )
}
