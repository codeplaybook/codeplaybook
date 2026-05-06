# Frontend Component Architecture

Organizes frontend code into clear layers: **presentational components** (pure UI), **container components** (data-aware), a **data layer** (API abstraction), and a **state layer** (application state). Shared UI components are stateless and reusable. Feature-scoped components own their data and state.

This pattern prevents the common frontend problems:
- God components that fetch data, manage state, and render UI all in one file
- Shared components tangled with business logic that can't be reused
- API calls scattered across components making refactoring dangerous
- State management that's either global-everything or prop-drilling-everything

Key principles:
- **Components don't fetch data.** They receive data via props or hooks/composables. The data layer handles all API communication.
- **State lives with the feature that owns it.** Global state only for truly cross-feature concerns (auth, theme, locale).
- **Shared components are dumb.** They accept props, emit events, render UI. Zero business logic, zero data fetching.
- **Pages are thin.** They compose feature components and connect routes — they don't contain logic.

## When to Use

- The frontend has multiple features with distinct data and state requirements
- Shared UI components are being reused across features and must stay free of business logic
- The codebase has grown past the point where ad-hoc component organization leads to god components and scattered API calls
- Teams need clear boundaries between presentational UI, data fetching, and state management

## Start Simpler If

- Your frontend is a static landing page or simple form with no data fetching — this architecture adds overhead you don't need yet
- You have a single feature — the layered structure becomes valuable as you add more features

---

## Standards

### Standard: Component Layers

#### Severity
Medium

#### Scope
All frontend component files

#### Rules
* Separate presentational components (UI-only, receive props, emit events) from container components (data-aware, use hooks/composables/services)
* Presentational components must not import from the data layer or state layer directly
* Container components orchestrate data and state, then pass results to presentational components via props
* Keep components focused — if a component file exceeds ~150 lines, it likely mixes concerns and should be split
* Co-locate component styles and tests with the component file

### Standard: Data Layer

#### Severity
High

#### Scope
All frontend data fetching and API integration files

#### Rules
* Abstract all API calls behind a feature-scoped data layer — components must never call fetch/axios/HTTP clients directly
* The data layer exposes domain-oriented functions (e.g., `getUsers`, `createOrder`) not generic HTTP methods
* Place data layer files inside the feature directory they serve, not in a global `api/` folder
* Handle loading, error, and success states in the data layer — components consume the result
* API response types and request types live alongside their data layer functions

### Standard: State Management

#### Severity
Medium

#### Scope
All frontend state management files

#### Rules
* Co-locate state with the feature that owns it — each feature manages its own state
* Use global/root-level state only for truly cross-feature concerns: authentication, user session, theme, locale
* State layer files live inside the feature directory, not in a global `store/` folder
* Components access state through hooks/composables/selectors — never read or write state stores directly in template/JSX
* Derived/computed state should be defined in the state layer, not recalculated in components

### Standard: Shared UI Components

#### Severity
Medium

#### Scope
All shared/common UI component files

#### Rules
* Shared components must be purely presentational — they accept data via props and communicate via events/callbacks
* Shared components must not import from any feature directory, data layer, or state layer
* Shared components must work in isolation — buildable, testable, and previewable without application context
* Place shared components in the shared UI directory, organized by purpose (layout, forms, feedback, navigation)
* Document shared component props and variants — these are the team's design system building blocks

### Standard: Page/Route Organization

#### Severity
Low

#### Scope
All page and route files

#### Rules
* Pages are composition roots — they import and arrange feature components, they do not contain business logic
* Pages may connect route parameters to feature components but must not transform data
* Route-level data fetching (SSR/SSG loaders) belongs in the page file or a co-located loader, not in shared components
* Keep pages thin — if a page file exceeds ~50 lines of logic, extract a feature component

## Framework Variants

### React
Directory mapping:
- Features root: `src/features/`
- Shared UI: `src/shared/components/`
- Pages: `app/` (Next.js App Router) or `src/pages/` (Vite/CRA router)

Feature directory structure:
```
src/features/{name}/
  components/
    {Name}Container.tsx       (container — uses hooks)
    {Name}List.tsx            (presentational)
    {Name}Card.tsx            (presentational)
    {Name}Form.tsx            (presentational)
  hooks/
    use{Name}Data.ts          (data layer — wraps API calls)
    use{Name}Mutations.ts     (data layer — write operations)
    use{Name}State.ts         (state layer — feature-local state)
  api/
    {name}.api.ts             (raw API functions)
    {name}.types.ts           (request/response types)
  {name}.test.tsx
```

