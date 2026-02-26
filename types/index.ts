export type DocumentType = 'contract' | 'sow' | 'rfp' | 'annex'
export type Methodology = 'predictivo' | 'agil' | 'hibrido'
export type ArtifactType = 'charter' | 'risk_register' | 'stakeholder_register' | 'wbs' | 'backlog'

export interface StructuredContext {
  project_name: string
  document_type: DocumentType
  language: 'es' | 'en'
  scope_summary: string
  deliverables: Array<{ name: string; description: string; evidence?: string }>
  obligations: string[]
  sla: string[]
  penalties: string[]
  milestones: string[]
  payment_terms: string[]
  constraints: string[]
  assumptions: string[]
  risks_raw: Array<{ description: string; evidence?: string }>
  stakeholders_raw: Array<{ role: string; interest: string; evidence?: string }>
}

export interface Project {
  id: string
  name: string
  industry: string
  duration_estimate: string
  budget_estimate: string
  methodology: Methodology
  structured_context_json: StructuredContext | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_size_bytes: number
  parsed_text: string | null
  page_count: number | null
  created_at: string
}

export interface CharterContent {
  project_name: string
  scope_summary: string
  objectives: string[]
  deliverables: Array<{ name: string; description: string }>
  milestones: Array<{ name: string; date_estimate?: string }>
  constraints: string[]
  assumptions: string[]
  budget_summary: string
  duration_summary: string
  stakeholders: Array<{ role: string; responsibility: string }>
  approval_criteria: string[]
}

export interface RiskRow {
  id: number
  description: string
  probability: 'alta' | 'media' | 'baja'
  impact: 'alto' | 'medio' | 'bajo'
  severity: 'critico' | 'alto' | 'medio' | 'bajo'
  mitigation: string
  owner: string
  status: 'abierto' | 'mitigado' | 'cerrado'
}

export interface RiskRegisterContent {
  risks: RiskRow[]
}

export interface StakeholderRow {
  id: number
  name_role: string
  interest: string
  influence: 'alta' | 'media' | 'baja'
  engagement_strategy: string
}

export interface StakeholderRegisterContent {
  stakeholders: StakeholderRow[]
}

export interface WBSTask {
  id: string
  name: string
  children?: WBSTask[]
}

export interface WBSContent {
  phases: WBSTask[]
}

export type ArtifactContent =
  | CharterContent
  | RiskRegisterContent
  | StakeholderRegisterContent
  | WBSContent

export interface Artifact {
  id: string
  project_id: string
  type: ArtifactType
  content_json: ArtifactContent
  observations?: string
  created_at: string
  updated_at: string
}

export interface ProjectMetadata {
  name: string
  industry: string
  duration_estimate: string
  budget_estimate: string
  methodology: Methodology
}
