import { describe, it, expect } from "vitest";

const add = (a: number, b: number) => a + b;

describe("math utils", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("supports negatives", () => {
    expect(add(-2, -3)).toBe(-5);
  });
});

