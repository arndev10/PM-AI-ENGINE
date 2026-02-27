# PM AI Engine

AI-powered tool for uploading contracts, SoWs or RFPs, extracting structured project context, and generating PM artefacts aligned with PMBOK® 8.

## Features

- **Document ingestion**: upload contracts, SoWs or RFPs in PDF.
- **AI context extraction**: structure key project information using OpenAI.
- **PM artefact generation**: Project Charter, Risk Register, Stakeholder Register, WBS/Backlog.
- **Inline editing**: adjust artefacts, key fields and observations directly in the UI.
- **Export**: download artefacts as Word (.docx) and PDF with consistent filenames.
- **Supabase-backed storage**: persist projects, artefacts and observations.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS  
- **Backend**: Next.js API routes (Node.js 18, TypeScript)  
- **Database**: Supabase (PostgreSQL, Storage buckets)  
- **AI & Export**: OpenAI API, `docx`, `pdfkit`  

## Setup

### Web app (Next.js + Supabase + OpenAI)

```bash
# Clone the repository
git clone <REPO_URL>
cd pm-ai-engine

# Install dependencies
npm install

# Environment variables (Windows example)
copy .env.example .env

# Edit .env and set:
# OPENAI_API_KEY=
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# Prepare Supabase (run in Supabase SQL editor)
# 1) supabase/migrations/001_initial.sql
# 2) supabase/migrations/002_artifacts_observations.sql

# Run the development server
npm run dev
```

- The app runs at `http://localhost:3000`.

## Project Structure

```bash
pm-ai-engine/
  app/                         # Next.js App Router entrypoints
    api/                       # HTTP API routes (upload, projects, artefacts, export)
    projects/                  # Project list, detail and creation pages
      [id]/                    # Project detail, artefacts view/edit
      new/                     # New project creation flow
  lib/                         # Shared server/client utilities
    openai/                    # OpenAI integration and document structuring
    export/                    # Word/PDF generation helpers
    supabase/                  # Supabase client and helpers
  types/                       # Shared TypeScript types (project, artefacts, context)
  supabase/
    migrations/                # SQL migrations for PostgreSQL schema
  docs/                        # Additional documentation (definition, setup, MVP notes)
  public/                      # Static assets
  .env.example                 # Example environment variables
  package.json                 # NPM scripts and dependencies
  next.config.js               # Next.js configuration
  tailwind.config.ts           # Tailwind CSS configuration
  tsconfig.json                # TypeScript configuration
  .eslintrc.json               # ESLint configuration
```

## License

This project is licensed under the MIT License.

