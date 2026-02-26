import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat
} from 'docx'
import type { Artifact, ArtifactType } from '@/types'

const US_LETTER_WIDTH = 12240
const US_LETTER_HEIGHT = 15840
const MARGIN = 1440
const CONTENT_WIDTH = US_LETTER_WIDTH - MARGIN * 2

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 }

function par (text: string, heading?: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    ...(heading && { heading })
  })
}

function tableCell (text: string, opts: { bold?: boolean; width?: number; shading?: boolean } = {}) {
  return new TableCell({
    borders: BORDERS,
    margins: CELL_MARGINS,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading ? { fill: 'D9E2F3', type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold })] })]
  })
}

function buildTable (
  columnWidths: number[],
  headerRow: string[],
  dataRows: string[][]
) {
  const width = columnWidths.reduce((a, b) => a + b, 0)
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map((h, i) =>
          tableCell(h, { bold: true, width: columnWidths[i], shading: true })
        )
      }),
      ...dataRows.map(row =>
        new TableRow({
          children: row.map((cellText, i) =>
            tableCell(cellText, { width: columnWidths[i] })
          )
        })
      )
    ]
  })
}

export async function artifactToDocxBuffer (artifact: Artifact): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []
  const title = artifactTitle(artifact.type)

  children.push(par(title, HeadingLevel.HEADING_1))
  children.push(new Paragraph({ text: '' }))

  switch (artifact.type) {
    case 'charter': {
      const c = artifact.content_json
      children.push(par(c.project_name, HeadingLevel.HEADING_2))
      children.push(par(c.scope_summary))
      children.push(par('Objetivos', HeadingLevel.HEADING_2))
      c.objectives.forEach(o =>
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun(o)]
        }))
      )
      children.push(par('Entregables', HeadingLevel.HEADING_2))
      const delCols = [3276, 6084]
      children.push(buildTable(
        delCols,
        ['Nombre', 'Descripción'],
        c.deliverables.map(d => [d.name, d.description])
      ))
      children.push(par('Hitos', HeadingLevel.HEADING_2))
      const mileCols = [3744, 5616]
      children.push(buildTable(
        mileCols,
        ['Hito', 'Fecha estimada'],
        c.milestones.map(m => [m.name, m.date_estimate ?? ''])
      ))
      children.push(par('Restricciones', HeadingLevel.HEADING_2))
      c.constraints.forEach(x =>
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun(x)]
        }))
      )
      children.push(par('Supuestos', HeadingLevel.HEADING_2))
      c.assumptions.forEach(x =>
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun(x)]
        }))
      )
      children.push(par('Presupuesto', HeadingLevel.HEADING_2))
      children.push(par(c.budget_summary))
      children.push(par('Duración', HeadingLevel.HEADING_2))
      children.push(par(c.duration_summary))
      children.push(par('Stakeholders', HeadingLevel.HEADING_2))
      const stCols = [3276, 6084]
      children.push(buildTable(
        stCols,
        ['Rol', 'Responsabilidad'],
        c.stakeholders.map(s => [s.role, s.responsibility])
      ))
      children.push(par('Criterios de aprobación', HeadingLevel.HEADING_2))
      c.approval_criteria.forEach(x =>
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun(x)]
        }))
      )
      break
    }
    case 'risk_register': {
      const r = artifact.content_json
      const riskCols = [400, 2500, 800, 800, 800, 1800, 1000, 1260]
      children.push(buildTable(
        riskCols,
        ['#', 'Descripción', 'Prob.', 'Impacto', 'Severidad', 'Mitigación', 'Owner', 'Estado'],
        r.risks.map(risk => [
          String(risk.id),
          risk.description,
          risk.probability,
          risk.impact,
          risk.severity,
          risk.mitigation,
          risk.owner,
          risk.status
        ])
      ))
      break
    }
    case 'stakeholder_register': {
      const s = artifact.content_json
      const stkCols = [500, 2000, 700, 800, 5360]
      children.push(buildTable(
        stkCols,
        ['#', 'Rol / Nombre', 'Interés', 'Influencia', 'Estrategia'],
        s.stakeholders.map(sh => [
          String(sh.id),
          sh.name_role,
          sh.interest,
          sh.influence,
          sh.engagement_strategy
        ])
      ))
      break
    }
    case 'wbs':
    case 'backlog': {
      const w = artifact.content_json
      function addPhase (
        phase: { id: string; name: string; children?: Array<{ id: string; name: string; children?: unknown[] }> },
        indent = 0
      ) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${phase.id} ${phase.name}`, bold: indent === 0 })],
          indent: { left: indent * 720 }
        }))
        phase.children?.forEach((ch: { id: string; name: string; children?: unknown[] }) =>
          addPhase(ch, indent + 1)
        )
      }
      w.phases.forEach(ph => addPhase(ph))
      break
    }
  }

  const doc = new Document({
    title,
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 24 } }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 }
        }
      ]
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: US_LETTER_WIDTH, height: US_LETTER_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
        }
      },
      children
    }]
  })

  return Packer.toBuffer(doc)
}

function artifactTitle (type: ArtifactType): string {
  const t: Record<ArtifactType, string> = {
    charter: 'Project Charter',
    risk_register: 'Risk Register',
    stakeholder_register: 'Stakeholder Register',
    wbs: 'WBS',
    backlog: 'Product Backlog'
  }
  return t[type]
}
