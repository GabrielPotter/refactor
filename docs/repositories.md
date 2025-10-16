# Repository Layer (`src/repositories`)

Repositories encapsulate SQL access patterns using Drizzle's query builder. Each repository receives the shared `NodePgDatabase` instance and issues strongly typed operations against the tables declared in `src/db/schema.ts`.

## Core CRUD repositories
- **`TreeRepository` / `LayerRepository` / `EdgeRepository` / `NodeRepository` / `AppInfoRepository` / `JsonSchemasRepository` / `EdgeTypeRepository` / `NodeTypeRepository`**  
  Provide create/read/update/delete methods that wrap `insert(...).returning()`, `select().from(...)`, `update(...).returning()`, and `delete(...).where(...)`. Updates pass through a `sanitizePatch` helper so `undefined` fields are ignored rather than overwritten.

## Graph repositories
- **`EdgeCategoryRepository` / `NodeCategoryRepository`**  
  Use Drizzle transactions to keep parent/child join tables synchronized with category inserts and updates. The helpers call `replaceParentEdges()` to rebuild the graph edges whenever `parentIds` change, and `hydrateWithParents()` loads the effective parent list for API responses.

## Testing
Targeted Jest tests cover utility helpers and the Drizzle-based repositories (see `__tests__/db-utils.test.ts` and `__tests__/treeRepository.test.ts`). Additional repositories can follow the same mocking pattern demonstrated in the tree repository tests.
