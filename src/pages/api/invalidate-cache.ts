import type { APIRoute } from "astro";

const ALL_STOREFRONT_TAGS = ["home", "collection", "product", "sitemap"];

/**
 * Invalidate cache. Requires a valid token in the Authorization header.
 *
 * Query parameters:
 *   - tags: comma-separated list of tags to invalidate (e.g. ?tags=home,product,product:slug-1)
 *
 * If no tags are provided, all storefront cache tags are purged globally at the Cloudflare edge.
 */
const handleInvalidate: APIRoute = async (context) => {
  const { request, url, cache: routeCache } = context;

  const secret = import.meta.env.CACHE_INVALIDATION_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!secret || token !== secret) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const tagsParam = url.searchParams.get("tags");
  const parsedTags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  const tags = parsedTags.length > 0 ? parsedTags : ALL_STOREFRONT_TAGS;

  await routeCache.invalidate({ tags });
  const message = `Cache invalidated for tags: ${tags.join(", ")}`;
  console.log(message);

  return new Response(JSON.stringify({ success: true, message, tags }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};

export const GET = handleInvalidate;
export const POST = handleInvalidate;
