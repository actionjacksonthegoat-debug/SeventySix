---
agent: agent
description: Scaffold a complete new client-side Angular domain
---

# Scaffold Client Domain

Create a new client-side Angular domain following the blueprint in `.github/instructions/new-domain.instructions.md`.

## MCP Tools

- Use **context7** to fetch up-to-date Angular, TanStack Query, and Angular Material API docs before generating code

## Gather Requirements

Ask the user for:

1. **Domain name** (e.g., "billing", "notifications")
2. **Initial entity name** (e.g., "Invoice", "Notification")
3. **Requires route guards?** (default: yes — `passwordChangeGuard()` + `roleGuard()`)
4. **Has corresponding server API?** (default: yes — regenerate OpenAPI types)

## Then Create ALL Files

Follow the **Client Checklist** from `new-domain.instructions.md`:

1. Create route file with lazy loading and guards
2. Create service with `@Injectable()` (NO `providedIn: 'root'`)
3. Create page component (`OnPush`, signal inputs, `inject()` DI)
4. Create feature components
5. Create models (type aliases from OpenAPI generated types)
6. Create constants file
7. Create testing mock factories
8. Create barrel exports (`index.ts`)

## Wiring

1. Add path alias `@{new-domain}/*` to `tsconfig.json`
2. Add lazy route in `app.routes.ts` with `canMatch` guards
3. Register services at route level via `providers: [...]`
4. Regenerate OpenAPI types if new API endpoints: `npm run generate:openapi`

## Validation

Run `ng build` — must be zero warnings.
Create `.spec.ts` tests using `withZonelessTesting()`.
