import { Kysely } from "kysely";
import type { DB, NewNodeType, NodeType, NodeTypePatch } from "../db/types";

export class NodeTypeRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewNodeType): Promise<NodeType> {
    return this.db.insertInto("node_types").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<NodeType | undefined> {
    return this.db.selectFrom("node_types").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: NodeTypePatch): Promise<NodeType | undefined> {
    return this.db
      .updateTable("node_types")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("node_types").where("id", "=", id).execute();
  }
}
