import { Kysely } from "kysely";
import type { DB, NewNode, Node, NodePatch } from "../db/types";

export class NodeRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewNode): Promise<Node> {
    return this.db.insertInto("node").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<Node | undefined> {
    return this.db.selectFrom("node").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: NodePatch): Promise<Node | undefined> {
    return this.db
      .updateTable("node")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("node").where("id", "=", id).execute();
  }
}
