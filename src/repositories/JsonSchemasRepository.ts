import { eq } from "drizzle-orm";

import { json_schemas } from "../db/schema";
import type { Database, JsonSchema, JsonSchemaPatch, NewJsonSchema } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class JsonSchemasRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewJsonSchema): Promise<JsonSchema> {
    const [inserted] = await this.db.insert(json_schemas).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert json_schemas row");
    }
    return inserted;
  }

  public async read(id: string): Promise<JsonSchema | undefined> {
    const [row] = await this.db.select().from(json_schemas).where(eq(json_schemas.id, id)).limit(1).execute();
    return row;
  }

  public async update(id: string, patch: JsonSchemaPatch): Promise<JsonSchema | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(id);
    }

    const [updated] = await this.db
      .update(json_schemas)
      .set(updateValues)
      .where(eq(json_schemas.id, id))
      .returning()
      .execute();

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(json_schemas).where(eq(json_schemas.id, id)).execute();
  }
}
