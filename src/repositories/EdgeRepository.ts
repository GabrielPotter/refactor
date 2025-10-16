import { eq } from "drizzle-orm";

import { edge } from "../db/schema";
import type { Database, Edge, EdgePatch, NewEdge } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class EdgeRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewEdge): Promise<Edge> {
    const [inserted] = await this.db.insert(edge).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert edge row");
    }
    return inserted;
  }

  public async read(id: string): Promise<Edge | undefined> {
    const [row] = await this.db.select().from(edge).where(eq(edge.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: EdgePatch): Promise<Edge | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(edge)
      .set(updateValues)
      .where(eq(edge.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(edge).where(eq(edge.id, id)).execute();
  }
}
