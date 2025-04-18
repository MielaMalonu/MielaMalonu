export async function onRequest({ request }) {
  const SUPABASE_URL = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1";
  const API_KEY = process.env.SUPABASE_API_KEY;

  // Use the request URL to extract the sub-path (e.g., /api/supabase/posts?id=eq.1)
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/supabase", "");
  const query = url.search;

  const fullSupabaseUrl = `${SUPABASE_URL}${path}${query}`;

  // Clone headers and add required Supabase headers
  const newHeaders = new Headers(request.headers);
  newHeaders.set("apikey", API_KEY);
  newHeaders.set("Authorization", `Bearer ${API_KEY}`);

  // Forward method and body
  const proxyRequest = new Request(fullSupabaseUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
  });

  const response = await fetch(proxyRequest);
  const responseBody = await response.text();

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    },
  });
}
