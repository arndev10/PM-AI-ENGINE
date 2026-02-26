# PM AI Engine – Decisiones tomadas y recomendaciones

Resumen de tus respuestas + recomendaciones aplicadas. Sirve como referencia única para el build.

---

## 1. Usuario y contexto

| Tema | Decisión | Nota |
|------|----------|------|
| Quién usa | Solo tú ahora; futuro SaaS para vender | Código y BD preparados para multi-usuario después (auth, tenant). |
| Idiomas | ES y EN | Detección de idioma en documento; prompts/UI en ambos. |
| Tipos de documento | Contrato, SoW, RFP, anexos | JSON y prompts genéricos; tipo de doc como metadato. |
| Tamaño PDF | **Recomendación: hasta ~80–100 páginas** | Por encima: chunking obligatorio; límite configurable (ej. 150 páginas máx). |

---

## 2. Alcance MVP

| Tema | Decisión | Nota |
|------|----------|------|
| Base de datos | Supabase desde día 1 | Deploy en Vercel; solo tus credenciales; un “tenant” implícito (tú). |
| Artefactos | Todos (Charter, Risk, Stakeholder, WBS/Backlog) | Orden de implementación: Charter → Risk → Stakeholder → WBS/Backlog. |
| Edición | **Recomendación: sí, editable** | Ver + editar en UI; export Word/PDF refleja lo editado. Mejor para “entregar y seguir editando”. |
| Salida | Pantalla + export PDF y Word | Word obligatorio para edición posterior; PDF para presentación. |

---

## 3. PMBOK 8 (recomendaciones aplicadas)

| Tema | Decisión | Nota |
|------|----------|------|
| Performance Domains | **Recomendación: visibles en UI** | Tags en Risk Register (y donde aplique); refuerza estándar y valor. |
| Principios | **Recomendación: en prompts, no en UI** | Los 12 principios guían el tono y criterios de la IA; no hace falta mostrarlos. |
| WBS vs Backlog | Sugerencia por tipo de proyecto | Por industria/enfoque se sugiere WBS o Backlog; usuario puede cambiar. |
| Glosario/tipos | **Recomendación: listas alineadas a PMBOK** | Dropdowns para tipo de riesgo, categorías, etc.; salida más consistente. |

---

## 4. Stack y Auth

### ¿Qué es Auth?

**Auth = Autenticación**: quién puede entrar a la app (usuario y contraseña, magic link, Google, etc.).

- **Ahora**: solo tú, con tus credenciales en Vercel → no hace falta pantalla de “login”; la app es privada por URL y variables de entorno.
- **Cuando sea SaaS**: cada cliente tendrá su cuenta (Supabase Auth: email + contraseña o magic link). El código puede preparar “un usuario” desde ya (tabla `users` o `profiles`) sin pantalla de login en el MVP.

**Decisión**: MVP sin pantalla de login; arquitectura lista para añadir Supabase Auth cuando quieras vender.

### Stack recomendado

| Capa | Elección | Motivo |
|------|----------|--------|
| Lenguaje | **TypeScript en todo** | Menos bugs, mejor refactor, mejor DX en Next + Supabase. |
| Frontend | Next.js 14+ (App Router), TailwindCSS | Ya lo tenías; ideal para Vercel. |
| Backend | API Routes en Next.js | Un solo deploy; serverless. |
| BD | Supabase (PostgreSQL) | Ya decidido; Storage + Auth listos para fase 2. |
| IA | OpenAI API | Extracción y generación; un solo proveedor para simplificar. |
| Export Word | **docx** (npm) | Generar .docx desde el JSON/HTML; editable. |
| Export PDF | **react-pdf** o **puppeteer** / **@react-pdf/renderer** | O servidor: **Puppeteer** en Vercel (con límites) o API externa. Alternativa: **jsPDF** + html2canvas para MVP. |

---

## 5. IA: pipeline vs una sola llamada grande

### Opción A – Una sola llamada “megaprompt”

