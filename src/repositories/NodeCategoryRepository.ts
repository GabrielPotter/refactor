import { eq } from "drizzle-orm";

import { node_category, node_category_graph } from "../db/schema";
import type { Database, NewNodeCategory, NodeCategory, NodeCategoryPatch } from "../db/types";
import { sanitizePatch } from "../db/utils";

export type NodeCategoryCreateInput = NewNodeCategory & { parentIds?: string[] };
export type NodeCategoryUpdateInput = NodeCategoryPatch & { parentIds?: string[] };
export type NodeCategoryWithParents = NodeCategory & { parentIds: string[] };
type Executor = Pick<Database, "select" | "insert" | "update" | "delete">;

export class NodeCategoryRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NodeCategoryCreateInput): Promise<NodeCategoryWithParents> {
    return this.db.transaction(async (trx) => {
      const { parentIds, ...categoryValues } = values;
      const [inserted] = await trx.insert(node_category).values(categoryValues).returning().execute();

      if (!inserted) {
        throw new Error("Failed to insert node_category row");
      }

      await this.replaceParentEdges(trx, inserted.id, parentIds);
      return this.hydrateWithParents(trx, inserted.id, inserted);
    });
  }

  public async read(id: string): Promise<NodeCategoryWithParents | undefined> {
    const [category] = await this.db
      .select()
      .from(node_category)
      .where(eq(node_category.id, id))
      .limit(1)
      .execute();

    if (!category) {
      return undefined;
    }

    return this.hydrateWithParents(this.db, id, category);
  }

  public async update(id: string, patch: NodeCategoryUpdateInput): Promise<NodeCategoryWithParents | undefined> {
    return this.db.transaction(async (trx) => {
      const { parentIds, ...categoryPatch } = patch;
      const updateValues = sanitizePatch(categoryPatch);
      const hasCategoryUpdates = Object.keys(updateValues).length > 0;

      let current: NodeCategory | undefined;

      if (hasCategoryUpdates) {
        const [updated] = await trx
          .update(node_category)
          .set(updateValues)
          .where(eq(node_category.id, id))
          .returning()
          .execute();

        current = updated ?? undefined;
      } else {
        const [existing] = await trx
          .select()
          .from(node_category)
          .where(eq(node_category.id, id))
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
    await this.db.delete(node_category).where(eq(node_category.id, id)).execute();
  }

  private async replaceParentEdges(
    executor: Executor,
    childId: string,
    parentIds: readonly string[] | undefined,
  ): Promise<void> {
    if (parentIds === undefined) {
      return;
    }

    await executor.delete(node_category_graph).where(eq(node_category_graph.child_id, childId)).execute();

    if (parentIds.length === 0) {
      return;
    }

    const rows = parentIds.map((parentId) => ({ parent_id: parentId, child_id: childId }));
    await executor.insert(node_category_graph).values(rows).execute();
  }

  private async hydrateWithParents(
    executor: Executor,
    id: string,
    base: NodeCategory,
  ): Promise<NodeCategoryWithParents> {
    const parents = await executor
      .select({ parent_id: node_category_graph.parent_id })
      .from(node_category_graph)
      .where(eq(node_category_graph.child_id, id))
      .execute();

    return {
      ...base,
      parentIds: parents.map((row) => row.parent_id),
    };
  }
}
