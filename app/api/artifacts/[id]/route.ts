import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { loadEnv } from '@/lib/load-env'

export async function PATCH (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  loadEnv()
  const { id } = await params

  let body: { content_json?: unknown; observations?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const contentJson = body?.content_json
  const hasContent = contentJson != null && typeof contentJson === 'object'
  if (!hasContent && body?.observations === undefined) {
    return NextResponse.json({ error: 'Incluye content_json u observations' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('artifacts')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Artefacto no encontrado' }, { status: 404 })
  }

  const updates: { content_json?: unknown; observations?: string; updated_at: string } = {
    updated_at: new Date().toISOString()
  }
  if (hasContent) updates.content_json = contentJson
  const observationsValue = body?.observations !== undefined ? String(body.observations).trim() : undefined
  if (observationsValue !== undefined) updates.observations = observationsValue

  let result = await supabase
    .from('artifacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (result.error) {
    const isMissingColumn = result.error.code === '42703' ||
      String(result.error.message).toLowerCase().includes('observations')
    if (isMissingColumn && observationsValue !== undefined) {
      const { data: current } = await supabase
        .from('artifacts')
        .select('content_json')
        .eq('id', id)
        .single()
      const base = typeof current?.content_json === 'object' && current?.content_json != null
        ? (current.content_json as Record<string, unknown>)
        : {}
      const merged = { ...base, _observations: observationsValue }
      const contentToSave = hasContent
        ? { ...(contentJson as Record<string, unknown>), _observations: observationsValue }
        : merged
      result = await supabase
        .from('artifacts')
        .update({
          content_json: contentToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    }
  }

  if (result.error) {
    return NextResponse.json({ error: 'Error al actualizar el artefacto' }, { status: 500 })
  }

  const artifact = result.data as Record<string, unknown>
  if (artifact?.content_json && typeof artifact.content_json === 'object') {
    const c = artifact.content_json as Record<string, unknown>
    if (c._observations !== undefined) artifact.observations = String(c._observations)
  }
  return NextResponse.json({ ok: true, artifact })
}
