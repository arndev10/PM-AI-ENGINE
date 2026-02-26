import OpenAI from 'openai'
import type {
  ArtifactType,
  StructuredContext,
  CharterContent,
  RiskRegisterContent,
  StakeholderRegisterContent,
  WBSContent,
  ArtifactContent,
  ProjectMetadata
} from '@/types'

const PROMPTS: Record<ArtifactType, string> = {
  charter: `Genera un Project Charter basado en el contexto del proyecto.
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "project_name": "string",
  "scope_summary": "string (2-3 párrafos)",
  "objectives": ["string"],
  "deliverables": [{"name": "string", "description": "string"}],
  "milestones": [{"name": "string", "date_estimate": "string o null"}],
  "constraints": ["string"],
  "assumptions": ["string"],
  "budget_summary": "string",
  "duration_summary": "string",
  "stakeholders": [{"role": "string", "responsibility": "string"}],
  "approval_criteria": ["string"]
}`,

  risk_register: `Genera un Risk Register basado en el contexto del proyecto.
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "risks": [{
    "id": number,
    "description": "string",
    "probability": "alta" | "media" | "baja",
    "impact": "alto" | "medio" | "bajo",
    "severity": "critico" | "alto" | "medio" | "bajo",
    "mitigation": "string",
    "owner": "string",
    "status": "abierto"
  }]
}
Genera al menos 5-10 riesgos relevantes al proyecto. severity se calcula de probability x impact.`,

  stakeholder_register: `Genera un Stakeholder Register basado en el contexto del proyecto.
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "stakeholders": [{
    "id": number,
    "name_role": "string (nombre o rol del interesado)",
    "interest": "string (su interés principal en el proyecto)",
    "influence": "alta" | "media" | "baja",
    "engagement_strategy": "string (cómo gestionarlo)"
  }]
}
Genera al menos 5 stakeholders relevantes.`,

  wbs: `Genera un WBS (Work Breakdown Structure) basado en el contexto del proyecto.
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "phases": [{
    "id": "1",
    "name": "string (nombre de la fase)",
    "children": [{
      "id": "1.1",
      "name": "string (entregable o paquete de trabajo)",
      "children": [{
        "id": "1.1.1",
        "name": "string (tarea)"
      }]
    }]
  }]
}
Organiza en fases, entregables y tareas. Usa numeración jerárquica (1, 1.1, 1.1.1).`,

  backlog: `Genera un Product Backlog basado en el contexto del proyecto.
Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "phases": [{
    "id": "1",
    "name": "string (épica o tema)",
    "children": [{
      "id": "1.1",
      "name": "string (historia de usuario o feature)",
      "children": [{
        "id": "1.1.1",
        "name": "string (tarea o sub-tarea)"
      }]
    }]
  }]
}
Organiza en épicas, historias de usuario y tareas.`
}

const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  charter: 'Project Charter',
  risk_register: 'Risk Register',
  stakeholder_register: 'Stakeholder Register',
  wbs: 'WBS',
  backlog: 'Product Backlog'
}

function buildUserMessage (
  context: StructuredContext,
  meta: ProjectMetadata,
  type: ArtifactType
): string {
  return `Proyecto: ${meta.name}
Industria: ${meta.industry}
Duración estimada: ${meta.duration_estimate}
Presupuesto estimado: ${meta.budget_estimate}
Metodología: ${meta.methodology}

Contexto estructurado del documento:
${JSON.stringify(context, null, 2)}

Genera el artefacto: ${ARTIFACT_LABELS[type]}`
}

