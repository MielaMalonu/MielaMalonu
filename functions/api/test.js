export async function onRequest({ request, env }) {
  const SUPABASE_URL = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1";
  const API_KEY = env.SUPABASE_KEY;

  const url = new URL(request.url);
  const path = url.pathname.replace("/api/test", "");
  const query = url.search;
  const fullSupabaseUrl = `${SUPABASE_URL}${path}${query}`;

  const newHeaders = new Headers({
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  });

  const proxyRequest = new Request(fullSupabaseUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined
  });

  const response = await fetch(proxyRequest);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json"
    }
  });
}
