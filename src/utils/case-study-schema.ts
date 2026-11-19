import { z } from "astro/zod";

/** "About 6" in decision 006; 6 is provisional. */
const STACK_MAX = 6;

type ImageShape = { width: number; height: number };
type ImageHelper<I extends ImageShape> = () => z.ZodType<I>;

/**
 * Cover: the image plus its focal point (percent from the top-left, used by the
 * 16:10 Work row crop and the full-screen Case study crop) and where the stock
 * photo came from (credited in the Colophon). The Cover's pixel size is checked
 * by `scripts/check-media-sizes.mjs`, which the build runs first.
 */
const coverSchema = <I extends ImageShape>(image: ImageHelper<I>) =>
  z.object({
    image: image(),
    focalPoint: z.object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    }),
    sourceUrl: webUrl,
    photographer: z.string().min(1),
  });

const webUrl = z.url({ protocol: /^https?$/ });

const oneLine = z
  .string()
  .min(1)
  .refine((s) => !/[\r\n]/.test(s), "Must be one line.");

/** The Case study collection schema. `image` is Astro's schema helper. */
export const caseStudySchema = <I extends ImageShape>(image: ImageHelper<I>) =>
  z
    .object({
      title: z.string().min(1),
      outcome: oneLine,
      results: z
        .array(
          z.object({
            claim: z.string().min(1),
            evidence: z.string().min(1).optional(),
          }),
        )
        .min(1)
        .max(3),
      disclosure: z.enum(["named", "anonymised", "outcome-only"]),
      // At a glance
      role: z.string().min(1),
      team: z.string().min(1),
      period: z.string().min(1),
      employer: z.string().min(1),
      client: z.string().min(1).optional(),
      industry: z.string().min(1).optional(),
      scale: z.string().min(1).optional(),
      stack: z.array(z.string().min(1)).max(STACK_MAX),
      cover: coverSchema(image),
      sources: z
        .array(z.object({ label: z.string().min(1), url: webUrl }))
        .optional(),
      order: z.number().int(),
      draft: z.boolean().default(false),
    })
    .superRefine((d, ctx) => {
      const need = (field: "client" | "industry" | "scale") =>
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is required when disclosure is ${d.disclosure}.`,
        });
      if (d.disclosure === "named") {
        if (!d.client) need("client");
      } else {
        if (d.client) {
          ctx.addIssue({
            code: "custom",
            path: ["client"],
            message: "client is allowed only when disclosure is named.",
          });
        }
        if (!d.industry) need("industry");
        if (!d.scale) need("scale");
      }
    });
