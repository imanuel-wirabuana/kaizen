# Agent Guidelines & Engineering Rules

This document outlines the architectural rules, coding standards, and project conventions for AI agents and developers working on the **Kaizen** codebase.

---

## 1. Core Architectural Rules

### 1.1 State Management: No React Context (Use Zustand)
- **Strict Ban on React Context for Application State**: Do **not** use `createContext` or `useContext` for global, domain, or UI state management.
- **Zustand as Single Source of Truth**: All shared state, active workspace state, session preferences, and cross-component communication must be managed using **Zustand** stores (`src/stores/`).
  - *Exception*: Third-party library providers required by external SDKs (such as Clerk's `<ClerkProvider>` or Base UI primitive contexts) are permissible only at the root level.
- **Selectors & Performance**: Always use granular selectors when consuming Zustand stores (e.g., `useWorkspaceStore((s) => s.activeWorkspace)`) to prevent unnecessary re-renders.
- **Persistence**: Utilize Zustand's `persist` middleware for state that should survive browser refreshes (e.g., selected workspace ID, theme mode).

### 1.2 Strict Separation of Concerns (SoC)
Organize code modularly by domain and responsibility:

```
src/
├── features/             # Feature-sliced modules (domain-driven)
│   ├── workspaces/       # Feature: Workspace creation, switching, management
│   │   ├── components/   # Feature-specific UI components
│   │   ├── hooks/        # Feature-specific hooks (React Query / subscriptions)
│   │   └── services/     # Feature-specific DB / API queries
│   ├── boards/           # Feature: Kanban boards & task items
│   ├── calendar/         # Feature: Calendar views & scheduling
│   ├── inbox/            # Feature: Notifications & inbox items
│   └── assistant/        # Feature: AI assistant & chat
├── services/             # Shared API & backend service clients (Supabase, Clerk, etc.)
│   ├── supabase/         # Supabase client, query builders, and realtime channels
│   └── api/              # External API integrations
├── stores/               # Zustand state stores (global UI, active workspace, modals)
│   ├── workspace-store.ts
│   └── ui-store.ts
├── hooks/                # Global reusable utility hooks (use-mobile, use-debounce, etc.)
├── components/
│   ├── ui/               # shadcn / Base UI primitives (buttons, dialogs, inputs, etc.)
│   └── layout/           # Global app shells (RootLayout, Sidebar, NavUser, Header)
├── types/                # Shared TypeScript contracts and database schemas
├── pages/                # Route entrypoints (thin wrappers delegating to features)
└── lib/                  # Utilities, formatters, and helpers
```

- **Keep Pages Thin**: Route pages in `src/pages/` should serve only as layout containers and coordinators. Business logic, data fetching, and rich UI elements belong in `src/features/` or `src/components/`.
- **Decouple Data Access**: UI components must never make direct ad-hoc Supabase queries or raw fetch calls. Always delegate database and API operations to `services/` or `features/*/services/`.

### 1.3 Maximum Library Utilization
Always leverage existing dependencies; never reinvent wheel components:
- **shadcn / Base UI (`src/components/ui/`)**: Always check and utilize existing primitives (`Button`, `Dialog`, `Command`, `Empty`, `Input`, `Textarea`, `Card`, `Badge`, `DropdownMenu`, `Tabs`, `Sidebar`, etc.) before creating custom HTML elements.
- **TanStack React Query**: Use React Query for server-side asynchronous state caching, refetching, mutations, and optimistic updates alongside Supabase.
- **Zustand**: Use for client-side synchronous state and UI orchestration.
- **Lucide React**: Use Lucide icons consistently.
- **Wouter**: Use Wouter (`Link`, `useRoute`, `useLocation`, `Switch`, `Route`, `Redirect`) for routing and navigation.
- **Tailwind CSS v4 & OKLCH Tokens**: Use semantic theme classes (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.) instead of hardcoded hex colors.

---

## 2. Directory & File Conventions

| Directory | Purpose | Allowed Responsibilities |
| :--- | :--- | :--- |
| `src/stores/` | Zustand stores | Client state, UI flags, active selections, action dispatchers |
| `src/services/` | Supabase & API services | DB CRUD queries, Supabase Realtime subscriptions, HTTP clients |
| `src/features/<name>/` | Feature domain modules | Domain components, feature queries/mutations, feature dialogs |
| `src/hooks/` | Global custom hooks | Reusable, cross-feature utility hooks (use-mobile, use-debounce, etc.) |
| `src/components/ui/` | Design system primitives | Reusable, unopinionated UI building blocks |
| `src/components/layout/` | Shell layouts | Sidebar, Topbar, RootLayout, User profile badge |
| `src/pages/` | Routing views | Page route containers rendered by Wouter router |
| `src/types/` | TypeScript types | Data models, DB schemas, request/response contracts |

---

## 3. Realtime & Supabase Conventions
- **Row Level Security (RLS)**: Ensure all Supabase tables enforce proper RLS policies.
- **Subscriptions**: Realtime listeners (`postgres_changes`) should be encapsulated within dedicated service functions or feature hooks, updating Zustand stores or invalidating React Query caches upon receiving events.
- **Soft Deletes**: Use `archived_at` for soft-deleting entities (e.g. workspaces, boards) rather than destructive hard deletes.

---

## 4. Clean Code Standards

Always adhere to clean code principles across the entire codebase:

### 4.1 Meaningful Naming & Self-Documenting Code
- Use intention-revealing, pronounceable, and searchable names for variables, functions, and components (e.g., `isWorkspaceArchived`, `fetchActiveWorkspacesRecord`, `CreateWorkspaceDialog`).
- Avoid cryptic abbreviations, Hungarian notation, or ambiguous single-letter identifiers.
- Boolean variables and predicates should begin with affirmative prefixes (`is`, `has`, `should`, `can`).

### 4.2 Functions & Components: Do One Thing Well (SRP)
- **Small & Focused**: Functions and React components should do one thing only and do it with minimal side effects.
- **Guard Clauses & Early Returns**: Flatten execution paths by exiting early on error or boundary conditions; avoid deeply nested `if/else` ladders.
- **Decompose Large Components**: When a component exceeds ~150–200 lines or manages multiple concerns, extract smaller subcomponents, custom hooks, or helper utilities.

### 4.3 Immutability & Functional Purity
- Treat all component props and Zustand state as strictly immutable. Always use non-mutating operations (`.map()`, `.filter()`, spread operator).
- Keep React render passes pure and idempotent: never execute impure calls (`Date.now()`, `Math.random()`, or direct mutations) during render.
- Keep business logic side effects isolated inside Zustand actions, service layers, or React Query mutations.

### 4.4 DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid)
- Do not duplicate data fetching queries or state manipulation logic. Abstract shared business logic into domain services or hooks.
- Favor simplicity over speculative over-engineering. Build what is needed now with clean extension points.

### 4.5 Zero Dead Code & Zero Magic Values
- Clean up unused variables, obsolete imports, commented-out dead code, and temporary debugging `console.log` statements before finalizing any change.
- Extract unexplained magic numbers, query strings, and timeout durations into well-named constants or config objects.

### 4.6 Robust Error Handling & Graceful Fallbacks
- Handle edge cases, empty states, and network exceptions gracefully with clear visual user feedback (empty states, toast notifications, inline alerts).
- Never fail silently; log structured errors in service layers and provide fallbacks in UI components.

---

## 5. Code Quality & Agent Workflow
1. **Plan First**: Always create a plan artifact or outline steps for complex refactoring or new feature additions before writing code.
2. **Type Safety**: Strictly avoid `any`. Ensure clean builds with `bun run typecheck` (`tsc --noEmit`) and `bun run build`.
3. **Clean Linting**: Zero ESLint warnings or errors (`bun run lint`).
4. **Responsive & Accessible**: Support dark/light modes seamlessly with semantic OKLCH tokens. Ensure interactive elements include appropriate ARIA attributes, keyboard support, and tooltips.
