import { describe, it, expect } from "vitest";

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));

describe("array utils", () => {
  it("removes duplicates", () => {
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
  });

  it("works with strings", () => {
    expect(unique(["a", "a", "b"])).toEqual(["a", "b"]);
  });
});

