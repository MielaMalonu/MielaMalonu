// /functions/api/supabase.js
export async function onRequest(context) {
  // Access environment variables from context
  const { SUPABASE_SERVICE_KEY } = context.env;
  
  // Parse the request
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/supabase', '');
  const supabaseUrl = "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1" + path;
  
  // Forward the request to Supabase with your service key
  const response = await fetch(supabaseUrl, {
    method: context.request.method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': context.request.headers.get('Prefer') || ''
    },
    body: context.request.method !== 'GET' ? await context.request.text() : undefined
  });
  
  return response;
}
