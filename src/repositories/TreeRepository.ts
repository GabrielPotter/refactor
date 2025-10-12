import { Kysely } from "kysely";
import type { DB, NewTree, Tree, TreePatch } from "../db/types";

export class TreeRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewTree): Promise<Tree> {
    return this.db.insertInto("tree").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<Tree | undefined> {
    return this.db.selectFrom("tree").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: TreePatch): Promise<Tree | undefined> {
    return this.db
      .updateTable("tree")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("tree").where("id", "=", id).execute();
  }
}
