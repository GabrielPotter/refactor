import { eq } from "drizzle-orm";

import { app_info } from "../db/schema";
import type { AppInfo, AppInfoPatch, Database, NewAppInfo } from "../db/types";
import { sanitizePatch } from "../db/utils";

export class AppInfoRepository {
  public constructor(private readonly db: Database) {}

  public async create(values: NewAppInfo): Promise<AppInfo> {
    const [inserted] = await this.db.insert(app_info).values(values).returning().execute();
    if (!inserted) {
      throw new Error("Failed to insert app_info row");
    }
    return inserted;
  }

  public async read(name: string): Promise<AppInfo | undefined> {
    const [row] = await this.db.select().from(app_info).where(eq(app_info.name, name)).limit(1).execute();
    return row;
  }

  public async update(name: string, patch: AppInfoPatch): Promise<AppInfo | undefined> {
    const updateValues = sanitizePatch(patch);

    if (Object.keys(updateValues).length === 0) {
      return this.read(name);
    }

    const [updated] = await this.db
      .update(app_info)
      .set(updateValues)
      .where(eq(app_info.name, name))
      .returning()
      .execute();

    return updated;
  }

  public async delete(name: string): Promise<void> {
    await this.db.delete(app_info).where(eq(app_info.name, name)).execute();
  }
}
