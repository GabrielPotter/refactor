import { sanitizePatch } from "../src/db/utils";

describe("sanitizePatch", () => {
  it("removes undefined values while preserving others", () => {
    const patch = { keep: 1, remove: undefined, nested: { value: 2 }, allowNull: null };
    expect(sanitizePatch(patch)).toEqual({ keep: 1, nested: { value: 2 }, allowNull: null });
  });

  it("returns an empty object when all fields are undefined", () => {
    const patch = { a: undefined, b: undefined };
    expect(sanitizePatch(patch)).toEqual({});
  });
});
