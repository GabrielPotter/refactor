import { Kysely } from "kysely";
import type { DB, EdgeType, EdgeTypePatch, NewEdgeType } from "../db/types";

export class EdgeTypeRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewEdgeType): Promise<EdgeType> {
    return this.db.insertInto("edge_types").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<EdgeType | undefined> {
    return this.db.selectFrom("edge_types").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: EdgeTypePatch): Promise<EdgeType | undefined> {
    return this.db
      .updateTable("edge_types")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("edge_types").where("id", "=", id).execute();
  }
}
