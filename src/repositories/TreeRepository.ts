import { eq } from "drizzle-orm";

import { tree } from "../db/schema";
import type { Database, NewTree, Tree, TreePatch } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class TreeRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewTree): Promise<Tree> {
    const [inserted] = await this.db.insert(tree).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert tree row");
    }
    return inserted;
  }

  public async read(id: string): Promise<Tree | undefined> {
    const [row] = await this.db.select().from(tree).where(eq(tree.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: TreePatch): Promise<Tree | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(tree)
      .set(updateValues)
      .where(eq(tree.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(tree).where(eq(tree.id, id)).execute();
  }
}
