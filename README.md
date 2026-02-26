# PM AI Engine

Herramienta privada para subir contratos/SoW/RFP, extraer contexto estructurado y generar artefactos de gestión (Charter, Risk Register, Stakeholder Register, WBS/Backlog) alineados a PMBOK 8.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **TailwindCSS**
- **Supabase** (PostgreSQL, Storage)
- **OpenAI** (extracción de contexto y generación de artefactos)
- **docx** / **pdfkit** (export Word y PDF)

## Requisitos

- Node.js 18+
- Cuenta [Supabase](https://supabase.com) y [OpenAI](https://platform.openai.com)

## Setup

1. Clonar / abrir el proyecto y instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Rellenar `.env` con tus credenciales:

   - `OPENAI_API_KEY`: clave de OpenAI (para la fase de procesamiento).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key de Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key (solo en servidor; no exponer en cliente).

4. En Supabase:

   - Crear las tablas ejecutando en el SQL Editor, en orden: `supabase/migrations/001_initial.sql` y `supabase/migrations/002_artifacts_observations.sql`.
   - En **Storage**, crear un bucket llamado `documents` y marcarlo como **public** (o configurar políticas RLS según quieras).

5. Arrancar en desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Flujo

1. **Lista de proyectos** (`/projects`): ver, abrir, editar o eliminar proyectos.
2. **Nuevo proyecto** (`/projects/new`): subir PDF + metadatos (nombre, industria, duración, presupuesto, enfoque).
3. **Detalle del proyecto** (`/projects/[id]`): procesar el documento (extracción + estructuración con OpenAI) y generar artefactos.
4. **Artefactos**: Charter, Risk Register, Stakeholders, WBS. Edición inline, observaciones, export Word y PDF (01_Project-Charter, 02_Risk-register, etc.).

## Subir a GitHub

Antes del primer `git push`:

- **No se suben** (están en `.gitignore`):
  - **`.env`** y **`.env*.local`**: contienen API keys y secretos (OpenAI, Supabase). Quien clone el repo debe crear su propio `.env` desde `.env.example` y rellenar sus credenciales.
  - **`node_modules/`**: dependencias; se reinstalan con `npm install`.
  - **`.next/`**: build de Next.js; se regenera con `npm run build`.
  - **`agent-transcripts/`**, **`.cursor/`**, **`/assets/`**: datos locales del IDE; no forman parte del código.
- **Sí se sube**:
  - **`.env.example`**: plantilla con nombres de variables y placeholders (sin valores reales), para que otros sepan qué configurar.

Si en el pasado llegaste a commitear un `.env` o un `.env.example` con claves reales, revoca esas claves en OpenAI y Supabase y crea unas nuevas; no basta con borrarlas del repo después.

## Deploy (Vercel)

- Conectar el repo a Vercel y configurar las mismas variables de entorno.
- Asegurar que el bucket `documents` en Supabase sea accesible (políticas o público según tu criterio).
