# PM AI Engine – Preguntas de definición y sugerencias

Documento para cerrar alcance, prioridades y decisiones antes de construir. Incluye preguntas + feedback sobre tu brainstorm.

---

## 1. Usuario y contexto de uso

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 1.1 | ¿Solo tú usarás la app o planeas compartirla (ej. equipo, clientes)? | Solo yo / Equipo interno / Clientes externos → impacta auth, multi-tenant, roles. |
| 1.2 | ¿En qué idioma serán la mayoría de los contratos? | ES / EN / Ambos → impacta prompts, ejemplos y posible detección de idioma. |
| 1.3 | ¿Los PDFs serán siempre contratos/SoW o también RFPs, addendums, anexos? | Solo contrato/SoW / Incluir otros tipos → impacta el JSON estructurado y las plantillas de salida. |
| 1.4 | ¿Tamaño típico de los PDFs (páginas)? | <20 / 20–50 / 50–100 / >100 → impacta chunking, límites de API y estrategia de tokens. |

---

## 2. Alcance del MVP (30 días)

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 2.1 | ¿El MVP debe incluir **persistencia** desde el día 1 (Supabase + guardar proyectos) o primero “upload → procesar → descargar/ver” sin BD? | Con BD desde inicio / Sin BD en MVP → reduce complejidad inicial. |
| 2.2 | ¿Qué artefacto es **prioridad 1** para ti? | Charter / Risk Register / Stakeholder Register / WBS o Backlog → define el primer flujo end-to-end. |
| 2.3 | ¿Necesitas **edición** de los artefactos generados (en la UI) o solo visualización/export? | Solo ver y exportar / Editar y luego guardar/export → impacta si usas formularios o solo vista. |
| 2.4 | ¿Formato de salida del MVP? | Solo pantalla / PDF export / Word / Los tres → define dependencias (ej. lib para PDF). |

---

## 3. Contenido y alineación PMBOK 8

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 3.1 | ¿Quieres que los **8 Performance Domains** aparezcan explícitamente en la UI o en metadatos (ej. “este riesgo toca el dominio X”)? | Sí, visibles / Solo en lógica interna / No por ahora. |
| 3.2 | ¿Los **12 principios** del PMBOK 8 deben guiar los prompts (ej. “ser un líder colaborativo”) o prefieres enfocarte solo en dominios/artefactos? | Principios en prompts / Solo dominios y artefactos. |
| 3.3 | Para **WBS vs Backlog**: ¿criterio automático por “tipo de proyecto” o siempre preguntas “enfoque” (predictivo/ágil/híbrido) al usuario? | Solo pregunta usuario / Auto-sugerir por industria + confirmar. |
| 3.4 | ¿Quieres un **glosario** o “tipos de riesgo/entregable” alineados a PMBOK/PMI para dropdowns y consistencia? | Sí, listas fijas / No, todo libre texto por IA. |

---

## 4. Stack técnico y entorno

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 4.1 | ¿Ya tienes cuenta Supabase y OpenAI lista? | Sí / No → si no, habrá que incluir setup en el plan. |
| 4.2 | ¿Prefieres **TypeScript** en todo el proyecto (Next + API)? | Sí / Solo donde tenga sentido. |
| 4.3 | ¿Autenticación en MVP? | Sin auth (solo local) / Supabase Auth (email o magic link) / OAuth (Google, etc.). |
| 4.4 | ¿Manejo de **errores** y reintentos con OpenAI (rate limits, timeouts)? | Básico (toast/msg) / Retry + cola / Solo mensaje por ahora. |

---

## 5. IA y optimización de tokens

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 5.1 | ¿Límite de **tokens por documento** que estás dispuesto a consumir en una corrida (aprox)? | Ej. “máx 50k input” para definir si mandas todo el doc o solo chunks. |
| 5.2 | ¿Quieres **cache** de “contexto estructurado” (el JSON base) para no re-parsear el mismo PDF en cada generación? | Sí, desde MVP / En fase 2. |
| 5.3 | ¿Modelo por defecto? | gpt-4o / gpt-4o-mini / gpt-3.5-turbo → equilibrio costo/calidad. |
| 5.4 | ¿Una sola llamada “megaprompt” (contrato + instrucción) o **pipeline** (extraer JSON → luego N llamadas por artefacto)? | Megaprompt / Pipeline (recomendado para tokens y control). |

