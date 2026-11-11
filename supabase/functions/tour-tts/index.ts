import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Right Here, Right Now: premium narrator voice.
// Turns one sentence (or a short answer) into an MP3 with ElevenLabs, stores it in the public
// tour-audio bucket, and returns its URL. The same text is only ever paid for once: every phone
// on the tour reuses the stored clip, and the app caches clips for offline replay.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "tour-audio";

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

function callEleven(key: string, voice: string, model: string, text: string, prev: string, next: string) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text, model_id: model,
      ...(prev ? { previous_text: prev } : {}), ...(next ? { next_text: next } : {}),
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const body = await req.json();
    const text = String(body.text || "").trim().slice(0, 2500);
    if (!text) return json({ error: "empty" }, 400);
    const prev = String(body.prev || "").slice(0, 400), next = String(body.next || "").slice(0, 400);
    const voice = (Deno.env.get("ELEVENLABS_VOICE_ID") || "nPczCjzI2devNBz1zQrb").trim();
    const model = (Deno.env.get("ELEVENLABS_MODEL") || "eleven_multilingual_v2").trim();
    const path = `v1/${voice}/${model}/${await sha(text)}.mp3`;
    const url = `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return json({ url, cached: true });

    const key = (Deno.env.get("RHRN_Eleven_Labs") || Deno.env.get("ELEVENLABS_API_KEY") || "").trim();
    if (!key) return json({ error: "not_configured" }, 503);
    // the ElevenLabs plan allows only a few requests at once: wait and retry when busy
    let r: Response = new Response(null, { status: 429 });
    for (let attempt = 0; attempt < 6; attempt++) {
      r = await callEleven(key, voice, model, text, prev, next);
      if (r.status !== 429) break;
      await r.body?.cancel();
      await new Promise((ok) => setTimeout(ok, 800 + Math.random() * 1200 * (attempt + 1)));
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("elevenlabs error", r.status, t.slice(0, 300));
      return json({ error: "tts", status: r.status, detail: t.slice(0, 200) }, 502);
    }
    const audio = new Uint8Array(await r.arrayBuffer());
    const up = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY, "Content-Type": "audio/mpeg", "x-upsert": "true", "cache-control": "31536000" },
      body: audio,
    });
    if (!up.ok) { console.error("upload failed", up.status, (await up.text()).slice(0, 200)); return json({ error: "store" }, 500); }
    console.log("tts", text.length, "chars");
    return json({ url, cached: false });
  } catch (e) {
    console.error("handler error", String(e));
    return json({ error: String(e) }, 400);
  }
});
