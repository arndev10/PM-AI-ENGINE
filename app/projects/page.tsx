import Link from 'next/link'

export default function ProjectsListPage () {
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
          Listado de proyectos. Con Supabase conectado verás aquí tus proyectos.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        <p>Conecta Supabase y ejecuta las migraciones para ver los proyectos.</p>
        <Link href="/projects/new" className="mt-4 inline-block text-slate-800 underline hover:no-underline">
          Crear nuevo proyecto
        </Link>
      </div>
    </div>
  )
}
