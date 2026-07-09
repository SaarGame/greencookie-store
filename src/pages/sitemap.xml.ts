import type { APIRoute } from "astro";
import { ENABLED_LOCALES } from "../config";
import { getSitemapCollections } from "../lib/server/collection-service";
import { getSitemapProducts } from "../lib/server/product-service";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toSitemapLastmod(updatedAt: any): string {
  return new Date(updatedAt).toISOString().slice(0, 10);
}

/**
 * Fetch all the sitemap entries and build the XML response.
 */
async function buildSitemapXml(baseUrl: string): Promise<string> {
  const urlEntries: { loc: string; lastmod: string }[] = [];

  for (const locale of ENABLED_LOCALES) {
    const [products, collections] = await Promise.all([
      getSitemapProducts(locale),
      getSitemapCollections(locale),
    ]);
    // Home
    urlEntries.push({
      loc: `${baseUrl}/${locale}/`,
      lastmod: toSitemapLastmod(new Date()),
    });
    // Products
    for (const { slug, updatedAt } of products) {
      urlEntries.push({
        loc: `${baseUrl}/${locale}/p/${slug}`,
        lastmod: toSitemapLastmod(updatedAt),
      });
    }
    // Collections
    for (const { slug, updatedAt } of collections) {
      urlEntries.push({
        loc: `${baseUrl}/${locale}/c/${slug}`,
        lastmod: toSitemapLastmod(updatedAt),
      });
    }
  }

  const urlLines = urlEntries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlLines}
</urlset>`;
}

export const GET: APIRoute = async ({ url, cache }) => {
  const baseUrl = url.origin;
  const xml = await buildSitemapXml(baseUrl);
  cache.set({ maxAge: 43200, swr: 3600, tags: ["sitemap"] });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
