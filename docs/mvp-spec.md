# PM AI Engine – Spec técnica MVP

Alcance técnico del MVP: flujo, datos, endpoints y orden de implementación.

---

## Flujo de usuario

1. **Subir documento**: PDF (contrato, SoW, RFP, anexo).
2. **Metadatos**: tipo de proyecto (IT, Telecom, Construcción, etc.), duración estimada, presupuesto, enfoque (Predictivo / Ágil / Híbrido), idioma si no se detecta.
3. **Procesar**: extracción → estructuración (JSON) → guardar en Supabase.
4. **Ver/editar artefactos**: Charter, Risk Register, Stakeholder Register, WBS o Backlog (por pestañas o secciones).
5. **Exportar**: Word (.docx) y/o PDF por artefacto o conjunto.

---

## Modelo de datos (Supabase)

### `projects`

| Campo | Tipo | Notas |
|-------|------|--------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | Nombre del proyecto |
| industry | text | IT, Telecom, Construcción, etc. |
| duration_estimate | text | Ej. "6 meses" |
| budget_estimate | text | Ej. "100k USD" |
| methodology | text | predictivo \| agil \| hibrido |
| structured_context_json | jsonb | JSON núcleo (scope, deliverables, risks, etc.) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `documents`

| Campo | Tipo | Notas |
|-------|------|--------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| file_name | text | Nombre original |
| file_url | text | Ruta en Supabase Storage |
| file_size_bytes | int | |
| parsed_text | text | Texto extraído (opcional, para debug) |
| page_count | int | |
| created_at | timestamptz | |

### `artifacts` (opcional para MVP)

Para guardar versiones editadas de cada artefacto (Charter, Risk, etc.) y no regenerar siempre.

| Campo | Tipo | Notas |
|-------|------|--------|
| id | uuid | PK |
| project_id | uuid | FK |
| type | text | charter \| risk_register \| stakeholder_register \| wbs \| backlog |
| content_json | jsonb | Contenido editable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## JSON estructurado (núcleo)

Salida de la etapa “estructuración”; se guarda en `projects.structured_context_json`.

```json
{
  "project_name": "",
  "document_type": "contract | sow | rfp | annex",
  "language": "es | en",
  "scope_summary": "",
  "deliverables": [{ "name": "", "description": "", "evidence": "" }],
  "obligations": [],
  "sla": [],
  "penalties": [],
  "milestones": [],
  "payment_terms": [],
  "constraints": [],
  "assumptions": [],
  "risks_raw": [{ "description": "", "evidence": "" }],
  "stakeholders_raw": [{ "role": "", "interest": "", "evidence": "" }]
}
```

Incluir `evidence` (o `source_sections`) donde aplique para trazabilidad.

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/upload | Recibe PDF; guarda en Storage; crea `documents`; devuelve `document_id`. |
| POST | /api/process | Recibe `document_id` + metadatos (industry, duration, budget, methodology). Extrae texto, estructura (1 llamada OpenAI), guarda proyecto + JSON. Devuelve `project_id`. |
| GET | /api/projects/[id] | Devuelve proyecto + structured_context_json. |
| POST | /api/generate-artifact | Recibe `project_id` + `type` (charter \| risk_register \| stakeholder_register \| wbs \| backlog). Usa JSON en BD; 1 llamada por tipo; guarda en `artifacts` si existe tabla. |
| GET | /api/projects/[id]/artifacts | Lista artefactos del proyecto. |
| PUT | /api/artifacts/[id] | Actualiza contenido editable del artefacto. |
| POST | /api/export/word | Recibe `project_id` + `artifact_type` (o varios); devuelve .docx. |
| POST | /api/export/pdf | Recibe `project_id` + `artifact_type`; devuelve PDF. |

---

## Orden de implementación sugerido

1. Repo: Next.js 14 (App Router), TypeScript, Tailwind, Supabase client.
2. Supabase: proyecto, tablas `projects`, `documents`; Storage bucket para PDFs.
3. `/api/upload`: subida a Storage + fila en `documents`.
4. Extracción: librería (ej. `pdf-parse`) en servidor; límite ~150 páginas.
5. `/api/process`: llamada estructuración OpenAI → guardar en `projects`.
6. UI: pantalla “Nuevo proyecto” (upload + metadatos) y “Procesar”.
7. Pantalla proyecto: mostrar JSON resumido y botones “Generar Charter”, etc.
8. `/api/generate-artifact`: un tipo por vez; prompts por tipo; guardar en `artifacts` o en estado.
9. UI: pestañas Charter, Risk Register, Stakeholder Register, WBS/Backlog; edición en formularios.
10. Export Word: librería `docx` por artefacto.
11. Export PDF: según elección (ej. @react-pdf/renderer o html → PDF).
12. Cache: reutilizar `structured_context_json` para regenerar artefactos sin re-parsear.

---

## Dependencias clave (npm)

- `@supabase/supabase-js` – cliente Supabase.
- `pdf-parse` o `pdfjs-dist` – extracción de texto PDF.
- `openai` – SDK oficial OpenAI.
- `docx` – generación de .docx.
- Para PDF: `@react-pdf/renderer` o `jspdf` + `html2canvas` (MVP).

---

## Variables de entorno

Ver `.env.example`. No commitear `.env`; en Vercel configurar las mismas variables.

