import type { APIRoute } from "astro";
import { ENABLED_LOCALES } from "../config";
import { vendureClient } from "../lib/util/vendure-client";
import { graphql } from "../graphql/graphql";

const SitemapProductsQuery = graphql(`
  query GetSitemapProducts($skip: Int!, $take: Int!) {
    products(options: { skip: $skip, take: $take }) {
      items {
        slug
        updatedAt
      }
      totalItems
    }
  }
`);

const SitemapCollectionsQuery = graphql(`
  query GetSitemapCollections($skip: Int!, $take: Int!) {
    collections(options: { skip: $skip, take: $take }) {
      items {
        slug
        updatedAt
      }
      totalItems
    }
  }
`);

const SITEMAP_BATCH_SIZE = 100;

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
    const products: { slug: string; updatedAt: string }[] = [];
    let skipProducts = 0;
    let hasMoreProducts = true;
    while (hasMoreProducts) {
      const { products: p } = await vendureClient(locale).request(
        SitemapProductsQuery,
        {
          skip: skipProducts,
          take: SITEMAP_BATCH_SIZE,
        },
      );
      products.push(...p.items);
      skipProducts += SITEMAP_BATCH_SIZE;
      hasMoreProducts =
        p.items.length === SITEMAP_BATCH_SIZE && skipProducts < p.totalItems;
    }

    const collections: { slug: string; updatedAt: string }[] = [];
    let skipCollections = 0;
    let hasMoreCollections = true;
    while (hasMoreCollections) {
      const { collections: c } = await vendureClient(locale).request(
        SitemapCollectionsQuery,
        {
          skip: skipCollections,
          take: SITEMAP_BATCH_SIZE,
        },
      );
      collections.push(...c.items);
      skipCollections += SITEMAP_BATCH_SIZE;
      hasMoreCollections =
        c.items.length === SITEMAP_BATCH_SIZE && skipCollections < c.totalItems;
    }

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