---

## 6. UX y flujo

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 6.1 | Flujo principal: ¿wizard paso a paso (1. Subir → 2. Metadatos → 3. Procesar → 4. Ver artefactos) o una sola pantalla con secciones? | Wizard / Una pantalla / Híbrido. |
| 6.2 | ¿Mostrar el **JSON estructurado** al usuario (para transparencia/debug) o oculto? | Visible en “avanzado” / Oculto. |
| 6.3 | ¿Notificaciones cuando termine un artefacto (ej. generación en background)? | Sí / No en MVP. |

---

## 7. Fase 2 (RAG) – solo para anotar

| # | Pregunta | Opciones / Notas |
|---|----------|------------------|
| 7.1 | ¿Idioma de las **consultas** en RAG? | Mismo que contrato / Siempre español / Siempre inglés. |
| 7.2 | ¿RAG sobre solo el contrato actual o también sobre artefactos generados (Charter, riesgos, etc.)? | Solo contrato / Contrato + artefactos. |

---

## Sugerencias y feedback al brainstorm

### Lo que está muy bien definido

- **JSON estructurado** como núcleo: buena idea; evita re-enviar el PDF entero en cada prompt.
- **Pipeline** (extracción → estructuración → generación por artefacto): alineado con optimización de tokens.
- **Supabase** (Postgres + Storage + vector después): coherente y escalable.
- **Next.js App Router + API Routes**: suficiente para MVP y Vercel.

### Sugerencias concretas

1. **MVP sin BD al inicio (opción)**  
   Si el objetivo es “en 30 días tener Charter + Risk + Stakeholder desde un PDF”, puedes hacer: upload → parse → JSON en memoria → 3 llamadas a la API → mostrar en pantalla y “Descargar PDF”. Añadir Supabase en la semana 3–4 cuando el flujo estable.

2. **Nomenclatura de endpoints**  
   Mantener consistencia: o todo en kebab-case (`/api/parse-contract`) o todo en camelCase. Tu lista ya usa kebab-case; seguir así.

3. **`/api/upload` vs `/api/parse-contract`**  
   Decidir si “upload” solo guarda el archivo y “parse-contract” recibe `document_id` o si “upload" hace upload + parse en uno. Recomendación: upload devuelve `file_url`/`document_id`, y un solo endpoint “process” o “parse-contract” que recibe ese id + metadatos (tipo proyecto, duración, etc.) y devuelve el JSON. Así separas almacenamiento de lógica.

4. **Estructura del JSON**  
   Añadir algo como `source_sections` o `evidence` (p.ej. “cláusula 4.2”) para cada campo importante. Ayuda a auditoría y a que el usuario confíe en la salida (“de dónde salió esto”).

5. **WBS vs Backlog en MVP**  
   Dejar “WBS o Backlog” para el final del MVP (después de Charter, Risk, Stakeholder). Es el más dependiente del resto y el más complejo de evaluar bien.

6. **Performance Domains en UI**  
   En Risk Register, un tag por dominio (ej. “Planning”, “Stakeholders”) da valor sin mucho esfuerzo y muestra alineación con PMBOK 8.

7. **Variables de entorno**  
   Desde el inicio: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Un `.env.example` en el repo (sin valores) para que el setup sea claro.

---

## Próximo paso sugerido

Responder al menos las preguntas de las secciones **1**, **2** y **4** (usuario, alcance MVP, stack/auth). Con eso se puede:

1. Escribir una **especificación corta** (1–2 páginas) del MVP.
2. Definir **historias de usuario** o tareas para el primer sprint.
3. Armar la **estructura del repo** (Next.js, carpetas, env) y el primer flujo: upload → parse → pantalla de resultado.

