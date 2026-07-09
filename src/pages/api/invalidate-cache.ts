import type { APIRoute } from "astro";

/**
 * Invalidate cache. Requires a valid token in the Authorization header.
 *
 * Query parameters:
 *   - tags: comma-separated list of tags to invalidate (e.g. ?tags=home,product,product:slug-1)
 *
 * If no tags are provided, all legacy SWR cache entries are expired.
 */
export const GET: APIRoute = async (context) => {
  const { request, url, cache: routeCache } = context;

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(`Bearer `, "").trim();
  if (token !== import.meta.env.CACHE_INVALIDATION_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  const tagsParam = url.searchParams.get("tags");
  if (tagsParam) {
    const tags = tagsParam
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    await routeCache.invalidate({ tags });
    const message = `Cache invalidated for tags: ${tags.join(", ")}`;
    console.log(message);
    return new Response(JSON.stringify({ success: true, message }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  await routeCache.invalidate({});
  console.log("Cache invalidated");
  return new Response(
    JSON.stringify({ success: true, message: "Cache invalidated" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
};