export async function generateArtifact (
  context: StructuredContext,
  meta: ProjectMetadata,
  type: ArtifactType,
  apiKey: string
): Promise<ArtifactContent> {
  const openai = new OpenAI({ apiKey })

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROMPTS[type] },
      { role: 'user', content: buildUserMessage(context, meta, type) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })

  const raw = res.choices[0]?.message?.content
  if (!raw) throw new Error('OpenAI no devolvió contenido')

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`OpenAI devolvió JSON inválido: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('OpenAI no devolvió un objeto JSON')

  switch (type) {
    case 'charter':
      return validateCharter(parsed)
    case 'risk_register':
      return validateRiskRegister(parsed)
    case 'stakeholder_register':
      return validateStakeholderRegister(parsed)
    case 'wbs':
    case 'backlog':
      return validateWBS(parsed)
  }
}

function validateCharter (data: Record<string, unknown>): CharterContent {
  return {
    project_name: String(data.project_name ?? ''),
    scope_summary: String(data.scope_summary ?? ''),
    objectives: asStringArray(data.objectives),
    deliverables: Array.isArray(data.deliverables)
      ? data.deliverables.map((d: Record<string, unknown>) => ({
          name: String(d?.name ?? ''),
          description: String(d?.description ?? '')
        }))
      : [],
    milestones: Array.isArray(data.milestones)
      ? data.milestones.map((m: Record<string, unknown>) => ({
          name: String(m?.name ?? ''),
          date_estimate: m?.date_estimate ? String(m.date_estimate) : undefined
        }))
      : [],
    constraints: asStringArray(data.constraints),
    assumptions: asStringArray(data.assumptions),
    budget_summary: String(data.budget_summary ?? ''),
    duration_summary: String(data.duration_summary ?? ''),
    stakeholders: Array.isArray(data.stakeholders)
      ? data.stakeholders.map((s: Record<string, unknown>) => ({
          role: String(s?.role ?? ''),
          responsibility: String(s?.responsibility ?? '')
        }))
      : [],
    approval_criteria: asStringArray(data.approval_criteria)
  }
}

function validateRiskRegister (data: Record<string, unknown>): RiskRegisterContent {
  const risks = Array.isArray(data.risks) ? data.risks : []
  return {
    risks: risks.map((r: Record<string, unknown>, i: number) => ({
      id: typeof r.id === 'number' ? r.id : i + 1,
      description: String(r.description ?? ''),
      probability: asEnum(r.probability, ['alta', 'media', 'baja'], 'media') as RiskRegisterContent['risks'][0]['probability'],
      impact: asEnum(r.impact, ['alto', 'medio', 'bajo'], 'medio') as RiskRegisterContent['risks'][0]['impact'],
      severity: asEnum(r.severity, ['critico', 'alto', 'medio', 'bajo'], 'medio') as RiskRegisterContent['risks'][0]['severity'],
      mitigation: String(r.mitigation ?? ''),
      owner: String(r.owner ?? ''),
      status: asEnum(r.status, ['abierto', 'mitigado', 'cerrado'], 'abierto') as RiskRegisterContent['risks'][0]['status']
    }))
  }
}

function validateStakeholderRegister (data: Record<string, unknown>): StakeholderRegisterContent {
  const stakeholders = Array.isArray(data.stakeholders) ? data.stakeholders : []
  return {
    stakeholders: stakeholders.map((s: Record<string, unknown>, i: number) => ({
      id: typeof s.id === 'number' ? s.id : i + 1,
      name_role: String(s.name_role ?? s.name ?? s.role ?? ''),
      interest: String(s.interest ?? ''),
      influence: asEnum(s.influence, ['alta', 'media', 'baja'], 'media') as StakeholderRegisterContent['stakeholders'][0]['influence'],
      engagement_strategy: String(s.engagement_strategy ?? s.strategy ?? '')
    }))
  }
}

function validateWBS (data: Record<string, unknown>): WBSContent {
  const phases = Array.isArray(data.phases) ? data.phases : []
  return { phases: phases.map(normalizeWBSNode) }
}

function normalizeWBSNode (node: Record<string, unknown>): { id: string; name: string; children?: Array<{ id: string; name: string; children?: unknown[] }> } {
  const result: { id: string; name: string; children?: Array<{ id: string; name: string; children?: unknown[] }> } = {
    id: String(node.id ?? ''),
    name: String(node.name ?? '')
  }
  if (Array.isArray(node.children) && node.children.length > 0) {
    result.children = node.children.map(normalizeWBSNode)
  }
  return result
}

function asStringArray (val: unknown): string[] {
  return Array.isArray(val) ? val.map((v: unknown) => String(v)) : []
}

function asEnum (val: unknown, allowed: string[], fallback: string): string {
  const s = String(val ?? '').toLowerCase()
  return allowed.includes(s) ? s : fallback
}
