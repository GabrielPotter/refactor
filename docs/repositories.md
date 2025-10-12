# Repository Layer (`src/repositories`)

Repositories encapsulate SQL access patterns using Kysely. They provide a thin, testable abstraction between routers and the database.

## TreeRepository
- **File:** `src/repositories/TreeRepository.ts`
- **Responsibilities:** CRUD operations on `tree` records (`listTrees`, `createTree`, `renameTree`, `deleteTree`).
- **Implementation details:**
  - `listTrees()` orders by `created_at` for chronological presentation.
  - `createTree()` and `renameTree()` leverage `returningAll()` to send full records back to API callers.

## NodeRepository
- **File:** `src/repositories/NodeRepository.ts`
- **Key capabilities:**
  - Hierarchy traversal: `listChildren`, `listAllNodes`, `getPathToRoot`, `getSubtree`.
  - Mutation helpers: `createNode`, `moveSubtree`, `deleteSubtree`, `updateNode`.
  - JSON utilities: `listByType` (JSONB containment) and `incrementCounter` (atomic counter using `jsonb_set`).
- **Concurrency safeguards:**
  - All structural mutations (`createNode`, `moveSubtree`, `deleteSubtree`) run inside Kysely transactions to maintain Euler tour invariants.
  - `moveSubtree` prevents cycles by verifying the destination is not inside the moving subtree.

## CategoryRepository
- **File:** `src/repositories/CategoryRepository.ts`
- **Features:**
  - Hierarchical category browsing with optional `parentId` filters.
  - Validation to prevent self-parenting on updates.
  - JSONB `props` updates with controlled mutation payloads.

## LayerRepository
- **File:** `src/repositories/LayerRepository.ts`
- Handles simple CRUD for `layer` entities.
- Utilizes `returningAll()` for create/update to reflect the persisted state immediately.

## EdgeRepository
- **File:** `src/repositories/EdgeRepository.ts`
- Manages edges between nodes, scoped by layer.
- Supports filtering (`listEdgesByLayer`), selective updates (`updateEdge`), and encapsulates JSONB props handling.

## Testing
Each repository has a Jest test suite under `__tests__/*Repository.test.ts`, validating expected SQL behavior and edge cases (e.g., self-parent checks, Euler tour adjustments).
