import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { caseStudySchema } from "./utils/case-study-schema";

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/case-studies" }),
  schema: ({ image }) => caseStudySchema(image),
});

export const collections = { "case-studies": caseStudies };
