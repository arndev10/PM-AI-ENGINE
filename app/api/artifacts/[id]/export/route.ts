import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { loadEnv } from '@/lib/load-env'
import { artifactToDocxBuffer } from '@/lib/export/build-docx'
import { artifactToPdfBuffer } from '@/lib/export/build-pdf'
import type { Artifact } from '@/types'

const EXPORT_FILENAMES: Record<string, string> = {
  charter: '01_Project-Charter',
  risk_register: '02_Risk-register',
  stakeholder_register: '03_Stakeholders',
  wbs: '04_WBS',
  backlog: '04_WBS'
}

function safeFilename (type: string): string {
  return EXPORT_FILENAMES[type] ?? 'artifact'
}

export async function GET (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  loadEnv()
  const { id } = await params
  const url = new URL(_request.url)
  const format = url.searchParams.get('format')

  if (format !== 'docx' && format !== 'pdf') {
    return NextResponse.json(
      { error: 'format debe ser docx o pdf' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !artifact) {
    return NextResponse.json({ error: 'Artefacto no encontrado' }, { status: 404 })
  }

  const typed = artifact as Artifact
  const name = safeFilename(typed.type)

  try {
    if (format === 'docx') {
      const buffer = await artifactToDocxBuffer(typed)
      const body = new Uint8Array(buffer)
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${name}.docx"`,
          'Content-Length': String(body.length)
        }
      })
    }
    const buffer = await artifactToPdfBuffer(typed)
    const body = new Uint8Array(buffer)
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}.pdf"`,
        'Content-Length': String(body.length)
      }
    })
  } catch (e) {
    console.error('Export error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al exportar' },
      { status: 500 }
    )
  }
}
