import { NextResponse } from 'next/server'

export async function GET () {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim())
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: hasUrl ? 'ok' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon ? 'ok' : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: hasServiceRole ? 'ok' : 'missing',
    OPENAI_API_KEY: hasOpenAI ? 'ok' : 'missing'
  })
}
