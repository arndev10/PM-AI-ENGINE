# Skills recomendados para PM AI Engine

Basado en [skills.sh](https://skills.sh/) y el stack del proyecto (Next.js, React, Supabase, PDF, export Word/PDF).

## Ya instalados

- **vercel-react-best-practices** – React y patrones recomendados por Vercel.
- **web-design-guidelines** – Guías de diseño web (UX/UI).

---

## Recomendados para este proyecto

### Next.js y Vercel

| Skill | Repo | Motivo |
|-------|------|--------|
| **next-best-practices** | `vercel-labs/next-skills` | Patrones y buenas prácticas de Next.js (App Router, data fetching, etc.). |
| **next-cache-components** | `vercel-labs/next-skills` | Uso de cache y componentes en Next. |
| **nextjs-app-router-patterns** | `wshobson/agents` | Patrones específicos del App Router. |

Instalación ejemplo:
```bash
npx skills add https://github.com/vercel-labs/next-skills --skill next-best-practices --yes
```

### Supabase

| Skill | Repo | Motivo |
|-------|------|--------|
| **supabase-postgres-best-practices** | `supabase/agent-skills` | Buenas prácticas con Postgres y Supabase (tablas, RLS, consultas). |

```bash
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices --yes
```

### Documentos (PDF, Word)

| Skill | Repo | Motivo |
|-------|------|--------|
| **pdf** | `anthropics/skills` | Trabajar con PDFs (extracción, generación). |
| **docx** | `anthropics/skills` | Generar/editar documentos Word (.docx) para export. |

```bash
npx skills add https://github.com/anthropics/skills --skill pdf --yes
npx skills add https://github.com/anthropics/skills --skill docx --yes
```

### UI y formularios

| Skill | Repo | Motivo |
|-------|------|--------|
| **frontend-design** | `anthropics/skills` | Diseño de interfaces y flujos. |
| **webapp-testing** | `anthropics/skills` | Testing de webapps (forms, flujos). |

### Otros útiles

| Skill | Repo | Motivo |
|-------|------|--------|
| **vercel-composition-patterns** | `vercel-labs/agent-skills` | Patrones de composición en apps React/Next. |
| **error-handling-patterns** | `wshobson/agents` | Manejo de errores y reintentos (API, OpenAI). |
| **api-design-principles** | `wshobson/agents` | Diseño de APIs (endpoints, respuestas). |

---

## Orden sugerido para añadir

1. **next-best-practices** – Base para todo el front/back con Next.
2. **supabase-postgres-best-practices** – Modelo de datos y consultas.
3. **pdf** y **docx** – Cuando implementes extracción de PDF y export Word.
4. **error-handling-patterns** y **api-design-principles** – Para `/api/process` y llamadas a OpenAI.

Los skills se instalan en `.agents/skills/` y Cursor los usa automáticamente cuando están disponibles.
