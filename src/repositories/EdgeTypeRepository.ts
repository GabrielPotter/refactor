import { eq } from "drizzle-orm";

import { edge_types } from "../db/schema";
import type { Database, EdgeType, EdgeTypePatch, NewEdgeType } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class EdgeTypeRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewEdgeType): Promise<EdgeType> {
    const [inserted] = await this.db.insert(edge_types).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert edge_types row");
    }
    return inserted;
  }

  public async read(id: string): Promise<EdgeType | undefined> {
    const [row] = await this.db.select().from(edge_types).where(eq(edge_types.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: EdgeTypePatch): Promise<EdgeType | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(edge_types)
      .set(updateValues)
      .where(eq(edge_types.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(edge_types).where(eq(edge_types.id, id)).execute();
  }
}
