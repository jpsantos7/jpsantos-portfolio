interface CaseStudyLike {
  id: string;
  data: { draft: boolean; order: number };
}

/**
 * The Case studies a page may show, in `order`. Drafts are dropped in
 * production builds only. Pass `production: import.meta.env.PROD`.
 */
export const publishedCaseStudies = <T extends CaseStudyLike>(
  entries: readonly T[],
  { production }: { production: boolean },
): T[] =>
  entries
    .filter((e) => !(production && e.data.draft))
    .sort(
      (a, b) =>
        a.data.order - b.data.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
