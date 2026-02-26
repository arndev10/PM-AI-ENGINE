import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { loadEnv } from '@/lib/load-env'

const BUCKET = 'documents'

export async function PATCH (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  loadEnv()
  const { id: projectId } = await params
  if (!projectId) {
    return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
  }

  let body: { name?: string; duration_estimate?: string; budget_estimate?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (body.name !== undefined) updates.name = String(body.name).trim() || 'Sin nombre'
  if (body.duration_estimate !== undefined) updates.duration_estimate = String(body.duration_estimate).trim()
  if (body.budget_estimate !== undefined) updates.budget_estimate = String(body.budget_estimate).trim()
  updates.updated_at = new Date().toISOString()

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: 'Incluye al menos name, duration_estimate o budget_estimate' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Error al actualizar' },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true, project: data })
}

export async function DELETE (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  loadEnv()
  const { id: projectId } = await params
  if (!projectId) {
    return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: project, error: fetchErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (fetchErr || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(projectId, { limit: 500 })

  if (files?.length) {
    const paths = files.map(f => `${projectId}/${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }

  const { error: deleteErr } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (deleteErr) {
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? deleteErr.message : 'Error al eliminar' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
