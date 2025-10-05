import { Kysely, sql } from "kysely";
import type { DB, Node, NodePatch, NodeProps } from "../db/types";

export class NodeRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async listAllNodes(treeId: string): Promise<Node[]> {
    return this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .orderBy("euler_left", "asc")
      .orderBy("position", "asc")
      .execute();
  }

  async createNode(input: {
    treeId: string;
    name: string;
    parentId: string | null;
    position?: number;
    props?: NodeProps;
    categoryId?: string | null;
  }): Promise<Node> {
    return this.db.transaction().execute(async (trx) => {
      const posExpr =
        input.position !== undefined
          ? sql<number>`${input.position}`
          : input.parentId !== null
          ? sql<number>`COALESCE((SELECT MAX(position)+1 FROM node WHERE tree_id=${input.treeId} AND parent_id=${input.parentId}), 0)`
          : sql<number>`COALESCE((SELECT MAX(position)+1 FROM node WHERE tree_id=${input.treeId} AND parent_id IS NULL), 0)`;

      let insertAt: number;
      let depth: number;

      if (input.parentId !== null) {
        const parent = await trx
          .selectFrom("node")
          .select(["euler_right", "euler_depth"])
          .where("tree_id", "=", input.treeId)
          .where("id", "=", input.parentId)
          .executeTakeFirst();

        if (!parent) {
          throw new Error("The specified parent does not exist.");
        }

        insertAt = parent.euler_right;
        depth = parent.euler_depth + 1;
      } else {
        const maxRow = await trx
          .selectFrom("node")
          .select((eb) =>
            eb.fn.coalesce(eb.fn.max("euler_right"), sql<number>`0`).as("max_right")
          )
          .where("tree_id", "=", input.treeId)
          .executeTakeFirst();

        const maxRight = maxRow?.max_right ?? 0;
        insertAt = Number(maxRight) + 1;
        depth = 0;
      }

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_right: sql`${ref("euler_right")} + 2` }))
        .where("tree_id", "=", input.treeId)
        .where("euler_right", ">=", insertAt)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_left: sql`${ref("euler_left")} + 2` }))
        .where("tree_id", "=", input.treeId)
        .where("euler_left", ">=", insertAt)
        .execute();

      const inserted = await trx
        .insertInto("node")
        .values({
          tree_id: input.treeId,
          name: input.name,
          parent_id: input.parentId,
          category_id: input.categoryId ?? null,
          position: posExpr as any,
          props: (input.props ?? {}) as any,
          euler_left: insertAt,
          euler_right: insertAt + 1,
          euler_depth: depth,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return inserted;
    });
  }

  async getNode(treeId: string, nodeId: string): Promise<Node | undefined> {
    return this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .executeTakeFirst();
  }

  async listChildren(treeId: string, parentId: string | null): Promise<Node[]> {
    const q = this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .orderBy("position", "asc");

    return parentId === null
      ? q.where("parent_id", "is", null).execute()
      : q.where("parent_id", "=", parentId).execute();
  }

  async updateNode(
    treeId: string,
    nodeId: string,
    patch: Partial<Pick<Node, "name" | "position">> & { categoryId?: string | null }
  ): Promise<Node | undefined> {
    const updatePayload: NodePatch & Record<string, unknown> = {};

    if (patch.name !== undefined) {
      updatePayload.name = patch.name;
    }

    if (patch.position !== undefined) {
      updatePayload.position = patch.position;
    }

    if (patch.categoryId !== undefined) {
      updatePayload.category_id = patch.categoryId;
    }

    if (!Object.keys(updatePayload).length) return this.getNode(treeId, nodeId);
    return this.db
      .updateTable("node")
      .set(updatePayload)
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .returningAll()
      .executeTakeFirst();
  }

  async getPathToRoot(treeId: string, nodeId: string): Promise<Array<Node & { depth: number }>> {
    const target = await this.getNode(treeId, nodeId);
    if (!target) return [];

    const rows = await this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("euler_left", "<=", target.euler_left)
      .where("euler_right", ">=", target.euler_right)
      .orderBy("euler_left", "asc")
      .execute();

    return rows.map((row) => ({
      ...row,
      depth: target.euler_depth - row.euler_depth,
    })) as Array<Node & { depth: number }>;
  }

  async getSubtree(
    treeId: string,
    rootId: string,
    options?: { maxDepth?: number }
  ): Promise<Array<Node & { depth: number }>> {
    const root = await this.getNode(treeId, rootId);
    if (!root) return [];

    const maxDepth = options?.maxDepth;
    let query = this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("euler_left", ">=", root.euler_left)
      .where("euler_right", "<=", root.euler_right);

    if (maxDepth !== undefined) {
      query = query.where("euler_depth", "<=", root.euler_depth + maxDepth);
    }

    const rows = await query.orderBy("euler_left", "asc").execute();

    return rows.map((row) => ({
      ...row,
      depth: row.euler_depth - root.euler_depth,
    })) as Array<Node & { depth: number }>;
  }

  async moveSubtree(treeId: string, nodeId: string, newParentId: string | null): Promise<void> {
    if (nodeId === newParentId) throw new Error("A node cannot be its own parent.");
    await this.db.transaction().execute(async (trx) => {
      const node = await trx
        .selectFrom("node")
        .select(["euler_left", "euler_right", "euler_depth"])
        .where("tree_id", "=", treeId)
        .where("id", "=", nodeId)
        .executeTakeFirst();

      if (!node) {
        throw new Error("The node to move could not be found.");
      }

      let destRight: number;
      let destDepth: number;

      if (newParentId !== null) {
        const parent = await trx
          .selectFrom("node")
          .select(["euler_left", "euler_right", "euler_depth"])
          .where("tree_id", "=", treeId)
          .where("id", "=", newParentId)
          .executeTakeFirst();

        if (!parent) throw new Error("The new parent does not exist.");
        if (parent.euler_left >= node.euler_left && parent.euler_right <= node.euler_right) {
          throw new Error("Cycle prevented: the new parent is part of the subtree.");
        }

        destRight = parent.euler_right;
        destDepth = parent.euler_depth + 1;
      } else {
        const maxRow = await trx
          .selectFrom("node")
          .select((eb) =>
            eb.fn.coalesce(eb.fn.max("euler_right"), sql<number>`0`).as("max_right")
          )
          .where("tree_id", "=", treeId)
          .executeTakeFirst();

        destRight = Number(maxRow?.max_right ?? 0) + 1;
        destDepth = 0;
      }

      const width = node.euler_right - node.euler_left + 1;
      const deltaDepth = destDepth - node.euler_depth;

      await trx
        .updateTable("node")
        .set(({ ref }) => ({
          euler_left: sql`-${ref("euler_left")}`,
          euler_right: sql`-${ref("euler_right")}`,
        }))
        .where("tree_id", "=", treeId)
        .where("euler_left", ">=", node.euler_left)
        .where("euler_right", "<=", node.euler_right)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_left: sql`${ref("euler_left")} - ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_left", ">", node.euler_right)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_right: sql`${ref("euler_right")} - ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_right", ">", node.euler_right)
        .execute();

      if (destRight > node.euler_right) {
        destRight -= width;
      }

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_left: sql`${ref("euler_left")} + ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_left", ">=", destRight)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_right: sql`${ref("euler_right")} + ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_right", ">=", destRight)
        .execute();

      const shift = destRight - node.euler_left;

      await trx
        .updateTable("node")
        .set(({ ref }) => ({
          euler_left: sql`-${ref("euler_left")} + ${shift}`,
          euler_right: sql`-${ref("euler_right")} + ${shift}`,
          euler_depth: sql`${ref("euler_depth")} + ${deltaDepth}`,
        }))
        .where("tree_id", "=", treeId)
        .where("euler_left", "<", 0)
        .execute();

      const posExpr =
        newParentId !== null
          ? sql<number>`COALESCE((SELECT MAX(position)+1 FROM node WHERE tree_id=${treeId} AND parent_id=${newParentId}), 0)`
          : sql<number>`COALESCE((SELECT MAX(position)+1 FROM node WHERE tree_id=${treeId} AND parent_id IS NULL), 0)`;

      await trx
        .updateTable("node")
        .set({ parent_id: newParentId, position: posExpr as any })
        .where("tree_id", "=", treeId)
        .where("id", "=", nodeId)
        .execute();
    });
  }

  async deleteSubtree(treeId: string, rootId: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const node = await trx
        .selectFrom("node")
        .select(["euler_left", "euler_right"])
        .where("tree_id", "=", treeId)
        .where("id", "=", rootId)
        .executeTakeFirst();

      if (!node) return;

      const width = node.euler_right - node.euler_left + 1;

      await trx
        .deleteFrom("node")
        .where("tree_id", "=", treeId)
        .where("euler_left", ">=", node.euler_left)
        .where("euler_right", "<=", node.euler_right)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_left: sql`${ref("euler_left")} - ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_left", ">", node.euler_right)
        .execute();

      await trx
        .updateTable("node")
        .set(({ ref }) => ({ euler_right: sql`${ref("euler_right")} - ${width}` }))
        .where("tree_id", "=", treeId)
        .where("euler_right", ">", node.euler_right)
        .execute();
    });
  }

  async listByType(treeId: string, type: string): Promise<Node[]> {
    return this.db
      .selectFrom("node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("props", "@>", { type } as NodeProps)
      .execute();
  }

  async incrementCounter(treeId: string, nodeId: string, counter: string, delta = 1): Promise<Node> {
    const row = await this.db
      .updateTable("node")
      .set(({ ref }) => {
        const counterPath = sql`ARRAY['counters', ${counter}]`;
        return {
          props: sql`
            jsonb_set(
              ${ref("props")},
              ${counterPath},
              to_jsonb(
                COALESCE(((${ref("props")}) #>> ${counterPath})::int, 0) + ${delta}
              ),
              true
            )
          `,
        };
      })
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return row;
  }
}
