import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { headersFor, writeHeaders } from "../scripts/noindex-headers.mjs";

describe("noindex headers", () => {
  it("sends noindex for every non-production context", () => {
    for (const context of ["deploy-preview", "branch-deploy", "dev"]) {
      expect(headersFor(context)).toContain("X-Robots-Tag: noindex");
    }
  });

  it("sends nothing for production or without a context", () => {
    expect(headersFor("production")).toBeNull();
    expect(headersFor(undefined)).toBeNull();
  });

  it("writes _headers only for non-production", () => {
    const dir = mkdtempSync(join(tmpdir(), "headers-"));
    expect(writeHeaders(dir, "production")).toBe(false);
    expect(existsSync(join(dir, "_headers"))).toBe(false);
    expect(writeHeaders(dir, "branch-deploy")).toBe(true);
    expect(readFileSync(join(dir, "_headers"), "utf8")).toBe(
      "/*\n  X-Robots-Tag: noindex\n",
    );
  });

  it("works as the build step", () => {
    const dir = mkdtempSync(join(tmpdir(), "headers-cli-"));
    const run = (context: string) =>
      execFileSync("node", ["scripts/noindex-headers.mjs", dir], {
        env: { ...process.env, CONTEXT: context },
      });
    run("production");
    expect(existsSync(join(dir, "_headers"))).toBe(false);
    run("branch-deploy");
    expect(readFileSync(join(dir, "_headers"), "utf8")).toContain("noindex");
  });
});
