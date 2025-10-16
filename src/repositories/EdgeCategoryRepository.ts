import { eq } from "drizzle-orm";

import { edge_category, edge_category_graph } from "../db/schema";
import type { Database, EdgeCategory, EdgeCategoryPatch, NewEdgeCategory } from "../db/types";
import { sanitizePatch } from "../db/utils";

export type EdgeCategoryCreateInput = NewEdgeCategory & { parentIds?: string[] };
export type EdgeCategoryUpdateInput = EdgeCategoryPatch & { parentIds?: string[] };
export type EdgeCategoryWithParents = EdgeCategory & { parentIds: string[] };
type Executor = Pick<Database, "select" | "insert" | "update" | "delete">;

export class EdgeCategoryRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: EdgeCategoryCreateInput): Promise<EdgeCategoryWithParents> {
    return this.db.transaction(async (trx) => {
      const { parentIds, ...categoryValues } = values;
      const [inserted] = await trx.insert(edge_category).values(categoryValues).returning().execute();

      if (!inserted) {
        throw new Error("Failed to insert edge_category row");
      }

      await this.replaceParentEdges(trx, inserted.id, parentIds);
      return this.hydrateWithParents(trx, inserted.id, inserted);
    });
  }

  public async read(id: string): Promise<EdgeCategoryWithParents | undefined> {
    const [category] = await this.db
      .select()
      .from(edge_category)
      .where(eq(edge_category.id, id))
      .limit(1)
      .execute();

    if (!category) {
      return undefined;
    }

    return this.hydrateWithParents(this.db, id, category);
  }

  public async update(
    id: string,
    patch: EdgeCategoryUpdateInput,
  ): Promise<EdgeCategoryWithParents | undefined> {
    return this.db.transaction(async (trx) => {
      const { parentIds, ...categoryPatch } = patch;
      const updateValues = sanitizePatch(categoryPatch);
      const hasCategoryUpdates = Object.keys(updateValues).length > 0;

      let current: EdgeCategory | undefined;

      if (hasCategoryUpdates) {
        const [updated] = await trx
          .update(edge_category)
          .set(updateValues)
          .where(eq(edge_category.id, id))
          .returning()
          .execute();

        current = updated ?? undefined;
      } else {
        const [existing] = await trx
          .select()
          .from(edge_category)
          .where(eq(edge_category.id, id))
          .limit(1)
          .execute();
        current = existing ?? undefined;
      }

      if (!current) {
        return undefined;
      }

      await this.replaceParentEdges(trx, id, parentIds);
      return this.hydrateWithParents(trx, id, current);
    });
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(edge_category).where(eq(edge_category.id, id)).execute();
  }

  private async replaceParentEdges(
    executor: Executor,
    childId: string,
    parentIds: readonly string[] | undefined,
  ): Promise<void> {
    if (parentIds === undefined) {
      return;
    }

    await executor.delete(edge_category_graph).where(eq(edge_category_graph.child_id, childId)).execute();

    if (parentIds.length === 0) {
      return;
    }

    const rows = parentIds.map((parentId) => ({ parent_id: parentId, child_id: childId }));
    await executor.insert(edge_category_graph).values(rows).execute();
  }

  private async hydrateWithParents(
    executor: Executor,
    id: string,
    base: EdgeCategory,
  ): Promise<EdgeCategoryWithParents> {
    const parents = await executor
      .select({ parent_id: edge_category_graph.parent_id })
      .from(edge_category_graph)
      .where(eq(edge_category_graph.child_id, id))
      .execute();

    return {
      ...base,
      parentIds: parents.map((row) => row.parent_id),
    };
  }
}
