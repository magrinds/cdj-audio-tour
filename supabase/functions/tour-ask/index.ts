import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Right Here, Right Now: one function for the guide.
//   mode "ask" (default): answer a question, or propose a new plan via the update_plan tool
//   mode "create": write a whole new tour, geocode it, save it to rhrn_tours
//   mode "save_plan": store the group's current plan in rhrn_tour_plans

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const S = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("TOUR_MODEL") || "claude-sonnet-5-5";
const FALLBACK = "claude-haiku-5-5";

const VOICE = `Everything you write is read aloud by a phone voice: plain text only, no lists, no markdown, no emojis, no em dashes, no URLs. Warm, vivid and a little fun, like a great local guide.`;

const ASK_SYSTEM = `You are the friendly, knowledgeable audio tour guide inside the "Right Here, Right Now" app. You are guiding a small group of guests on today's tour (details below). You wrote the tour narration they have been hearing, so you know every stop and story in it.
${VOICE}
- Answers: 2 to 5 short spoken sentences.
- Resolve references like "she", "that place", "our hotel", "the museum we went to" using the trip facts, the tour overview, what they have already heard, and the recent conversation.
- Use the tour notes first, then your own general knowledge. Answer confidently with well-known facts. Do not say you lack details when the tour notes or common knowledge cover it.
- Only hedge on things that change: opening hours, prices, current events, whether a place is open right now.
- Use their GPS location and local time when relevant.
- Answer in the language the guest used.

CHANGING THE PLAN: If the guest asks to change today's plan (skip, add, swap, reorder, go somewhere new next, find a place to eat or rest and add it, fit a time limit, be back somewhere by a certain time), call the update_plan tool instead of answering in text. Rules:
- PLAN lists the stops in order with their ids. Stops marked played are done; never list them.
- In update_plan.plan list ONLY the remaining stops, in the new order: {"id": "..."} for an existing stop, or {"new": {...}} for a new place. Leave a stop out to remove it. Stops in REMOVED can be brought back by id.
- Do the time math. Walking is about 4 km per hour; a ride in town is about 25 km per hour plus 5 to 10 minutes to get a car; allow realistic visit times. If a time limit makes something impossible, drop the lowest value stops and say so.
- New places must be real places you are confident exist near the route. Give your best latitude and longitude and a precise place_query (name, street, neighborhood, city) for the geocoder. Write each new stop's narration (80 to 160 words, same spoken style as the tour: what it is, a bit of history or a story, what to look for, one practical tip; mention that hours should be checked if it is a shop or restaurant).
- summary: 1 to 3 spoken sentences saying what changes and roughly how the timing works out.
- If the request is ambiguous, make a sensible choice and say it in the summary.`;

const UPDATE_PLAN_TOOL = {
  name: "update_plan",
  description: "Replace the remaining (unplayed) part of today's tour plan.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "1 to 3 spoken sentences describing the change and timing." },
      plan: {
        type: "array",
        description: "Remaining stops in the new order. Each item has either id (existing stop) or new (a new place).",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            new: {
              type: "object",
              properties: {
                name: { type: "string" },
                place_query: { type: "string", description: "Name, street, neighborhood, city, for a geocoder." },
                lat: { type: "number" }, lng: { type: "number" },
                arrive: { type: "string", enum: ["walk", "ride"] },
                look: { type: "string", description: "Short 'what to look for' line." },
                note: { type: "string", description: "Short practical note, e.g. typical hours or price level." },
                text: { type: "string", description: "Spoken narration, 80 to 160 words." },
              },
              required: ["name", "place_query", "lat", "lng", "arrive", "text"],
            },
          },
        },
      },
    },
    required: ["summary", "plan"],
  },
};

const CREATE_SYSTEM = `You design self-guided GPS audio tours for the "Right Here, Right Now" app. Each stop's narration plays automatically when the guests reach it.
${VOICE}
Rules:
- The first stop is the starting point (their hotel or address if given, otherwise a natural meeting point). It plays when they tap Start: welcome them, set the scene for this place, and preview the route.
- Then the stops, in an efficient walking or riding order that fits the time. About 3 to 4 stops for 1 hour, 5 to 6 for 2 hours, 6 to 8 for 3 hours or more. Include snack or café stops when they like food.
- Only real places you are confident exist, with your best coordinates and a precise place_query (name, street, neighborhood, city) for a geocoder.
- Each stop's narration: 120 to 200 words. Mix history, local stories, people, food, culture and one thing to look for. Respect the group notes (kids, diet, mobility). End the last stop with a short goodbye.
- Add 3 or 4 standalone stories (80 to 140 words each) about the city and its culture, to play while traveling between stops.
- Add a quiz question to 2 or 3 stops.
- trip: one short paragraph of facts the guide should remember later (start point, group, transport, length, preferences).`;

