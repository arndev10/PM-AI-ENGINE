# Configuración de .env y Supabase

Si al subir un PDF ves **"Error en el servidor"** o **"Faltan variables de Supabase"**, sigue estos pasos.

## 1. Crear `.env` en la raíz del proyecto

Copia el ejemplo y rellena los valores:

```bash
cp .env.example .env
```

## 2. Variables obligatorias para subir PDF

Edita `.env` y completa:

```env
# Supabase (obligatorio para upload)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (lo usarás cuando implementes /api/process)
OPENAI_API_KEY=
```

- **NEXT_PUBLIC_SUPABASE_URL**: en Supabase → tu proyecto → Settings → API → Project URL.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: mismo menú → Project API keys → `anon` public.
- **SUPABASE_SERVICE_ROLE_KEY**: mismo menú → `service_role` (secret). No lo expongas en el cliente.

## 3. Base de datos en Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecuta el contenido de:

`supabase/migrations/001_initial.sql`

Así se crean las tablas `projects`, `documents` y `artifacts`.

## 4. Bucket de Storage en Supabase

En **Storage** → **New bucket**:

- Name: `documents`
- Public bucket: **sí** (para poder leer la URL del PDF después), o configura RLS si prefieres restringir.

Si el bucket no existe, al subir un PDF verás un error tipo "Bucket not found" o "Error al subir el archivo".

## 5. Reiniciar el servidor de desarrollo

Después de cambiar `.env`:

```bash
# Detener (Ctrl+C) y volver a arrancar
npm run dev
```

---

Con esto, al subir un PDF la app debería crear el proyecto, subir el archivo a Storage y registrar el documento. Si sigue fallando, el mensaje en rojo en el formulario debería indicar el motivo (falta de variables, bucket, tabla, etc.).