- Envías: PDF (o texto completo) + “Genera Charter, Risk Register y Stakeholder Register”.
- **Problema**: el contrato puede ser 50–100k tokens; una sola llamada es cara y puede exceder contexto. Además, si falla, pierdes todo.

### Opción B – Pipeline (recomendada)

1. **Extracción**: el texto del PDF se parsea (sin IA o con IA ligera si hace falta).
2. **Estructuración**: una llamada a la IA con el texto (o por chunks) → **un solo JSON** (project_name, scope, deliverables, risks, stakeholders, etc.).
3. **Generación por artefacto**: con ese JSON (mucho más pequeño que el PDF) haces **una llamada por artefacto** (Charter, Risk Register, Stakeholder, WBS).

**Ventajas**:  
- Ahorras tokens: el contrato completo solo se usa 1 vez; el resto son llamadas con JSON (pocos miles de tokens).  
- Si un artefacto falla, solo reintentas ese.  
- Puedes cachear el JSON y regenerar solo un artefacto sin volver a leer el PDF.

**Resumen**: **Pipeline es mejor para ahorrar tokens y tener control.**

---

## 6. Extracción: ¿OpenAI o no?

- **Solo parsing (pdf-parse, pdfjs, etc.)**: extraer texto del PDF sin IA. Rápido y barato; suficiente si el PDF es texto seleccionable.
- **OpenAI para extracción**: útil si hay tablas complejas, escaneos con OCR, o quieres “entender” secciones ambiguas. Más caro.

**Recomendación**:  
- **MVP**: extracción por **librería** (ej. `pdf-parse` o `pdfjs-dist`) en el servidor.  
- Si el resultado es malo (PDF escaneado, muchas tablas), añadir **una llamada a OpenAI** solo para “limpiar o estructurar” el texto extraído (o para chunkes problemáticos).  
- La **estructuración** (texto → JSON) sí con **OpenAI**: es donde la IA aporta valor.

---

## 7. Cache del JSON

**Sí. Cachear el JSON es la mejor forma de evitar re-runs costosos.**

- Primera vez: upload → parse → estructuración (1 llamada) → guardas el JSON en Supabase (proyecto + documento).
- Siguientes veces: si el usuario pide “regenerar solo el Risk Register” o “añadir WBS”, **reutilizas el JSON**; no vuelves a leer el PDF ni a hacer la llamada de estructuración.
- Incluso si sube el mismo PDF en otro proyecto: puedes (en fase 2) detectar “mismo hash de archivo” y ofrecer reutilizar contexto.

**Decisión**: Cache del JSON desde el MVP (guardado en BD al terminar “parse/estructuración”).

---

## 8. Resumen de recomendaciones aceptadas

- TypeScript en todo el proyecto.  
- Pipeline: extracción (lib) → estructuración (1 llamada → JSON) → N llamadas por artefacto.  
- Cache del JSON en Supabase; regenerar artefactos sin re-parsear.  
- Extracción con librería; OpenAI para estructuración y generación.  
- Artefactos editables en UI; export Word (prioridad) y PDF.  
- Performance Domains visibles en UI (ej. tags en riesgos).  
- Principios PMBOK 8 en prompts, no en UI.  
- WBS/Backlog sugeridos por tipo de proyecto.  
- Auth: sin login en MVP; diseño listo para Supabase Auth cuando sea SaaS.  
- Límite de tamaño PDF: ~80–100 páginas por defecto; chunking para más.  
- Campos `source_sections` / `evidence` en el JSON donde aplique.

---

## 9. Próximo paso

Con esto se puede:

1. Escribir la **especificación técnica del MVP** (endpoints, modelos de datos, flujo).
2. Definir la **estructura del repo** (Next.js, carpetas, env).
3. Crear **.env.example** y un primer flujo (upload → parse → pantalla).

Si quieres, el siguiente mensaje puede ser: “arma la spec técnica y la estructura del proyecto” y lo genero en archivos concretos.