Data layer pattern:
* Wrap API calls in custom hooks (e.g., `use{Name}Data` returns `{ data, isLoading, error }`)
* Raw API functions in `api/` are plain async functions — hooks add caching/state
* Use the project's data fetching library conventions (if any) inside hooks

State layer pattern:
* Feature-scoped state via custom hooks (e.g., `use{Name}State`)
* Store files live inside the feature if using an external state library
* Context providers scoped to the feature, not global

Shared UI:
```
src/shared/components/
  layout/    (Shell, Sidebar, Header)
  forms/     (Input, Select, Checkbox)
  feedback/  (Toast, Alert, Spinner)
  navigation/ (Tabs, Breadcrumb)
```

### Vue
Directory mapping:
- Features root: `src/features/`
- Shared UI: `src/shared/components/`
- Pages: `src/pages/` or `src/views/`

Feature directory structure:
```
src/features/{name}/
  components/
    {Name}Container.vue       (container — uses composables)
    {Name}List.vue            (presentational)
    {Name}Card.vue            (presentational)
    {Name}Form.vue            (presentational)
  composables/
    use{Name}Data.ts          (data layer)
    use{Name}State.ts         (state layer)
  api/
    {name}.api.ts
    {name}.types.ts
  {name}.test.ts
```

Data layer pattern:
* Wrap API calls in composables using `ref`, `computed`, and async functions
* Raw API functions in `api/` are plain async — composables manage reactivity

State layer pattern:
* Feature-scoped stores (one store per feature, not a global monolith)
* Store files live inside the feature directory
* Use `defineStore` or equivalent scoped to the feature name

### Angular
Directory mapping:
- Features root: `src/app/features/`
- Shared UI: `src/app/shared/`
- Pages: route components in `src/app/features/{name}/pages/`

Feature directory structure:
```
src/app/features/{name}/
  components/
    {name}-container/
      {name}-container.component.ts
    {name}-list/
      {name}-list.component.ts       (presentational)
    {name}-card/
      {name}-card.component.ts       (presentational)
  services/
    {name}.service.ts                 (data layer)
    {name}-state.service.ts           (state layer)
  models/
    {name}.model.ts
  {name}.module.ts
```

Data layer pattern:
* Services using `HttpClient` for API calls
* Services return Observables — components subscribe via `async` pipe
* Data services are `providedIn` the feature module, not root

State layer pattern:
* Feature-scoped state services or feature store slices
* Smart components inject services; dumb components use `@Input`/`@Output`

### Svelte / SvelteKit
Directory mapping:
- Features root: `src/lib/features/`
- Shared UI: `src/lib/shared/`
- Pages: `src/routes/`

Feature directory structure:
```
src/lib/features/{name}/
  components/
    {Name}Container.svelte    (container — uses stores/API)
    {Name}List.svelte         (presentational)
    {Name}Card.svelte         (presentational)
  stores/
    {name}.store.ts           (state layer — Svelte stores)
  api/
    {name}.api.ts             (data layer)
    {name}.types.ts

src/routes/{name}/
  +page.svelte                (thin page, imports from feature)
  +page.server.ts             (server-side data loading)
```

Data layer pattern:
* Plain async functions in `api/` for API calls
* SvelteKit `load` functions in `+page.server.ts` for SSR data
* Stores consume API functions and expose reactive state

State layer pattern:
* Svelte writable/readable stores scoped to the feature
* Store files live inside the feature directory
* Derived stores for computed values

### Next.js (App Router)
Directory mapping:
- Features root: `src/features/`
- Shared UI: `src/shared/components/`
- Pages: `app/`

Feature directory structure:
```
src/features/{name}/
  components/
    {Name}Container.tsx       (client component — "use client")
    {Name}List.tsx            (presentational, can be server component)
    {Name}Card.tsx            (presentational)
    {Name}Form.tsx            (client component for interactivity)
  hooks/
    use{Name}Data.ts          (client-side data fetching)
    use{Name}State.ts         (client-side state)
  actions/
    {name}.actions.ts         (server actions — "use server")
  api/
    {name}.api.ts             (API functions for both server/client)
    {name}.types.ts

app/{name}/
  page.tsx                    (server component, imports feature components)
  loading.tsx
  error.tsx
```

Data layer pattern:
* Server Components fetch data directly (no hooks needed)
* Client Components use custom hooks for data fetching
* Server Actions for mutations (`"use server"`)
* Shared API functions work on both server and client

State layer pattern:
* Prefer server state (fetch on server, pass via props) over client state
* Client state only for interactive UI concerns (form state, selections, modals)
* Feature-scoped hooks for client state
