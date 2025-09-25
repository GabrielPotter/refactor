import { Kysely } from "kysely";
import type { DB, Layer } from "../db/types";

export class LayerRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async listLayers(): Promise<Layer[]> {
    return this.db.selectFrom("layer").selectAll().orderBy("created_at", "asc").execute();
  }

  async getLayer(layerId: string): Promise<Layer | undefined> {
    return this.db.selectFrom("layer").selectAll().where("id", "=", layerId).executeTakeFirst();
  }

  async createLayer(name: string): Promise<Layer> {
    return this.db
      .insertInto("layer")
      .values({ name })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async renameLayer(layerId: string, name: string): Promise<Layer> {
    return this.db
      .updateTable("layer")
      .set({ name })
      .where("id", "=", layerId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteLayer(layerId: string): Promise<void> {
    await this.db.deleteFrom("layer").where("id", "=", layerId).execute();
  }
}
