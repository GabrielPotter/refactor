import { Kysely, type Transaction } from "kysely";
import type { DB, EdgeCategory, EdgeCategoryPatch, NewEdgeCategory } from "../db/types";

export type EdgeCategoryCreateInput = NewEdgeCategory & { parentIds?: string[] };
export type EdgeCategoryUpdateInput = EdgeCategoryPatch & { parentIds?: string[] };
export type EdgeCategoryWithParents = EdgeCategory & { parentIds: string[] };

export class EdgeCategoryRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: EdgeCategoryCreateInput): Promise<EdgeCategoryWithParents> {
    return this.db.transaction().execute(async (trx) => {
      const { parentIds, ...categoryValues } = values;
      const inserted = await trx
        .insertInto("edge_category")
        .values(categoryValues)
        .returningAll()
        .executeTakeFirstOrThrow();

      await this.replaceParentEdges(trx, inserted.id, parentIds);
      return this.hydrateWithParents(trx, inserted.id, inserted);
    });
  }

  public async read(id: string): Promise<EdgeCategoryWithParents | undefined> {
    const category = await this.db
      .selectFrom("edge_category")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!category) {
      return undefined;
    }

    return this.hydrateWithParents(this.db, id, category);
  }

  public async update(
    id: string,
    patch: EdgeCategoryUpdateInput,
  ): Promise<EdgeCategoryWithParents | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const { parentIds, ...categoryPatch } = patch;
      const hasCategoryUpdates = Object.values(categoryPatch as Record<string, unknown>).some(
        (value) => value !== undefined,
      );

      let current = undefined as EdgeCategory | undefined;

      if (hasCategoryUpdates) {
        current = await trx
          .updateTable("edge_category")
          .set(categoryPatch)
          .where("id", "=", id)
          .returningAll()
          .executeTakeFirst();

        if (!current) {
          return undefined;
        }
      } else {
        current = await trx
          .selectFrom("edge_category")
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
    await this.db.deleteFrom("edge_category").where("id", "=", id).execute();
  }

  private async replaceParentEdges(
    executor: Kysely<DB> | Transaction<DB>,
    childId: string,
    parentIds: readonly string[] | undefined,
  ): Promise<void> {
    if (parentIds === undefined) {
      return;
    }

    await executor.deleteFrom("edge_category_graph").where("child_id", "=", childId).execute();

    if (parentIds.length === 0) {
      return;
    }

    const rows = parentIds.map((parentId) => ({ parent_id: parentId, child_id: childId }));
    await executor.insertInto("edge_category_graph").values(rows).execute();
  }

  private async hydrateWithParents(
    executor: Kysely<DB> | Transaction<DB>,
    id: string,
    base: EdgeCategory,
  ): Promise<EdgeCategoryWithParents> {
    const parents = await executor
      .selectFrom("edge_category_graph")
      .select("parent_id")
      .where("child_id", "=", id)
      .execute();

    return {
      ...base,
      parentIds: parents.map((row) => row.parent_id),
    };
  }
}
