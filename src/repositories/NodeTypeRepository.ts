import { eq } from "drizzle-orm";

import { node_types } from "../db/schema";
import type { Database, NewNodeType, NodeType, NodeTypePatch } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class NodeTypeRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewNodeType): Promise<NodeType> {
    const [inserted] = await this.db.insert(node_types).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert node_types row");
    }
    return inserted;
  }

  public async read(id: string): Promise<NodeType | undefined> {
    const [row] = await this.db.select().from(node_types).where(eq(node_types.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: NodeTypePatch): Promise<NodeType | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(node_types)
      .set(updateValues)
      .where(eq(node_types.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(node_types).where(eq(node_types.id, id)).execute();
  }
}
