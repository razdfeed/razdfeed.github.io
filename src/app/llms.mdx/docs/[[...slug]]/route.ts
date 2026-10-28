import { notFound } from 'next/navigation';
import { getLLMText, source } from '@/lib/source';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return source.generateParams().map((p) => ({
    slug: [...p.slug, 'content.md'],
  }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await ctx.params;
  // drop the appended "content.md": /docs/ is rewritten to the root page
  const page = source.getPage((slug ?? []).slice(0, -1));
  if (!page) notFound();

  console.info('[md] %s', page.url);
  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