const CREATE_TOOL = {
  name: "create_tour",
  description: "Return the finished tour.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short tour title, usually the place name, e.g. 'Jardins, São Paulo'." },
      city: { type: "string", description: "City, state or region, country." },
      tz: { type: "string", description: "IANA time zone, e.g. America/Sao_Paulo." },
      mode: { type: "string", enum: ["walk", "walk_ride", "car"] },
      blurb: { type: "string", description: "One line describing the tour, under 150 characters." },
      trip: { type: "string" },
      stops: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            place_query: { type: "string" },
            lat: { type: "number" }, lng: { type: "number" },
            arrive: { type: "string", enum: ["start", "walk", "ride"] },
            look: { type: "string" },
            note: { type: "string" },
            narration: { type: "string" },
            quiz_question: { type: "string" },
            quiz_answer: { type: "string" },
          },
          required: ["name", "place_query", "lat", "lng", "arrive", "narration"],
        },
      },
      stories: {
        type: "array",
        items: { type: "object", properties: { name: { type: "string" }, narration: { type: "string" } }, required: ["name", "narration"] },
      },
    },
    required: ["title", "city", "tz", "mode", "blurb", "trip", "stops", "stories"],
  },
};

async function claude(key: string, body: Record<string, unknown>) {
  let last: any = null;
  for (const model of [MODEL, FALLBACK]) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, ...body }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { console.log("ok", model, j.stop_reason, JSON.stringify(j.usage || {})); return { ok: true, j, model }; }
    last = { status: r.status, type: j?.error?.type, detail: j?.error?.message || JSON.stringify(j).slice(0, 300), model };
    console.error("anthropic error", JSON.stringify(last));
    if (r.status === 401 || r.status === 403 || /credit|billing/i.test(last.detail || "")) break;
  }
  return { ok: false, last };
}

// ---------- geocoding (OpenStreetMap Nominatim, 1 request per second) ----------
const UA = "RightHereRightNow/0.2 (self-guided tour app prototype)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function dist(a: number, b: number, c: number, d: number) {
  const R = 6371000, t = Math.PI / 180, dLa = (c - a) * t, dLo = (d - b) * t;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
