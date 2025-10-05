import { Kysely } from "kysely";
import type { DB, Tree } from "../db/types";

export class TreeRepository {
  constructor(private readonly db: Kysely<DB>) {}

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
}
