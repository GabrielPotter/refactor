import { Kysely, type Transaction } from "kysely";
import type { DB, NewNodeCategory, NodeCategory, NodeCategoryPatch } from "../db/types";

export type NodeCategoryCreateInput = NewNodeCategory & { parentIds?: string[] };
export type NodeCategoryUpdateInput = NodeCategoryPatch & { parentIds?: string[] };
export type NodeCategoryWithParents = NodeCategory & { parentIds: string[] };

export class NodeCategoryRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NodeCategoryCreateInput): Promise<NodeCategoryWithParents> {
    return this.db.transaction().execute(async (trx) => {
      const { parentIds, ...categoryValues } = values;
      const inserted = await trx
        .insertInto("node_category")
        .values(categoryValues)
        .returningAll()
        .executeTakeFirstOrThrow();

      await this.replaceParentEdges(trx, inserted.id, parentIds);
      return this.hydrateWithParents(trx, inserted.id, inserted);
    });
  }

  public async read(id: string): Promise<NodeCategoryWithParents | undefined> {
    const category = await this.db
      .selectFrom("node_category")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!category) {
      return undefined;
    }

    return this.hydrateWithParents(this.db, id, category);
  }

  public async update(id: string, patch: NodeCategoryUpdateInput): Promise<NodeCategoryWithParents | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const { parentIds, ...categoryPatch } = patch;
      const hasCategoryUpdates = Object.values(categoryPatch as Record<string, unknown>).some(
        (value) => value !== undefined,
      );

      let current = undefined as NodeCategory | undefined;

      if (hasCategoryUpdates) {
        current = await trx
          .updateTable("node_category")
          .set(categoryPatch)
          .where("id", "=", id)
          .returningAll()
          .executeTakeFirst();

        if (!current) {
          return undefined;
        }
      } else {
        current = await trx
          .selectFrom("node_category")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirst();

        if (!current) {
          return undefined;
        }
      }

      await this.replaceParentEdges(trx, id, parentIds);
      return this.hydrateWithParents(trx, id, current);
    });
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("node_category").where("id", "=", id).execute();
  }

  private async replaceParentEdges(
    executor: Kysely<DB> | Transaction<DB>,
    childId: string,
    parentIds: readonly string[] | undefined,
  ): Promise<void> {
    if (parentIds === undefined) {
      return;
    }

    await executor.deleteFrom("node_category_graph").where("child_id", "=", childId).execute();

    if (parentIds.length === 0) {
      return;
    }

    const rows = parentIds.map((parentId) => ({ parent_id: parentId, child_id: childId }));
    await executor.insertInto("node_category_graph").values(rows).execute();
  }

  private async hydrateWithParents(
    executor: Kysely<DB> | Transaction<DB>,
    id: string,
    base: NodeCategory,
  ): Promise<NodeCategoryWithParents> {
    const parents = await executor
      .selectFrom("node_category_graph")
      .select("parent_id")
      .where("child_id", "=", id)
      .execute();

    return {
      ...base,
      parentIds: parents.map((row) => row.parent_id),
    };
  }
}
