import OpenAI from 'openai'
import type { StructuredContext } from '@/types'

const MAX_CHARS = 28000

const STRUCTURE_PROMPT = `Eres un asistente que analiza documentos de proyectos (contratos, SoW, RFP) y extrae información estructurada.

Analiza el siguiente texto extraído de un PDF y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin comentarios):
{
  "project_name": "string (nombre del proyecto si aparece, o resumen en pocas palabras)",
  "document_type": "contract" | "sow" | "rfp" | "annex",
  "language": "es" | "en",
  "scope_summary": "string (resumen del alcance en 1-3 párrafos)",
  "deliverables": [{"name": "string", "description": "string", "evidence": "string (cláusula o sección de referencia)"}],
  "obligations": ["string"],
  "sla": ["string"],
  "penalties": ["string"],
  "milestones": ["string"],
  "payment_terms": ["string"],
  "constraints": ["string"],
  "assumptions": ["string"],
  "risks_raw": [{"description": "string", "evidence": "string"}],
  "stakeholders_raw": [{"role": "string", "interest": "string", "evidence": "string"}]
}

Reglas: Usa arrays vacíos [] si no encuentras datos para un campo. evidence puede ser vacío. language debe ser "es" o "en" según el idioma del documento. document_type infiérelo del contenido. Responde solo con el JSON.`

export async function structureWithOpenAI (
  text: string,
  projectName: string,
  apiKey: string
): Promise<StructuredContext> {
  const openai = new OpenAI({ apiKey })
  const chunk = text.slice(0, MAX_CHARS)
  if (text.length > MAX_CHARS) {
    console.warn(`structureWithOpenAI: text truncated from ${text.length} to ${MAX_CHARS} chars`)
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: STRUCTURE_PROMPT },
      { role: 'user', content: `Nombre del proyecto (metadato): ${projectName}\n\n---\nTexto del documento:\n\n${chunk}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  })

  const raw = res.choices[0]?.message?.content
  if (!raw) throw new Error('OpenAI no devolvió contenido')

  const parsed = JSON.parse(raw) as Record<string, unknown>

  return {
    project_name: typeof parsed.project_name === 'string' ? parsed.project_name : projectName,
    document_type: ['contract', 'sow', 'rfp', 'annex'].includes(String(parsed.document_type)) ? parsed.document_type as StructuredContext['document_type'] : 'contract',
    language: parsed.language === 'en' ? 'en' : 'es',
    scope_summary: typeof parsed.scope_summary === 'string' ? parsed.scope_summary : '',
    deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables.map((d: unknown) => {
      const o = d as Record<string, unknown>
      return { name: String(o?.name ?? ''), description: String(o?.description ?? ''), evidence: String(o?.evidence ?? '') }
    }) : [],
    obligations: Array.isArray(parsed.obligations) ? parsed.obligations.map((o: unknown) => String(o)) : [],
    sla: Array.isArray(parsed.sla) ? parsed.sla.map((s: unknown) => String(s)) : [],
    penalties: Array.isArray(parsed.penalties) ? parsed.penalties.map((p: unknown) => String(p)) : [],
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones.map((m: unknown) => String(m)) : [],
    payment_terms: Array.isArray(parsed.payment_terms) ? parsed.payment_terms.map((p: unknown) => String(p)) : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map((c: unknown) => String(c)) : [],
    assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map((a: unknown) => String(a)) : [],
    risks_raw: Array.isArray(parsed.risks_raw) ? parsed.risks_raw.map((r: unknown) => {
      const o = r as Record<string, unknown>
      return { description: String(o?.description ?? ''), evidence: String(o?.evidence ?? '') }
    }) : [],
    stakeholders_raw: Array.isArray(parsed.stakeholders_raw) ? parsed.stakeholders_raw.map((s: unknown) => {
      const o = s as Record<string, unknown>
      return { role: String(o?.role ?? ''), interest: String(o?.interest ?? ''), evidence: String(o?.evidence ?? '') }
    }) : []
  }
}
