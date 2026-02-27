# PM AI Engine – Pasos a seguir

Orden recomendado para tener la app funcionando (local + deploy).

---

## 1. Supabase (base de datos y almacenamiento)

1. Entra en Supabase e inicia sesión.
2. **New project**: nombre (ej. `pm-ai-engine`), contraseña de la BD, región. Crear.
3. Cuando esté listo, ve a **Project Settings** → **API**.
   - Anota **Project URL**.
   - Anota **anon public** (Project API keys).
   - Anota **service_role** (secret; no la compartas).
4. **SQL Editor** → New query → pega todo el contenido de `supabase/migrations/001_initial.sql` → **Run**.
   - Debe crear las tablas `projects`, `documents`, `artifacts`.
5. **Storage** → **New bucket**:
   - Name: `documents`.
   - Public bucket: **ON** (para que la app pueda leer las URLs de los PDFs).
   - Create bucket.

---

## 2. Variables de entorno (local)

1. En la raíz del proyecto crea `.env` (o copia `.env.example`).
2. Rellena con los valores de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

OPENAI_API_KEY=
```

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL del paso 1.3.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public.
- `SUPABASE_SERVICE_ROLE_KEY` = service_role.
- `OPENAI_API_KEY` lo usarás cuando implementes `/api/process`; puede quedar vacío por ahora.

3. Guarda el archivo. **No subas `.env` a GitHub** (ya está en `.gitignore`).

---

## 3. Probar en local

1. En la raíz del proyecto:

```bash
npm install
npm run dev
```

2. Abre `http://localhost:3000`.
3. **Nuevo proyecto** → sube un PDF y completa metadatos → **Crear proyecto y subir**.
4. Si todo está bien, te redirige al detalle del proyecto. Si ves error en rojo, revisa que Supabase (paso 1) y `.env` (paso 2) estén correctos.

---

## 4. GitHub (código)

1. Crea un repo en GitHub (ej. `pm-ai-engine`). No inicialices con README si ya tienes código local.
2. En la carpeta del proyecto (si aún no es un repo git):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pm-ai-engine.git
git push -u origin main
```

3. Si ya era un repo:

```bash
git add .
git commit -m "Setup PM AI Engine"
git push -u origin main
```

4. Comprueba que `.env` no esté en el repo (`git status` no debe listarlo).

---

## 5. Vercel (deploy de la app)

1. Entra en Vercel e inicia sesión (puedes usar “Continue with GitHub”).
2. **Add New** → **Project** → importa el repo de GitHub (ej. `pm-ai-engine`).
3. **Configure Project**: deja el framework en Next.js y **Deploy**.
4. Cuando termine el deploy, entra al proyecto en Vercel → **Settings** → **Environment Variables**.
5. Añade las mismas variables que en `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Opcional por ahora) `OPENAI_API_KEY`
6. **Save** y haz un **Redeploy** para que tome las variables.
7. Abre la URL que te da Vercel (ej. `https://pm-ai-engine.vercel.app`) y prueba de nuevo **Nuevo proyecto** y subir un PDF.

---

## 6. Resumen del flujo

| Paso | Qué haces                          | Dónde      |
|------|------------------------------------|-----------|
| 1    | Crear proyecto, tablas y bucket    | Supabase  |
| 2    | Poner URL y keys de Supabase       | `.env`    |
| 3    | Probar subida de PDF               | Localhost |
| 4    | Subir código                       | GitHub    |
| 5    | Conectar repo y configurar env     | Vercel    |