async function geocode(q: string, ref: { lat: number; lng: number } | null) {
  let u = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&q=${encodeURIComponent(q)}`;
  if (ref) u += `&viewbox=${ref.lng - 0.25},${ref.lat + 0.25},${ref.lng + 0.25},${ref.lat - 0.25}`;
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
    if (!r.ok) return [];
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map((x: any) => ({ lat: +x.lat, lng: +x.lon }));
  } catch { return []; }
}
// Snap each place to a geocoder hit near the model's estimate; otherwise keep the estimate and flag it.
async function fixCoords(items: any[], city: string) {
  let first = true;
  for (const s of items) {
    const ref = Number.isFinite(s.lat) && Number.isFinite(s.lng) ? { lat: s.lat, lng: s.lng } : null;
    const tries = [s.place_query, `${s.name}, ${city}`].filter(Boolean);
    let done = false;
    for (const q of tries) {
      if (!first) await sleep(1100);
      first = false;
      const hits = await geocode(q, ref);
      if (!hits.length) continue;
      if (!ref) { s.lat = hits[0].lat; s.lng = hits[0].lng; s.approx = false; done = true; break; }
      const best = hits.map((h) => ({ h, d: dist(ref.lat, ref.lng, h.lat, h.lng) })).sort((a, b) => a.d - b.d)[0];
      if (best.d < 3000) { s.lat = best.h.lat; s.lng = best.h.lng; s.approx = false; done = true; break; }
    }
    if (!done) s.approx = true;
  }
}

async function rest(path: string, method: string, body: unknown, prefer = "return=minimal") {
  return await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: prefer },
    body: JSON.stringify(body),
  });
}
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "tour";

// ---------- modes ----------
async function doAsk(key: string, body: any) {
  const q = S(body.question, 600).trim();
  if (!q) return json({ error: "empty" }, 400);
  const plan = Array.isArray(body.plan) ? body.plan.slice(0, 60) : null;
  const ctx = [
    body.city ? `TOUR LOCATION: ${S(body.city, 200)}` : "",
    body.trip ? `TRIP FACTS:\n${S(body.trip, 1500)}` : "",
    body.guestNotes ? `GUEST NOTES: ${S(body.guestNotes, 400)}` : "",
    body.overview ? `TOUR OVERVIEW (every stop and story in today's tour):\n${S(body.overview, 9000)}` : "",
    plan ? `PLAN (in order):\n${plan.map((p: any, i: number) => `${i + 1}. id=${S(p.id, 40)} | ${S(p.name, 100)} | ${p.lat ?? "?"},${p.lng ?? "?"} | plays ${S(p.trigger, 30)}${p.played ? " | PLAYED" : ""}${p.added ? " | added today" : ""}`).join("\n")}` : "",
    Array.isArray(body.removed) && body.removed.length ? `REMOVED (can be re-added by id):\n${body.removed.slice(0, 40).map((p: any) => `id=${S(p.id, 40)} | ${S(p.name, 100)}`).join("\n")}` : "",
    body.transport ? `Transport: ${S(body.transport, 20)}` : "",
    body.lat != null ? `Guest GPS: ${Number(body.lat).toFixed(5)}, ${Number(body.lng).toFixed(5)}` : "Guest GPS: unknown right now",
    body.near ? `Nearest tour stop: ${S(body.near, 120)} (${S(body.nearDist, 20)} away)` : "",
    body.playing ? `Narration currently playing: ${S(body.playing, 120)}` : "",
    body.local ? `Local time: ${S(body.local, 40)}` : "",
    body.script ? `Full narration for the current or nearest stop:\n${S(body.script, 5000)}` : "",
  ].filter(Boolean).join("\n\n");
  const messages: { role: string; content: string }[] = [];
  for (const h of (Array.isArray(body.history) ? body.history.slice(-4) : [])) {
    if (h && h.q && h.a) { messages.push({ role: "user", content: S(h.q, 500) }); messages.push({ role: "assistant", content: S(h.a, 1500) }); }
  }
  messages.push({ role: "user", content: q });
  const req: Record<string, unknown> = { max_tokens: 4000, system: ASK_SYSTEM + "\n\n" + ctx, messages };
  if (plan) req.tools = [UPDATE_PLAN_TOOL];
  const res = await claude(key, req);
  if (!res.ok) return json({ error: "llm", ...res.last }, 502);
  const j = res.j;
  const tool = (j.content || []).find((c: any) => c.type === "tool_use" && c.name === "update_plan");
  if (tool) {
    const inp = tool.input || {};
    const items = (Array.isArray(inp.plan) ? inp.plan : []).slice(0, 30);
    const news = items.filter((it: any) => it && it.new).map((it: any) => it.new);
    const cityHint = S(body.city, 120);
    await fixCoords(news, cityHint);
    return json({ type: "plan", summary: S(inp.summary, 800), plan: items, model: res.model });
  }
  const text = (j.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ").trim();
  if (!text) return json({ error: "llm", detail: "empty answer, stop_reason " + j.stop_reason }, 502);
  return json({ answer: text, model: res.model });
}

async function doCreate(key: string, body: any) {
  const where = S(body.where, 200).trim();
  if (!where) return json({ error: "where" }, 400);
  const brief = [
    `Where: ${where}`,
    body.start ? `Starting point: ${S(body.start, 200)}` : "Starting point: not given, choose one",
    `Length: ${S(body.length, 30)}`, `Getting around: ${S(body.transport, 30)}`, `Pace: ${S(body.pace, 30)}`,
    `Interests: ${(Array.isArray(body.interests) ? body.interests : []).map((x: unknown) => S(x, 40)).join(", ")}`,
    body.group ? `Group: ${S(body.group, 300)}` : "",
    body.more ? `Other wishes: ${S(body.more, 600)}` : "",
    body.lat != null ? `Their phone is currently at ${Number(body.lat).toFixed(4)}, ${Number(body.lng).toFixed(4)}` : "",
    body.local ? `Their local date and time: ${S(body.local, 40)}` : "",
  ].filter(Boolean).join("\n");
  const res = await claude(key, {
    max_tokens: 12000, system: CREATE_SYSTEM,
    messages: [{ role: "user", content: `Create the tour.\n${brief}` }],
    tools: [CREATE_TOOL], tool_choice: { type: "tool", name: "create_tour" },
  });
  if (!res.ok) return json({ error: "llm", ...res.last }, 502);
  const tool = (res.j.content || []).find((c: any) => c.type === "tool_use");
  if (!tool) return json({ error: "llm", detail: "no tour returned, stop_reason " + res.j.stop_reason }, 502);
  const t = tool.input || {};
  const raw = (Array.isArray(t.stops) ? t.stops : []).filter((s: any) => s && s.name && s.narration).slice(0, 12);
  if (raw.length < 2) return json({ error: "llm", detail: "tour too short" }, 502);
  await fixCoords(raw, S(t.city, 120) || where);
  const id = `${slug(S(t.title, 60) || where)}-${Math.random().toString(36).slice(2, 6)}`;
  const quiz: Record<string, unknown> = {};
  const stops = raw.map((s: any, i: number) => {
    const sid = "s" + (i + 1);
    if (s.quiz_question && s.quiz_answer) quiz[sid] = { ask: S(s.quiz_question, 200), ans: S(s.quiz_answer, 200) };
    const start = i === 0;
    const ride = s.arrive === "ride";
    return {
      id: sid, name: S(s.name, 80), lat: +s.lat, lng: +s.lng, radius: start ? 0 : ride ? 200 : 80, walk: !start && !ride,
      text: S(s.narration, 3000), look: s.look ? S(s.look, 140) : "", note: s.note ? S(s.note, 140) : "",
      approx: !!s.approx, mapLabel: start ? "Start" : "", photoQ: `${S(s.name, 80)} ${S(t.city, 60)}`,
    };
  });
  const stories = (Array.isArray(t.stories) ? t.stories : []).filter((s: any) => s && s.narration).slice(0, 6)
    .map((s: any, i: number) => ({ id: "f" + (i + 1), name: "Story: " + S(s.name, 80), text: S(s.narration, 2000) }));
  const mode = ["walk", "walk_ride", "car"].includes(t.mode) ? t.mode : "walk_ride";
  const tour = {
    id, title: S(t.title, 80) || where, city: S(t.city, 160) || where, tz: S(t.tz, 60) || undefined, mode,
    blurb: S(t.blurb, 160), trip: S(t.trip, 1500), guestNotes: S(body.group, 300),
    startId: "s1", stops, quiz,
    fillers: mode === "walk" ? [] : stories, walkStories: mode === "walk" ? stories : [],
    createdWith: res.model, createdAt: new Date().toISOString(),
  };
  const ins = await rest("rhrn_tours", "POST", { id, title: tour.title, city: tour.city, blurb: tour.blurb, data: tour });
  if (!ins.ok) console.error("save tour failed", ins.status, await ins.text());
  return json({ tour, saved: ins.ok });
}

async function doSavePlan(body: any) {
  const tourId = S(body.tour_id, 80).trim();
  if (!tourId) return json({ error: "tour_id" }, 400);
  const plan = body.plan && Array.isArray(body.plan.stops) ? body.plan : null;
  const size = JSON.stringify(plan || {}).length;
  if (size > 400000) return json({ error: "too_big" }, 413);
  const row = { tour_id: tourId, v: plan ? Number(plan.v) || Date.now() : Date.now(), plan, updated_by: plan ? S(plan.by, 40) : "", updated_at: new Date().toISOString() };
  const r = await rest("rhrn_tour_plans?on_conflict=tour_id", "POST", row, "resolution=merge-duplicates,return=minimal");
  if (!r.ok) { const t = await r.text(); console.error("save plan failed", r.status, t); return json({ error: "save", detail: t.slice(0, 200) }, 500); }
  return json({ ok: true, v: row.v });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const body = await req.json();
    if (body.mode === "save_plan") return await doSavePlan(body);
    const key = (Deno.env.get("ANTHROPIC_API_KEY_RHRN") || "").trim();
    if (!key) return json({ error: "not_configured" }, 503);
    if (body.mode === "create") return await doCreate(key, body);
    return await doAsk(key, body);
  } catch (e) {
    console.error("handler error", String(e));
    return json({ error: String(e) }, 400);
  }
});
