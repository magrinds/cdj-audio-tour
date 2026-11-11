import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const { pin, path } = await req.json();
    const want = Deno.env.get("ALBUM_ADMIN_PIN");
    if (!want || typeof pin !== "string" || pin !== want) return json({ error: "bad pin" }, 401);
    if (path === "__check") return json({ ok: true });
    // any tour's album: <album-id>/<file>.jpg
    if (typeof path !== "string" || !/^[a-z0-9][a-z0-9-]{0,80}\/[A-Za-z0-9_\-]+\.jpg$/.test(path)) return json({ error: "bad path" }, 400);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await sb.storage.from("tour-photos").remove([path]);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
