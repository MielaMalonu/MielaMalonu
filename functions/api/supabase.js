export async function onRequest({ request }) {
  return new Response("🧪 Supabase proxy hit! URL: " + request.url);
}
