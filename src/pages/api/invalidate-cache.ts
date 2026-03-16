import type { APIRoute } from "astro";
import { cache } from "../../config";

/**
 * Invalidate cache. Requires a valid token in the Authorization header.
 */
export const GET: APIRoute = async ({ request }) => {
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
  await cache.expireAllEntries();
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
