import { Kysely } from "kysely";
import type { DB, NodeCategory, NodeCategoryPatch, NodeCategoryProps } from "../db/types";

export class CategoryRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async listCategories(parentId?: string | null): Promise<NodeCategory[]> {
    let query = this.db.selectFrom("node_categories").selectAll().orderBy("name", "asc");

    if (parentId === undefined) {
      return query.execute();
    }

    if (parentId === null) {
      query = query.where("parent_id", "is", null);
    } else {
      query = query.where("parent_id", "=", parentId);
    }

    return query.execute();
  }

  async getCategoryById(id: string): Promise<NodeCategory | undefined> {
    return this.db
      .selectFrom("node_categories")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async getCategoryByName(name: string): Promise<NodeCategory | undefined> {
    return this.db
      .selectFrom("node_categories")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst();
  }

  async createCategory(input: {
    name: string;
    parentId: string | null;
    props?: NodeCategoryProps;
  }): Promise<NodeCategory> {
    return this.db
      .insertInto("node_categories")
      .values({
        name: input.name,
        parent_id: input.parentId,
        props: (input.props ?? {}) as any,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateCategory(
    categoryId: string,
    patch: Partial<Pick<NodeCategory, "name">> & { props?: NodeCategoryProps; parentId?: string | null }
  ): Promise<NodeCategory | undefined> {
    const updatePayload: NodeCategoryPatch & Record<string, unknown> = {};

    if (patch.name !== undefined) {
      updatePayload.name = patch.name;
    }

    if (patch.props !== undefined) {
      updatePayload.props = patch.props as any;
    }

    if (patch.parentId !== undefined) {
      if (patch.parentId === categoryId) {
        throw new Error("A category cannot be its own parent.");
      }
      updatePayload.parent_id = patch.parentId;
    }

    if (!Object.keys(updatePayload).length) {
      return this.getCategoryById(categoryId);
    }

    return this.db
      .updateTable("node_categories")
      .set(updatePayload)
      .where("id", "=", categoryId)
      .returningAll()
      .executeTakeFirst();
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.db.deleteFrom("node_categories").where("id", "=", categoryId).execute();
  }
}
