import { eq } from "drizzle-orm";

import { layer } from "../db/schema";
import type { Database, Layer, LayerPatch, NewLayer } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class LayerRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewLayer): Promise<Layer> {
    const [inserted] = await this.db.insert(layer).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert layer row");
    }
    return inserted;
  }

  public async read(id: string): Promise<Layer | undefined> {
    const [row] = await this.db.select().from(layer).where(eq(layer.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: LayerPatch): Promise<Layer | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(layer)
      .set(updateValues)
      .where(eq(layer.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(layer).where(eq(layer.id, id)).execute();
  }
}
