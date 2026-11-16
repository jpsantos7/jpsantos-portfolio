import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { routes } from "../scripts/routes.mjs";

describe("routes", () => {
  it("throws a clear error when dist is missing", () => {
    expect(() => routes(join(tmpdir(), "no-such-dist-dir"))).toThrow(
      "dist/ not found: run npm run build first",
    );
  });
});
