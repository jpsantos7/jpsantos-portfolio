/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig lets Vitest import .astro files (the Container API tests).
export default getViteConfig({
  test: { include: ["tests/**/*.test.ts"] },
});
