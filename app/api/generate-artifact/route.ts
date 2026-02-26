import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { generateArtifact } from '@/lib/openai/generate-artifact'
import { loadEnv } from '@/lib/load-env'
import type { ArtifactType, StructuredContext, ProjectMetadata } from '@/types'

const VALID_TYPES: ArtifactType[] = ['charter', 'risk_register', 'stakeholder_register', 'wbs', 'backlog']

export async function POST (request: Request) {
  loadEnv()

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'Falta OPENAI_API_KEY' }, { status: 503 })
  }

  let projectId: string
  let artifactType: ArtifactType
  try {
    const body = await request.json()
    projectId = body?.project_id
    artifactType = body?.artifact_type
    if (!projectId || !artifactType) {
      return NextResponse.json({ error: 'project_id y artifact_type son obligatorios' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(artifactType)) {
      return NextResponse.json({ error: `artifact_type inválido: ${artifactType}` }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, name, industry, duration_estimate, budget_estimate, methodology, structured_context_json')
    .eq('id', projectId)
    .single()

  if (projErr || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const context = project.structured_context_json as StructuredContext | null
  if (!context) {
    return NextResponse.json({ error: 'El proyecto no tiene contexto estructurado. Procesa el documento primero.' }, { status: 400 })
  }

  const meta: ProjectMetadata = {
    name: project.name,
    industry: project.industry,
    duration_estimate: project.duration_estimate,
    budget_estimate: project.budget_estimate,
    methodology: project.methodology
  }

  let content
  try {
    content = await generateArtifact(context, meta, artifactType, apiKey)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('generateArtifact error:', e)
    return NextResponse.json({ error: `Error al generar artefacto: ${msg}` }, { status: 500 })
  }

  const { data: artifact, error: upsertErr } = await supabase
    .from('artifacts')
    .upsert(
      {
        project_id: projectId,
        type: artifactType,
        content_json: content,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'project_id,type' }
    )
    .select()
    .single()

  if (upsertErr) {
    console.error('Upsert artifact error:', upsertErr)
    return NextResponse.json({ error: 'Error al guardar el artefacto' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, artifact })
}
