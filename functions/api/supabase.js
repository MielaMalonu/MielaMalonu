export async function onRequest(context) {
  const { request, env } = context;

  // Secure Supabase REST endpoint and API key from environment
  const SUPABASE_URL = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1";
  const API_KEY = env.SUPABASE_KEY;

  // Construct full Supabase URL from incoming request
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/supabase", "");
  const query = url.search;
  const fullSupabaseUrl = `${SUPABASE_URL}${path}${query}`;

  // Always use server-side API key, ignore client headers
  const newHeaders = new Headers({
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  });

  // Forward request with body if applicable
  const proxyRequest = new Request(fullSupabaseUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined
  });

  try {
    const response = await fetch(proxyRequest);
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Proxy request failed",
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
