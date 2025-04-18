export async function onRequest({ request, env }) {
  // Initial debug information
  console.log("========== SUPABASE FUNCTION DEBUG ==========");
  console.log("Function triggered at:", new Date().toISOString());
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log("Headers:", JSON.stringify(Object.fromEntries(request.headers), null, 2));
  
  // Capture raw URL components
  const url = new URL(request.url);
  console.log("URL components:", {
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    host: url.host
  });
  
  // Check environment variables
  if (!env.SUPABASE_KEY) {
    console.error("CRITICAL ERROR: SUPABASE_KEY environment variable not found");
    return new Response(JSON.stringify({
      error: "SUPABASE_KEY environment variable not found",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  console.log("Environment variables loaded successfully");
  
  // Parse the path - this is where the issue might be
  const originalPath = url.pathname;
  const path = url.pathname.replace("/api/supabase", "");
  console.log("Path transformation:", {
    original: originalPath,
    afterReplacement: path,
    didChange: originalPath !== path
  });
  
  // Check if path replacement worked correctly
  if (originalPath === path) {
    console.error("WARNING: Path replacement did not change anything - check URL pattern");
  }
  
  // Validate path
  if (!path || path === "/") {
    console.error("No table name found in path");
    return new Response(JSON.stringify({
      error: "No table name provided in path",
      requestPath: originalPath,
      processedPath: path,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Set up Supabase request
  const SUPABASE_URL = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1";
  const API_KEY = env.SUPABASE_KEY;
  const query = url.search;
  
  const fullSupabaseUrl = `${SUPABASE_URL}${path}${query}`;
  console.log("Constructed Supabase URL:", fullSupabaseUrl);
  
  // Prepare request body
  let requestBody;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      requestBody = await request.text();
      console.log("Request body:", requestBody.substring(0, 500) + (requestBody.length > 500 ? "..." : ""));
    } catch (error) {
      console.error("Error reading request body:", error);
      requestBody = undefined;
    }
  }
  
  // Make the request to Supabase
  try {
    console.log("Sending request to Supabase...");
    const proxyRequest = new Request(fullSupabaseUrl, {
      method: request.method,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: requestBody
    });
    
    console.log("Request headers:", JSON.stringify(Object.fromEntries(proxyRequest.headers), null, 2));
    
    const response = await fetch(proxyRequest);
    console.log("Supabase response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers)
    });
    
    // Get response body
    const body = await response.text();
    console.log("Response body preview:", body.substring(0, 500) + (body.length > 500 ? "..." : ""));
    
    // Check if response is valid JSON
    let isJson = true;
    try {
      JSON.parse(body);
    } catch (e) {
      isJson = false;
      console.error("Response is not valid JSON", e);
    }
    
    console.log("Response is valid JSON:", isJson);
    
    // Create response with CORS headers
    const responseHeaders = new Headers({
      "Content-Type": response.headers.get("Content-Type") || (isJson ? "application/json" : "text/plain"),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
    });
    
    console.log("Returning response to client");
    return new Response(body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("ERROR in Supabase request:", error);
    return new Response(JSON.stringify({
      error: `Error connecting to Supabase: ${error.message}`,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } finally {
    console.log("========== END SUPABASE FUNCTION ==========");
  }
}

// Handle OPTIONS requests for CORS
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
