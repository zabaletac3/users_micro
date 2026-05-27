# Project Work Instructions

## 🚫 FORBIDDEN TOOL: Read
**NEVER use the `Read` tool to explore, understand or navigate code.**
`Read` is blocked by policy in this project. Reading files directly wastes tokens
when CodeGraphContext is already indexed.

## 🚫 ALSO FORBIDDEN
- NO Shell with grep, find, ls, cat, head, tail, awk to explore code
- NO LSP tools (documentSymbol, goToDefinition, findReferences)
- If CodeGraphContext is offline → stop and notify the user instead of using
  high-cost alternative tools

## ✅ MANDATORY TOOL: CodeGraphContext (cgc)
For ANY task related to understanding code, ALWAYS use CodeGraphContext tools
in this order of preference:

### To search code
- `find_code` → find functions, classes, methods by name
- `analyze_code_relationships` → understand callers/callees, inheritance, dependencies

### To understand architecture
- `execute_cypher_query` → advanced graph queries
- `analyze_code_relationships` with type=`dependencies` or `callers`
- `list_indexed_repositories` → see what is indexed

### For quality and technical debt
- `find_dead_code` → functions with no callers
- `calculate_cyclomatic_complexity` → cyclomatic complexity
- `find_most_complex_functions` → most complex functions

### To keep the graph updated
- `add_code_to_graph` → index new code
- `watch_directory` → real-time file watching

## ⚠️ When you CAN use Read (explicit exceptions)
Only in these specific cases, and you must justify it:
1. The user explicitly asks to see the literal content of a file.
2. You need to read a one-off config file (`.env.example`, `Dockerfile`)
   that is NOT in the graph and has NO code logic.
3. You need to read a generated file (log, JSON output) that was never indexed.

In any other case: **use CodeGraphContext.**

## 📖 Reading file content (last resort)
If the graph does not capture what you need (imports, top-level constants,
arrow functions outside functions):
1. First index with `add_code_to_graph`
2. Query with `execute_cypher_query`
3. Only if still incomplete → use `mcp__smart-tree__read` with `expand_all: true`
4. NEVER use the native `Read` tool

## 🔄 Standard workflow
When the user asks anything about the code, follow this flow:
1. `find_code` to locate the relevant element
2. `analyze_code_relationships` to understand context and dependencies
3. Answer based on the graph, without reading files directly
4. If you need something the graph does not have → ask the user before using Read

# Lideris Microservice Standards

Technical standards and guidelines for Lideris NestJS microservices.

## Tech Stack
- **Framework**: NestJS (Fastify)
- **Database**: Mongoose (MongoDB)
- **Validation**: Joi (NEVER class-validator)
- **Queues**: BullMQ (Redis)
- **Communication**: REST + gRPC + Kafka
- **Package Manager**: pnpm

## NON-NEGOTIABLE Rules

### Language
EVERYTHING in English — file names, variable names, class names, enum values,
i18n keys, event codes, comments, and documentation. NO Spanish anywhere in code.

### @shared — ALWAYS use the shared folder
ALL cross-cutting artifacts MUST live in `src/shared/`, imported via `@shared/*`.
NEVER place these inside a module folder:

| Artifact | Location | Alias |
|----------|----------|-------|
| Enums | `src/shared/enums/` | `@shared/enums` |
| Schemas | `src/shared/schemas/` | `@shared/schemas` |
| DTOs | `src/shared/dto/{module}/` | `@shared/dto/{module}` |
| Interfaces | `src/shared/interfaces/` | `@shared/interfaces` |
| Constants | `src/shared/constants/` | `@shared/constants` |

Modules only contain: `providers/`, `controllers/`, `gateways/`,
`joi-validations.ts`, `{name}.module.ts`. Never `interfaces/`, `schemas/`,
or `enums/` inside a module.

### Pagination
Use `skip` and `limit`. NEVER use `page`.

### Validation
- Body: `@UsePipes(new Pipes.JoiValidationPipe(schema))`
- Query: `@UsePipes(new JoiQueryValidationPipe(schema))`

### Company Context
Use `@Decorators.CurrentCompanyId()` from `lideris-commoms-microservice`.

### riskScore in @TraceEvent
NEVER hardcode `riskScore`. Computed automatically by `TraceService`.

### Architecture
- Controllers: Presentation only, no business logic.
- Services: Business logic and data access.
- Types: Prefer `unknown` with type guards over `any`.

### Controller naming
- REST: `{name}.controller.ts`
- Kafka/events: `{name}.event.controller.ts`
- gRPC: `{name}.grpc.controller.ts`

## Core Commands
- **Dev**: `pnpm run start:dev`
- **Build**: `pnpm run build`
- **Test**: `pnpm run test`
- **Lint**: `pnpm run lint`
- **Format**: `pnpm run format`