import { tree } from "../src/db/schema";
import type { Database, NewTree, Tree, TreePatch } from "../src/db/types";
import { TreeRepository } from "../src/repositories/TreeRepository";

type InsertChain = {
  insert: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
};

type SelectChain = {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
};

type UpdateChain = {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  returning: jest.Mock;
};

type DeleteChain = {
  delete: jest.Mock;
  where: jest.Mock;
};

const createInsertChain = (responses: Tree[][]): InsertChain => {
  const returning = jest.fn(async () => responses.shift() ?? []);
  const values = jest.fn(() => ({ returning }));
  const insert = jest.fn(() => ({ values }));
  return { insert, values, returning };
};

const createSelectChain = (responses: Tree[][]): SelectChain => {
  const limit = jest.fn(async () => responses.shift() ?? []);
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  const select = jest.fn(() => ({ from }));
  return { select, from, where, limit };
};

const createUpdateChain = (responses: Tree[][]): UpdateChain => {
  const returning = jest.fn(async () => responses.shift() ?? []);
  const where = jest.fn(() => ({ returning }));
  const set = jest.fn(() => ({ where }));
  const update = jest.fn(() => ({ set }));
  return { update, set, where, returning };
};

const createDeleteChain = (): DeleteChain => {
  const where = jest.fn(async () => []);
  const del = jest.fn(() => ({ where }));
  return { delete: del, where };
};

const buildRepository = (overrides: Partial<Record<keyof Database, jest.Mock>> = {}) => {
  const repoDependencies: Partial<Record<keyof Database, jest.Mock>> = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    ...overrides,
  };

  return new TreeRepository(repoDependencies as unknown as Database);
};

const sampleTree = (overrides: Partial<Tree> = {}): Tree => {
  const now = new Date();
  return {
    id: overrides.id ?? "tree-1",
    name: overrides.name ?? "Example Tree",
    props: overrides.props ?? {},
    props_schema: overrides.props_schema ?? "schema-1",
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
};

describe("TreeRepository (Drizzle)", () => {
  it("creates a tree and returns the inserted row", async () => {
    const newTree: NewTree = { name: "Docs", props: {}, props_schema: "schema-42" };
    const inserted = sampleTree({ ...newTree, id: "tree-42" });

    const insertChain = createInsertChain([[inserted]]);
    const repo = buildRepository({ insert: insertChain.insert });

    const result = await repo.create(newTree);

    expect(result).toEqual(inserted);
    expect(insertChain.insert).toHaveBeenCalledWith(tree);
    expect(insertChain.values).toHaveBeenCalledWith(newTree);
    expect(insertChain.returning).toHaveBeenCalledTimes(1);
  });

  it("reads a tree by id", async () => {
    const row = sampleTree({ id: "tree-123" });
    const selectChain = createSelectChain([[row]]);
    const repo = buildRepository({ select: selectChain.select });

    const result = await repo.read("tree-123");

    expect(result).toEqual(row);
    expect(selectChain.select).toHaveBeenCalled();
    expect(selectChain.from).toHaveBeenCalledWith(tree);
  });

  it("updates a tree with defined patch values", async () => {
    const id = "tree-5";
    const updated = sampleTree({ id, name: "Renamed" });
    const updateChain = createUpdateChain([[updated]]);

    const repo = buildRepository({ update: updateChain.update });
    const result = await repo.update(id, { name: "Renamed", props: undefined } as TreePatch);

    expect(result).toEqual(updated);
    expect(updateChain.update).toHaveBeenCalledWith(tree);
    expect(updateChain.set).toHaveBeenCalledWith({ name: "Renamed" });
    expect(updateChain.returning).toHaveBeenCalledTimes(1);
  });

  it("falls back to read when the patch has no defined fields", async () => {
    const id = "tree-9";
    const row = sampleTree({ id });
    const selectChain = createSelectChain([[row]]);
    const updateChain = createUpdateChain([[]]);

    const repo = buildRepository({
      select: selectChain.select,
      update: updateChain.update,
    });

    const result = await repo.update(id, {} as TreePatch);

    expect(result).toEqual(row);
    expect(updateChain.set).not.toHaveBeenCalled();
    expect(selectChain.select).toHaveBeenCalledTimes(1);
  });

  it("deletes a tree by id", async () => {
    const deleteChain = createDeleteChain();
    const repo = buildRepository({ delete: deleteChain.delete });

    await repo.delete("tree-7");

    expect(deleteChain.delete).toHaveBeenCalledWith(tree);
    expect(deleteChain.where).toHaveBeenCalledTimes(1);
  });
});
