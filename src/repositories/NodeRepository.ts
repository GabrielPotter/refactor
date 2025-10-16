import { eq } from "drizzle-orm";

import { node } from "../db/schema";
import type { Database, NewNode, Node, NodePatch } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class NodeRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewNode): Promise<Node> {
    const [inserted] = await this.db.insert(node).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert node row");
    }
    return inserted;
  }

  public async read(id: string): Promise<Node | undefined> {
    const [row] = await this.db.select().from(node).where(eq(node.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: NodePatch): Promise<Node | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(node)
      .set(updateValues)
      .where(eq(node.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(node).where(eq(node.id, id)).execute();
  }
}
