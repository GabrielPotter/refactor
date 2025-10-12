import { Kysely } from "kysely";
import type { DB, Layer, LayerPatch, NewLayer } from "../db/types";

export class LayerRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewLayer): Promise<Layer> {
    return this.db.insertInto("layer").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<Layer | undefined> {
    return this.db.selectFrom("layer").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: LayerPatch): Promise<Layer | undefined> {
    return this.db
      .updateTable("layer")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("layer").where("id", "=", id).execute();
  }
}
