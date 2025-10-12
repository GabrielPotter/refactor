import { Kysely } from "kysely";
import type { DB, Edge, EdgePatch, NewEdge } from "../db/types";

export class EdgeRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewEdge): Promise<Edge> {
    return this.db.insertInto("edge").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<Edge | undefined> {
    return this.db.selectFrom("edge").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: EdgePatch): Promise<Edge | undefined> {
    return this.db
      .updateTable("edge")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("edge").where("id", "=", id).execute();
  }
}
