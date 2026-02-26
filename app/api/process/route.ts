import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { structureWithOpenAI } from '@/lib/openai/structure-document'
import { loadEnv } from '@/lib/load-env'
import type { StructuredContext } from '@/types'

const MAX_PDF_PAGES = Number(process.env.NEXT_PUBLIC_MAX_PDF_PAGES) || 150

function stubContext (projectName: string): StructuredContext {
  return {
    project_name: projectName || 'Sin nombre',
    document_type: 'contract',
    language: 'es',
    scope_summary: 'Texto extraído. Sin OPENAI_API_KEY no se estructura con IA.',
    deliverables: [],
    obligations: [],
    sla: [],
    penalties: [],
    milestones: [],
    payment_terms: [],
    constraints: [],
    assumptions: [],
    risks_raw: [],
    stakeholders_raw: []
  }
}

async function extractTextFromPdf (buffer: ArrayBuffer): Promise<{ text: string; numpages: number }> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const strings = content.items
      .filter((item: Record<string, unknown>) => 'str' in item)
      .map((item: Record<string, unknown>) => item.str as string)
    pages.push(strings.join(' '))
  }
  await doc.destroy()
  return { text: pages.join('\n'), numpages: doc.numPages }
}

export async function POST (request: Request) {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    return NextResponse.json(
      { error: 'Faltan variables de Supabase.' },
      { status: 503 }
    )
  }

  let projectId: string
  try {
    const body = await request.json()
    projectId = body?.project_id
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'project_id es obligatorio' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, file_url')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (docsError || !documents?.length) {
    return NextResponse.json({ error: 'No hay documento asociado al proyecto' }, { status: 404 })
  }

  const doc = documents[0]
  let buffer: ArrayBuffer
  try {
    const res = await fetch(doc.file_url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      const text = await res.text()
      const preview = text.slice(0, 200)
      throw new Error(`La URL no devolvió un PDF (content-type: ${contentType}). Preview: ${preview}`)
    }
    buffer = await res.arrayBuffer()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo descargar el PDF'
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'No se pudo descargar el PDF' },
      { status: 502 }
    )
  }

  let text: string
  let numpages: number
  const isDev = process.env.NODE_ENV === 'development'
  try {
    const result = await extractTextFromPdf(buffer)
    text = result.text
    numpages = result.numpages
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (isDev) console.error('PDF extract error:', e)
    return NextResponse.json(
      {
        error: isDev
          ? `No se pudo extraer texto del PDF: ${message}. El PDF puede tener imágenes y texto; si es solo escaneado (imágenes), no hay texto extraíble.`
          : 'No se pudo extraer texto del PDF. El PDF puede tener imágenes y texto; si es solo escaneado (imágenes), no hay texto extraíble.'
      },
      { status: 500 }
    )
  }

  if (numpages > MAX_PDF_PAGES) {
    return NextResponse.json(
      { error: `El PDF supera el límite de ${MAX_PDF_PAGES} páginas` },
      { status: 400 }
    )
  }

  const { error: updateDocError } = await supabase
    .from('documents')
    .update({ parsed_text: text.slice(0, 500000), page_count: numpages })
    .eq('id', doc.id)

  if (updateDocError) {
    return NextResponse.json({ error: 'Error al guardar el texto extraído' }, { status: 500 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  let structuredContext: StructuredContext
  if (apiKey?.trim()) {
    try {
      structuredContext = await structureWithOpenAI(text, project.name || 'Sin nombre', apiKey.trim())
    } catch (e) {
      console.error('OpenAI structure error:', e)
      return NextResponse.json(
        { error: 'Error al estructurar con OpenAI. Revisa OPENAI_API_KEY y el texto del PDF.' },
        { status: 500 }
      )
    }
  } else {
    structuredContext = stubContext(project.name || 'Sin nombre')
  }

  const { error: updateProjError } = await supabase
    .from('projects')
    .update({
      structured_context_json: structuredContext,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (updateProjError) {
    return NextResponse.json({ error: 'Error al actualizar el proyecto' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    page_count: numpages,
    text_length: text.length
  })
}
