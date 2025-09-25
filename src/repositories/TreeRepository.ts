import { Kysely, sql } from "kysely";
import type { DB, Tree, TreeNode, TreeNodeProps } from "../db/types";

export class TreeRepository {
  constructor(private readonly db: Kysely<DB>) {}

  // ---- Tree metadata ----
  async listTrees(): Promise<Tree[]> {
    return this.db.selectFrom("tree").selectAll().orderBy("created_at", "asc").execute();
  }

  async createTree(name: string): Promise<Tree> {
    return this.db
      .insertInto("tree")
      .values({ name })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async renameTree(treeId: string, name: string): Promise<Tree> {
    return this.db
      .updateTable("tree")
      .set({ name })
      .where("id", "=", treeId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteTree(treeId: string): Promise<void> {
    await this.db.deleteFrom("tree").where("id", "=", treeId).execute();
  }

  // ---- Node CRUD (multiple trees) ----
  async listAllNodes(treeId: string): Promise<TreeNode[]> {
    return this.db
      .selectFrom("tree_node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .orderBy("parent_id", "asc")
      .orderBy("position", "asc")
      .execute();
  }

  async createNode(input: {
    treeId: string;
    name: string;
    parentId: string | null;
    position?: number;
    props?: TreeNodeProps;
  }): Promise<TreeNode> {
    const posExpr =
      input.position !== undefined
        ? sql<number>`${input.position}`
        : input.parentId !== null
        ? sql<number>`COALESCE((SELECT MAX(position)+1 FROM tree_node WHERE tree_id=${input.treeId} AND parent_id=${input.parentId}), 0)`
        : sql<number>`COALESCE((SELECT MAX(position)+1 FROM tree_node WHERE tree_id=${input.treeId} AND parent_id IS NULL), 0)`;

    return this.db
      .insertInto("tree_node")
      .values({
        tree_id: input.treeId,
        name: input.name,
        parent_id: input.parentId,
        position: posExpr as any,
        props: (input.props ?? {}) as any,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getNode(treeId: string, nodeId: string): Promise<TreeNode | undefined> {
    return this.db
      .selectFrom("tree_node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .executeTakeFirst();
  }

  async listChildren(treeId: string, parentId: string | null): Promise<TreeNode[]> {
    const q = this.db
      .selectFrom("tree_node")
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
    patch: Partial<Pick<TreeNode, "name" | "position">>
  ): Promise<TreeNode | undefined> {
    if (!Object.keys(patch).length) return this.getNode(treeId, nodeId);
    return this.db
      .updateTable("tree_node")
      .set(patch as any)
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .returningAll()
      .executeTakeFirst();
  }

  // Ancestry within a tree
  async getPathToRoot(treeId: string, nodeId: string): Promise<Array<TreeNode & { depth: number }>> {
    const rows = await this.db
      .withRecursive(
        "anc(depth, id, tree_id, parent_id, name, position, props, created_at, updated_at)",
        (qb) =>
          qb
            .selectFrom("tree_node")
            .select((eb) => [
              sql<number>`0`.as("depth"),
              "id",
              "tree_id",
              "parent_id",
              "name",
              "position",
              "props",
              "created_at",
              "updated_at",
            ])
            .where("tree_id", "=", treeId)
            .where("id", "=", nodeId)
            .unionAll(
              qb
                .selectFrom("tree_node as t")
                .innerJoin("anc as a", (join) =>
                  join.onRef("a.parent_id", "=", "t.id").onRef("a.tree_id", "=", "t.tree_id")
                )
                .select((eb) => [
                  sql<number>`a.depth + 1`.as("depth"),
                  "t.id",
                  "t.tree_id",
                  "t.parent_id",
                  "t.name",
                  "t.position",
                  "t.props",
                  "t.created_at",
                  "t.updated_at",
                ])
            )
      )
      .selectFrom("anc")
      .selectAll()
      .orderBy("depth desc")
      .execute();

    return rows as any;
  }

  // Subtree within a tree (optional maxDepth)
  async getSubtree(
    treeId: string,
    rootId: string,
    options?: { maxDepth?: number }
  ): Promise<Array<TreeNode & { depth: number }>> {
    const { maxDepth } = options ?? {};
    const rows = await this.db
      .withRecursive(
        "sub(depth, id, tree_id, parent_id, name, position, props, created_at, updated_at)",
        (qb) =>
          qb
            .selectFrom("tree_node")
            .select((eb) => [
              sql<number>`0`.as("depth"),
              "id",
              "tree_id",
              "parent_id",
              "name",
              "position",
              "props",
              "created_at",
              "updated_at",
            ])
            .where("tree_id", "=", treeId)
            .where("id", "=", rootId)
            .unionAll((qb) => {
              let next = qb
                .selectFrom("tree_node as t")
                .innerJoin("sub as s", (join) =>
                  join.onRef("s.id", "=", "t.parent_id").onRef("s.tree_id", "=", "t.tree_id")
                );

              if (maxDepth !== undefined) {
                next = next.where("s.depth", "<", maxDepth);
              }

              return next.select((eb) => [
                sql<number>`s.depth + 1`.as("depth"),
                "t.id",
                "t.tree_id",
                "t.parent_id",
                "t.name",
                "t.position",
                "t.props",
                "t.created_at",
                "t.updated_at",
              ]);
            })
      )
      .selectFrom("sub")
      .selectAll()
      .orderBy("depth", "asc")
      .orderBy("position", "asc")
      .execute();

    return rows as any;
  }

  // Move subtree within the same tree
  async moveSubtree(treeId: string, nodeId: string, newParentId: string | null): Promise<void> {
    if (nodeId === newParentId) throw new Error("A csomópont nem lehet a saját szülője.");
    if (newParentId) {
      const descendants = await this.getSubtree(treeId, nodeId);
      const ids = new Set(descendants.map((r) => r.id));
      if (ids.has(newParentId)) throw new Error("Ciklus tiltva: az új szülő a részfa része.");
    }

    const posExpr =
      newParentId !== null
        ? sql<number>`COALESCE((SELECT MAX(position)+1 FROM tree_node WHERE tree_id=${treeId} AND parent_id=${newParentId}), 0)`
        : sql<number>`COALESCE((SELECT MAX(position)+1 FROM tree_node WHERE tree_id=${treeId} AND parent_id IS NULL), 0)`;

    await this.db
      .updateTable("tree_node")
      .set({ parent_id: newParentId, position: posExpr as any })
      .where("tree_id", "=", treeId)
      .where("id", "=", nodeId)
      .execute();
  }

  async deleteSubtree(treeId: string, rootId: string): Promise<void> {
    await this.db
      .deleteFrom("tree_node")
      .where("tree_id", "=", treeId)
      .where("id", "=", rootId)
      .execute();
  }

  // JSONB filters for tree nodes
  async listByType(treeId: string, type: string): Promise<TreeNode[]> {
    return this.db
      .selectFrom("tree_node")
      .selectAll()
      .where("tree_id", "=", treeId)
      .where("props", "@>", { type } as TreeNodeProps)
      .execute();
  }

  async incrementCounter(treeId: string, nodeId: string, counter: string, delta = 1): Promise<TreeNode> {
    const row = await this.db
      .updateTable("tree_node")
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
