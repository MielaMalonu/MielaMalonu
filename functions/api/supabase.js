export async function onRequest({ request, env }) {
  console.log("Supabase function called with URL:", request.url);
  console.log("Request method:", request.method);
  
  // Check if environment variable exists
  if (!env.SUPABASE_KEY) {
    console.error("Error: SUPABASE_KEY not found in environment variables");
    return new Response("❌ API key not found in environment", { status: 500 });
  }
  
  const SUPABASE_URL = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1";
  const API_KEY = env.SUPABASE_KEY;
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/supabase", "");
  const query = url.search;
  
  console.log("Path after replacement:", path);
  console.log("Query string:", query);
  
  if (!path || path === "/") {
    console.error("No table name provided in path");
    return new Response("❌ No table name provided in path.", { status: 400 });
  }
  
  const fullSupabaseUrl = `${SUPABASE_URL}${path}${query}`;
  console.log("Full Supabase URL:", fullSupabaseUrl);
  
  try {
    const proxyRequest = new Request(fullSupabaseUrl, {
      method: request.method,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined
    });
    
    console.log("Sending proxy request to Supabase");
    const response = await fetch(proxyRequest);
    console.log("Received response from Supabase with status:", response.status);
    
    const body = await response.text();
    console.log("Response body length:", body.length);
    
    // Add CORS headers to allow cross-origin requests
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
    });
    
    return new Response(body, {
      status: response.status,
      headers: headers
    });
  } catch (error) {
    console.error("Error in Supabase function:", error.message);
    return new Response(`❌ Error: ${error.message}`, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      "Access-Control-Max-Age": "86400"
    }
  });
}
