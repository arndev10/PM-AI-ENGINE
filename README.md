# PM AI Engine

Herramienta privada para subir contratos/SoW/RFP, extraer contexto estructurado y generar artefactos de gestión (Charter, Risk Register, Stakeholder Register, WBS/Backlog) alineados a PMBOK 8.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **TailwindCSS**
- **Supabase** (PostgreSQL, Storage)
- **OpenAI** (fase de procesamiento, siguiente iteración)

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

   - Crear las tablas ejecutando el contenido de `supabase/migrations/001_initial.sql` en el SQL Editor.
   - En **Storage**, crear un bucket llamado `documents` y marcarlo como **public** (o configurar políticas RLS según quieras).

5. Arrancar en desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Flujo actual (MVP en iteración)

1. **Nuevo proyecto** (`/projects/new`): subir PDF + metadatos (nombre, industria, duración, presupuesto, enfoque).
2. **Upload**: se crea el proyecto en Supabase, el PDF se guarda en Storage y se registra en `documents`.
3. **Detalle del proyecto** (`/projects/[id]`): ver proyecto; siguiente paso será “Procesar” (extracción + estructuración) y generación de artefactos.

## Próximos pasos

- Endpoint `/api/process`: extracción de texto del PDF + estructuración con OpenAI → guardar `structured_context_json`.
- Pantalla de artefactos: Charter, Risk Register, Stakeholder Register, WBS/Backlog (generar y editar).
- Export Word y PDF.

## Deploy (Vercel)

- Conectar el repo a Vercel y configurar las mismas variables de entorno.
- Asegurar que el bucket `documents` en Supabase sea accesible (políticas o público según tu criterio).
