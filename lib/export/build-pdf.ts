import PDFDocument from 'pdfkit'
import type { Artifact, ArtifactType } from '@/types'

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

export function artifactToPdfBuffer (artifact: Artifact): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const title = artifactTitle(artifact.type)
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'left' })
    doc.moveDown()

    switch (artifact.type) {
      case 'charter': {
        const c = artifact.content_json
        doc.fontSize(14).text(c.project_name)
        doc.moveDown(0.5)
        doc.fontSize(10).font('Helvetica').text(c.scope_summary)
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Objetivos')
        c.objectives.forEach(o => doc.font('Helvetica').fontSize(10).text(`• ${o}`))
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Entregables')
        c.deliverables.forEach(d => {
          doc.font('Helvetica').fontSize(10).text(`${d.name}: ${d.description}`)
        })
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Hitos')
        c.milestones.forEach(m =>
          doc.font('Helvetica').fontSize(10).text(`${m.name}${m.date_estimate ? ` – ${m.date_estimate}` : ''}`)
        )
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Restricciones')
        c.constraints.forEach(x => doc.font('Helvetica').fontSize(10).text(`• ${x}`))
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Supuestos')
        c.assumptions.forEach(x => doc.font('Helvetica').fontSize(10).text(`• ${x}`))
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Presupuesto')
        doc.font('Helvetica').fontSize(10).text(c.budget_summary)
        doc.moveDown(0.5)
        doc.fontSize(12).font('Helvetica-Bold').text('Duración')
        doc.font('Helvetica').fontSize(10).text(c.duration_summary)
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Stakeholders')
        c.stakeholders.forEach(s =>
          doc.font('Helvetica').fontSize(10).text(`${s.role}: ${s.responsibility}`)
        )
        doc.moveDown()
        doc.fontSize(12).font('Helvetica-Bold').text('Criterios de aprobación')
        c.approval_criteria.forEach(x => doc.font('Helvetica').fontSize(10).text(`• ${x}`))
        break
      }
      case 'risk_register': {
        const r = artifact.content_json
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('ID', 50, doc.y)
        doc.text('Descripción', 70, doc.y)
        doc.text('Prob.', 280, doc.y)
        doc.text('Impacto', 320, doc.y)
        doc.text('Severidad', 380, doc.y)
        doc.text('Mitigación', 440, doc.y)
        doc.text('Owner', 520, doc.y)
        doc.text('Estado', 570, doc.y)
        doc.moveDown(0.5)
        doc.font('Helvetica')
        r.risks.forEach(risk => {
          const y = doc.y
          doc.fontSize(9).text(String(risk.id), 50, y)
          doc.text(risk.description.slice(0, 35), 70, y)
          doc.text(risk.probability, 280, y)
          doc.text(risk.impact, 320, y)
          doc.text(risk.severity, 380, y)
          doc.text(risk.mitigation.slice(0, 15), 440, y)
          doc.text(risk.owner.slice(0, 10), 520, y)
          doc.text(risk.status, 570, y)
          doc.moveDown(0.4)
        })
        break
      }
      case 'stakeholder_register': {
        const s = artifact.content_json
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('Rol/Nombre', 50, doc.y)
        doc.text('Interés', 200, doc.y)
        doc.text('Influencia', 350, doc.y)
        doc.text('Estrategia', 420, doc.y)
        doc.moveDown(0.5)
        doc.font('Helvetica')
        s.stakeholders.forEach(sh => {
          doc.fontSize(9).text(sh.name_role, 50, doc.y)
          doc.text(sh.interest.slice(0, 25), 200, doc.y)
          doc.text(sh.influence, 350, doc.y)
          doc.text(sh.engagement_strategy.slice(0, 30), 420, doc.y)
          doc.moveDown(0.4)
        })
        break
      }
      case 'wbs':
      case 'backlog': {
        const w = artifact.content_json
        function addPhase (
          phase: { id: string; name: string; children?: Array<{ id: string; name: string; children?: unknown[] }> },
          indent = 0
        ) {
          doc.font('Helvetica').fontSize(indent === 0 ? 11 : 10)
          doc.text(`${'  '.repeat(indent)}${phase.id} ${phase.name}`)
          phase.children?.forEach((ch: { id: string; name: string; children?: unknown[] }) =>
            addPhase(ch, indent + 1)
          )
        }
        w.phases.forEach(ph => addPhase(ph))
        break
      }
    }

    doc.end()
  })
}
