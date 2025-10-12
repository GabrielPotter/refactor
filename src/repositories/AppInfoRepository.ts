import { Kysely } from "kysely";
import type { AppInfo, AppInfoPatch, DB, NewAppInfo } from "../db/types";

export class AppInfoRepository {
  public constructor(private readonly db: Kysely<DB>) {}

  public async create(values: NewAppInfo): Promise<AppInfo> {
    return this.db.insertInto("app_info").values(values).returningAll().executeTakeFirstOrThrow();
  }

  public async read(name: string): Promise<AppInfo | undefined> {
    return this.db.selectFrom("app_info").selectAll().where("name", "=", name).executeTakeFirst();
  }

  public async update(name: string, patch: AppInfoPatch): Promise<AppInfo | undefined> {
    return this.db
      .updateTable("app_info")
      .set(patch)
      .where("name", "=", name)
      .returningAll()
      .executeTakeFirst();
  }

  public async delete(name: string): Promise<void> {
    await this.db.deleteFrom("app_info").where("name", "=", name).execute();
  }
}
