import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { loadEnv } from '@/lib/load-env'

export async function GET (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  loadEnv()
  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: artifacts, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('project_id', id)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: 'Error al cargar artefactos' }, { status: 500 })
  }

  const mapped = (artifacts ?? []).map((a: Record<string, unknown>) => {
    if (a.observations === undefined && a.content_json && typeof a.content_json === 'object') {
      const c = a.content_json as Record<string, unknown>
      if (c._observations !== undefined) a.observations = String(c._observations)
    }
    return a
  })

  return NextResponse.json({ artifacts: mapped }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  })
}
