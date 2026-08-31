import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combina clases y descarta valores falsy", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("resuelve conflictos de Tailwind (gana la última)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
