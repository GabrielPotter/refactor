import { Kysely } from "kysely";
import type { DB, Edge, EdgePatch, EdgeProps } from "../db/types";

type CreateEdgeInput = {
  layerId: string;
  name: string;
  from: string;
  to: string;
  props?: EdgeProps;
};

export class EdgeRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async listEdges(): Promise<Edge[]> {
    return this.db.selectFrom("edge").selectAll().orderBy("created_at", "asc").execute();
  }

  async listEdgesByLayer(layerId: string): Promise<Edge[]> {
    return this.db
      .selectFrom("edge")
      .selectAll()
      .where("layer_id", "=", layerId)
      .orderBy("created_at", "asc")
      .execute();
  }

  async getEdge(edgeId: string): Promise<Edge | undefined> {
    return this.db.selectFrom("edge").selectAll().where("id", "=", edgeId).executeTakeFirst();
  }

  async createEdge(input: CreateEdgeInput): Promise<Edge> {
    return this.db
      .insertInto("edge")
      .values({
        layer_id: input.layerId,
        name: input.name,
        from: input.from,
        to: input.to,
        props: (input.props ?? {}) as any,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateEdge(edgeId: string, patch: EdgePatch): Promise<Edge | undefined> {
    if (!Object.keys(patch).length) {
      return this.getEdge(edgeId);
    }

    const { props, ...rest } = patch as EdgePatch & { props?: EdgeProps };
    const updatePayload: Record<string, unknown> = { ...rest };
    if (props !== undefined) {
      updatePayload.props = props as any;
    }

    return this.db
      .updateTable("edge")
      .set(updatePayload)
      .where("id", "=", edgeId)
      .returningAll()
      .executeTakeFirst();
  }

  async deleteEdge(edgeId: string): Promise<void> {
    await this.db.deleteFrom("edge").where("id", "=", edgeId).execute();
  }
}
