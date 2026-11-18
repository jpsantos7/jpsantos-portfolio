import { describe, expect, it } from "vitest";
import {
  THEME_SCRIPT,
  THEME_SCRIPT_MAX_BYTES,
} from "../src/scripts/theme-init";

type Listener = (e: unknown) => void;

// A minimal fake DOM: enough to run the script and click the toggle.
function run(opts: {
  stored?: string | "throw";
  osDark?: boolean;
  transitions?: boolean;
}) {
  const store = new Map<string, string>();
  const throws = opts.stored === "throw";
  if (typeof opts.stored === "string" && !throws)
    store.set("theme", opts.stored);
  const dataset: Record<string, string> = {};
  const classes = new Set<string>();
  const pressed: string[] = [];
  const listeners: Record<string, Listener> = {};
  const button = {
    setAttribute: (_n: string, v: unknown) => pressed.push(String(v)),
  };
  const localStorage = {
    getItem: (k: string) => {
      if (throws) throw new Error("blocked");
      return store.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (throws) throw new Error("blocked");
      store.set(k, v);
    },
    removeItem: (k: string) => {
      if (throws) throw new Error("blocked");
      store.delete(k);
    },
  };
  // Each fake transition runs its update callback at once (as browsers do, even when
  // skipped) and settles `finished` on demand: resolve() or reject() (a skipped one).
  const transitions: { resolve: () => void; reject: () => void }[] = [];
  const startViewTransition = (cb: () => void) => {
    cb();
    let resolve!: () => void;
    let reject!: () => void;
    const finished = new Promise<void>((res, rej) => {
      resolve = res;
      reject = () => rej(new DOMException("skipped", "AbortError"));
    });
    transitions.push({ resolve, reject });
    return { finished };
  };
  const document = {
    ...(opts.transitions ? { startViewTransition } : {}),
    documentElement: {
      dataset,
      classList: {
        add: (c: string) => classes.add(c),
        remove: (c: string) => classes.delete(c),
      },
    },
    querySelectorAll: () => [button],
    addEventListener: (n: string, l: Listener) => (listeners[n] = l),
  };
  const matchMedia = () => ({
    matches: opts.osDark ?? false,
    addEventListener: () => {},
  });
  new Function(
    "document",
    "matchMedia",
    "localStorage",
    "addEventListener",
    THEME_SCRIPT,
  )(document, matchMedia, localStorage, () => {});
  const click = (onToggle = true) =>
    listeners["click"]?.({
      target: { closest: () => (onToggle ? {} : null) },
    });
  return { dataset, classes, store, click, pressed, transitions };
}

describe("theme script", () => {
  it("fits the byte allowance", () => {
    expect(Buffer.byteLength(THEME_SCRIPT)).toBeLessThanOrEqual(
      THEME_SCRIPT_MAX_BYTES,
    );
  });

  it("marks html.js and sets no theme without a saved choice", () => {
    const r = run({});
    expect(r.classes.has("js")).toBe(true);
    expect(r.dataset["theme"]).toBeUndefined();
  });

  it("applies a saved choice before anything else", () => {
    expect(run({ stored: "dark" }).dataset["theme"]).toBe("dark");
  });

  it("ignores stored values other than light or dark", () => {
    expect(run({ stored: "sepia" }).dataset["theme"]).toBeUndefined();
  });

  it("falls back to the OS theme when storage throws, and still toggles", () => {
    const r = run({ stored: "throw", osDark: false });
    expect(r.dataset["theme"]).toBeUndefined();
    r.click();
    expect(r.dataset["theme"]).toBe("dark");
  });

  it("saves a choice that differs from the OS and drops it when it matches", () => {
    const r = run({ osDark: false });
    r.click();
    expect(r.store.get("theme")).toBe("dark");
    expect(r.dataset["theme"]).toBe("dark");
    r.click();
    expect(r.store.has("theme")).toBe(false);
    expect(r.dataset["theme"]).toBeUndefined();
  });

  it("ignores clicks elsewhere", () => {
    const r = run({});
    r.click(false);
    expect(r.dataset["theme"]).toBeUndefined();
    expect(r.store.has("theme")).toBe(false);
  });

  describe("view transitions", () => {
    const tick = () => new Promise((r) => setTimeout(r, 0));

    it("adds html.theme-fade for the transition and removes it when done", async () => {
      const r = run({ transitions: true });
      r.click();
      expect(r.classes.has("theme-fade")).toBe(true);
      expect(r.dataset["theme"]).toBe("dark");
      r.transitions[0]!.resolve();
      await tick();
      expect(r.classes.has("theme-fade")).toBe(false);
    });

    it("keeps theme-fade until the latest transition ends, with no unhandled rejection", async () => {
      const unhandled: unknown[] = [];
      const onUnhandled = (e: unknown) => unhandled.push(e);
      process.on("unhandledRejection", onUnhandled);
      const r = run({ transitions: true });
      r.click();
      r.click();
      r.transitions[0]!.reject(); // the first is skipped by the second
      await tick();
      expect(r.classes.has("theme-fade")).toBe(true);
      r.transitions[1]!.resolve();
      await tick();
      expect(r.classes.has("theme-fade")).toBe(false);
      await tick();
      process.off("unhandledRejection", onUnhandled);
      expect(unhandled).toEqual([]);
    });

    it("removes theme-fade when the latest transition itself is skipped", async () => {
      const r = run({ transitions: true });
      r.click();
      r.transitions[0]!.reject();
      await tick();
      expect(r.classes.has("theme-fade")).toBe(false);
    });
  });
});
