# Code Scaffolding

Detect repeating file structures across the codebase and propose consistency standards.

## What to Look For

Identify file categories where multiple files share a common template — same base class, same decorators, same method signatures, same export pattern. These are candidates for automated scaffolding.

### File Role Patterns

Scan for files matching these naming conventions:

```
*Controller.ts    *Service.ts     *UseCase.ts     *Repository.ts
*Controller.js    *Service.js     *UseCase.js     *Repository.js
*controller.py    *service.py     *use_case.py    *repository.py
*_controller.rb   *_service.rb    *_use_case.rb   *_repository.rb
*Controller.java  *Service.java   *UseCase.java   *Repository.java
*Controller.go    *usecase.go

*DTO.ts    *Dto.ts    *dto.py    *Dto.java    *DTO.go
*Request.ts    *Response.ts    *ValueObject.ts
*Mapper.ts    *Adapter.ts    *Converter.ts
*_serializer.rb    *Serializer.java    *serializer.py

# React / Vue / Angular / Svelte components
*.component.tsx    *Component.tsx    *Component.vue    *.svelte
*.component.ts     *.component.html                    # Angular

# Hooks / composables
use*.ts    use*.tsx    use*.js
use*.composable.ts    use*.hook.ts

# Pages / layouts (meta-frameworks)
page.tsx    page.ts    page.js                          # Next.js App Router
layout.tsx    layout.ts    loading.tsx    error.tsx
+page.svelte    +layout.svelte    +error.svelte        # SvelteKit
*.page.vue    *.layout.vue                              # Nuxt (optional)
[slug].tsx    [...slug].tsx    [[...slug]].tsx           # Next.js dynamic routes

# State management
*Slice.ts    *slice.ts    *Store.ts    *store.ts
*.store.ts    *.store.js                                # Zustand/Pinia
*Reducer.ts    *reducer.ts    *Actions.ts
*Context.tsx    *Provider.tsx    *context.tsx
*atom.ts    *selector.ts                                # Recoil/Jotai

# API / data fetching
*Api.ts    *api.ts    *Query.ts    *query.ts
*.queries.ts    *.mutations.ts                          # React Query/Apollo
*Loader.ts    *loader.ts                                # Remix/React Router

# Styles
*.module.css    *.module.scss    *.styled.ts    *.styles.ts

# Protocol / schema definitions
*.proto    *.graphql    *.gql

# Python views / viewsets
*views.py    *viewsets.py    *_view.py

# Go handlers
*_handler.go    *_controller.go    *_service.go    *_repository.go

# Ruby
*_controller.rb    *_serializer.rb    *_job.rb
```

**Note:** The architecture-boundaries analysis also uses these role patterns, but for responsibility analysis. Here, focus exclusively on extractable structural templates.

### Structure Markers to Extract

```
# Base classes / interfaces
extends Abstract*
extends Base*
implements I*

# Decorators / annotations (JS/TS)
@Controller    @Injectable    @Service    @Repository
@Component     @Module        @Entity

# Decorators / annotations (Python)
@app.route(    @app.get(    @app.post(    @app.put(    @app.delete(
@router.get(   @router.post(  @router.put(   @router.delete(
@api_view(     @action(

# Annotations (Java/Kotlin - Spring)
@RestController    @RequestMapping    @GetMapping    @PostMapping
@PutMapping        @DeleteMapping     @PatchMapping
@Service           @Repository        @Component     @Configuration

# RPC / transport decorators (multi-language)
@GrpcMethod    @GrpcService    @GrpcStreamMethod
@MessagePattern    @EventPattern
grpc.ServerServiceDefinition    grpc.ServiceDesc

# Route definitions (non-decorator)
router.get(    router.post(    router.put(    router.delete(
app.get(       app.post(       app.use(
http.HandleFunc(    http.Handle(    mux.Handle(
gin.GET(       gin.POST(       echo.GET(      fiber.Get(

# Constructor injection
constructor(
  private readonly
  private final
  @Inject    @Autowired

# Standard methods
async execute(    async handle(    async run(
def execute(      def handle(      def call(
func (s *Service)    func (h *Handler)    func (c *Controller)
def perform(    def process(

# Required exports
export class    export default    export const    module.exports

# Frontend — React patterns
React.FC    React.memo(    React.forwardRef(
useState(    useEffect(    useCallback(    useMemo(    useRef(
createContext(    useContext(

# Frontend — React meta-framework conventions
export default function     # Next.js pages/layouts
export async function generateMetadata    # Next.js App Router
export async function loader(             # Remix
export const getServerSideProps           # Next.js Pages Router
export const getStaticProps               # Next.js Pages Router
"use client"    "use server"              # React Server Components

# Frontend — Vue patterns
defineComponent(    defineProps(    defineEmits(
ref(    reactive(    computed(    watch(    onMounted(
<script setup>                            # Vue 3 Composition API
defineStore(                              # Pinia

# Frontend — Angular patterns
@Component({    @Directive({    @Pipe({
@Input(    @Output(    @ViewChild(
@NgModule(    @HostListener(

# Frontend — State management patterns
createSlice(    createAsyncThunk(          # Redux Toolkit
create(    useStore(                       # Zustand
atom(    selector(                         # Recoil/Jotai
createSignal(    createEffect(             # SolidJS

# Frontend — Data fetching patterns
useQuery(    useMutation(    useInfiniteQuery(   # React Query/Apollo
useSWR(    fetcher(                               # SWR
createApi(    fetchBaseQuery(                      # RTK Query
```

### Directory Conventions

```
# Backend
src/controllers/    src/services/       src/useCases/
src/use-cases/      src/application/    src/domain/
src/infra/          src/infrastructure/ src/repositories/
src/handlers/       src/modules/

# Frontend — components & hooks
src/components/     src/hooks/          src/composables/
components/         hooks/              lib/
src/ui/             src/shared/         src/common/

# Frontend — pages & layouts (meta-frameworks)
src/pages/          src/app/            app/
pages/              src/routes/         src/views/

# Frontend — state & data
src/store/          src/stores/         src/state/
src/api/            src/queries/        src/services/
src/context/        src/providers/

# Frontend — styles
src/styles/         src/theme/          src/design-tokens/
```

## Analysis Method

1. Identify file categories with **≥5 instances** (by naming + directory pattern)
2. Read **3-5 representative files** per category
3. For each category, extract shared structure:
   - Base class or interface
   - Required decorators or annotations
   - Constructor injection pattern
   - Standard method signatures
   - Export pattern
   - Associated test file convention (e.g., `*.spec.ts` alongside)
4. Determine if the structure is consistent enough to template

## Reporting Threshold

Report only if:
- ≥5 files in a category AND
- ≥3 of them share ≥2 structure markers

## Insight Template

```
INSIGHT:
  id: SCAFFOLD-[n]
  title: "SCAFFOLDING: [FileType] follows consistent template"
  summary: "[N] [FileType] files share [markers]. Structure can be automated."
  confidence: [high|medium|low]
  evidence:
    - path[:line-line] — shows [marker]
  template_markers:
    - base_class: [name or none]
    - decorators: [list]
    - constructor_pattern: [description]
    - required_methods: [list]
    - export_pattern: [description]
    - test_convention: [colocated spec / separate test dir / none detected]
```

## Output Suggestions

### Standard: Template Consistency

```yaml
name: "codeplaybook-[file-type]-structure"
summary: "New [FileType] files must follow the established project template"
rules:
  - "Extend [BaseClass] for all new [file-type] files"
  - "Include [required methods] in every [file-type]"
  - "Place [file-type] files in [directory convention]"
```