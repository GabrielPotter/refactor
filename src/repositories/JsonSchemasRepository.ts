import { Kysely } from "kysely";
import type { DB, JsonSchema, JsonSchemaPatch, NewJsonSchema } from "../db/types";

export class JsonSchemasRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewJsonSchema): Promise<JsonSchema> {
    return this.db
      .insertInto("json_schemas")
      .values(values)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async read(id: string): Promise<JsonSchema | undefined> {
    return this.db.selectFrom("json_schemas").selectAll().where("id", "=", id).executeTakeFirst();
  }

  public async update(id: string, patch: JsonSchemaPatch): Promise<JsonSchema | undefined> {
    return this.db
      .updateTable("json_schemas")
      .set(patch)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(id: string): Promise<void> {
    await this.db.deleteFrom("json_schemas").where("id", "=", id).execute();
  }
}
