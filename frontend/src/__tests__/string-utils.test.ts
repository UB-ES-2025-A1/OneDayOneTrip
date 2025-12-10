import { describe, it, expect } from "vitest";

const toTitleCase = (input: string) =>
  input
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

describe("string utils", () => {
  it("converts to title case", () => {
    expect(toTitleCase("hello world")).toBe("Hello World");
  });

  it("handles extra spaces", () => {
    expect(toTitleCase("   multiple   words  here ")).toBe("Multiple Words Here");
  });
});

