import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'documents'
const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15 MB
const ALLOWED_TYPES = ['application/pdf']
const isDev = process.env.NODE_ENV === 'development'

export async function POST (request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: 'Faltan variables de Supabase. Añade NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env (copia .env.example).'
      },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = (formData.get('name') as string)?.trim() ?? 'Sin nombre'
    const industry = (formData.get('industry') as string)?.trim() ?? ''
    const duration_estimate = (formData.get('duration_estimate') as string)?.trim() ?? ''
    const budget_estimate = (formData.get('budget_estimate') as string)?.trim() ?? ''
    const methodology = (formData.get('methodology') as string) ?? 'hibrido'

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Falta el archivo PDF' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite (15 MB)' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        industry,
        duration_estimate,
        budget_estimate,
        methodology: ['predictivo', 'agil', 'hibrido'].includes(methodology) ? methodology : 'hibrido',
        structured_context_json: null
      })
      .select('id')
      .single()

    if (projectError || !project) {
      const msg = isDev && projectError ? projectError.message : 'Error al crear el proyecto. ¿Ejecutaste la migración SQL en Supabase?'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${project.id}/${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      await supabase.from('projects').delete().eq('id', project.id)
      const msg = isDev && uploadError.message ? uploadError.message : 'Error al subir el archivo. ¿Creaste el bucket "documents" en Supabase Storage?'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const file_url = urlData.publicUrl

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        project_id: project.id,
        file_name: file.name,
        file_url,
        file_size_bytes: file.size
      })
      .select('id')
      .single()

    if (docError || !doc) {
      await supabase.storage.from(BUCKET).remove([path])
      await supabase.from('projects').delete().eq('id', project.id)
      const msg = isDev && docError ? docError.message : 'Error al registrar el documento. ¿Existe la tabla documents?'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ project_id: project.id, document_id: doc.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error en el servidor'
    if (isDev) console.error('Upload error:', e)
    return NextResponse.json(
      { error: isDev ? message : 'Error en el servidor' },
      { status: 500 }
    )
  }
}
