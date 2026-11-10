import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Right Here, Right Now: one function for the guide.
//   mode "ask" (default): answer a question (with web search), or propose a new plan via the update_plan tool
//   modes "create_outline" / "create_narrate" / "create_geocode" / "create_assemble": build a new tour in steps, save to rhrn_tours
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
- You have a web_search tool. Use it when the guest asks you to check or look something up, when they ask for specific facts you are not sure of (dates, names, numbers), and for things that change (opening hours, prices, events, whether a place is open now). Search in Portuguese or the local language when that finds better local sources. Do not search for things the tour notes already answer. Never mention sources, links or that you searched unless asked; just give the answer naturally.
- If you still cannot confirm something after searching, say so briefly.
- Use their GPS location and local time when relevant.
- Answer in the language the guest used.

CHANGING THE PLAN: If the guest asks to change today's plan (skip, add, swap, reorder, go somewhere new next, find a place to eat or rest and add it, fit a time limit, be back somewhere by a certain time), call the update_plan tool instead of answering in text. Rules:
- PLAN lists the stops in order with their ids. Stops marked played are done; never list them.
- In update_plan.plan list ONLY the remaining stops, in the new order: {"id": "..."} for an existing stop, or {"new": {...}} for a new place. Leave a stop out to remove it. Stops in REMOVED can be brought back by id.
- Do the time math. Walking is about 4 km per hour; a ride in town is about 25 km per hour plus 5 to 10 minutes to get a car; allow realistic visit times. If a time limit makes something impossible, drop the lowest value stops and say so.
- New places must be real places that exist near the route. Use web_search to confirm a new place and check its hours when that matters (cafes, restaurants, shops, museums). Give your best latitude and longitude and a precise place_query (name, street, neighborhood, city) for the geocoder. Write each new stop's narration (80 to 160 words, same spoken style as the tour: what it is, a bit of history or a story, what to look for, one practical tip). Put the hours you found in note.
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
                note: { type: "string", description: "Short practical note, e.g. hours or price level." },
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

const CREATE_SYSTEM = `You plan dense, story-rich self-guided GPS audio tours for the "Right Here, Right Now" app. Narration plays automatically as guests reach or pass each point. The best tours feel like a brilliant local friend who never runs out of stories: history, people, politics, industry, food, architecture, scandals, legends, funny anecdotes, and what to look at right now.
You are writing the OUTLINE. Separate writers will turn each item into narration, so make every angle specific and different (names, dates, stories to tell), with no overlap between items.
Rules:
- The first stop is the starting point (their hotel or address if given, otherwise a natural meeting point), arrive "start". Its narration welcomes them, sets the scene and previews the route.
- Main stops (arrive "walk" or "ride"), in an efficient order that fits the time: about 4 for 1 hour, 5 to 6 for 2 hours, 7 to 8 for 3 hours or more. Include snack or cafe stops when they like food, and respect the group notes (kids, diet, mobility).
- Also add pass-by points (arrive "pass"): interesting streets, buildings, viewpoints or neighborhoods along the way between stops that get a short story as the guests go by. Add 1 or 2 between most pairs of stops.
- Use web_search to confirm places exist, find their exact location, check opening hours for the day, and find good local stories. Search in the local language when helpful. Keep searching efficient.
- Coordinates: your best latitude and longitude plus a precise place_query (name, street, neighborhood, city) for a geocoder.
- story_topics: 10 to 12 standalone stories about this city, its region, culture, food, people and history, to fill travel time. kind "walk" for on-foot moments (street life, signs, customs) or "ride" for longer stories.
- Add a quiz question to 3 or 4 stops.
- trip: one short paragraph of facts the guide should remember later (start point, group, transport, length, preferences).`;

const NARRATOR = `You are the narrator of a self-guided GPS audio tour in the "Right Here, Right Now" app. Write the narration for ONE item of the tour.
${VOICE}
Make it dense and specific like the best human guides: concrete names, dates and numbers, vivid stories, local legends, politics and economics where relevant, food, and at least one thing to look at right now. Use humor where it fits. Speak directly to the guests ("look to your left", "you are standing where..."). Short paragraphs separated by line breaks. Respect the group notes. Do not repeat what other items cover (see the outline). Only state facts you are confident about; skip a detail rather than invent it. Output only the narration text.`;

const OUTLINE_TOOL = {
  name: "tour_outline",
  description: "Return the tour outline.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short tour title, usually the place name." },
      city: { type: "string", description: "City, state or region, country." },
      tz: { type: "string", description: "IANA time zone." },
      mode: { type: "string", enum: ["walk", "walk_ride", "car"] },
      blurb: { type: "string", description: "One line, under 150 characters." },
      trip: { type: "string" },
      stops: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            place_query: { type: "string" },
            lat: { type: "number" }, lng: { type: "number" },
            arrive: { type: "string", enum: ["start", "walk", "ride", "pass"] },
            angle: { type: "string", description: "What this item's narration should cover: specific stories, people, dates, things to look at." },
            look: { type: "string", description: "Short 'what to look for' line." },
            note: { type: "string", description: "Practical note: hours, price level, tips." },
            quiz_question: { type: "string" }, quiz_answer: { type: "string" },
          },
          required: ["name", "place_query", "lat", "lng", "arrive", "angle"],
        },
      },
      story_topics: {
        type: "array",
        items: { type: "object", properties: { name: { type: "string" }, angle: { type: "string" }, kind: { type: "string", enum: ["walk", "ride"] } }, required: ["name", "angle", "kind"] },
      },
    },
    required: ["title", "city", "tz", "mode", "blurb", "trip", "stops", "story_topics"],
  },
};

const WEB_SEARCH = { type: "web_search_20250305", name: "web_search", max_uses: 3 };
function send(key: string, model: string, body: Record<string, unknown>) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, ...body }),
  });
}
async function claude(key: string, body: Record<string, unknown>) {
  let last: any = null;
  for (const model of [MODEL, FALLBACK]) {
    let r = await send(key, model, body), j = await r.json().catch(() => ({}));
    if (r.status === 429 || r.status === 529) { await sleep(4000); r = await send(key, model, body); j = await r.json().catch(() => ({})); }
    if (r.ok) { console.log("ok", model, j.stop_reason, JSON.stringify(j.usage || {})); return { ok: true, j, model }; }
    last = { status: r.status, type: j?.error?.type, detail: j?.error?.message || JSON.stringify(j).slice(0, 300), model };
    console.error("anthropic error", JSON.stringify(last));
    if (r.status === 400 && /web.?search/i.test(last.detail || "") && Array.isArray(body.tools)) {
      // web search not enabled for this org: retry once without it
      const tools = (body.tools as any[]).filter((t) => t.name !== "web_search");
      body = { ...body, tools: tools.length ? tools : undefined };
      const r2 = await send(key, model, body);
      const j2 = await r2.json().catch(() => ({}));
      if (r2.ok) { console.log("ok without web search", model); return { ok: true, j: j2, model, noSearch: true }; }
    }
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
  req.tools = plan ? [WEB_SEARCH, UPDATE_PLAN_TOOL] : [WEB_SEARCH];
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
  // with web search the answer arrives as several text blocks (split at citations); keep only what follows the last search
  const blocks = j.content || [];
  let lastTool = -1; blocks.forEach((c: any, i: number) => { if (c.type !== "text") lastTool = i; });
  const searched = blocks.some((c: any) => c.type === "server_tool_use");
  const text = blocks.slice(lastTool + 1).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").replace(/\s+/g, " ").trim()
    || blocks.filter((c: any) => c.type === "text").map((c: any) => c.text).join("").replace(/\s+/g, " ").trim();
  if (!text) return json({ error: "llm", detail: "empty answer, stop_reason " + j.stop_reason }, 502);
  return json({ answer: text, model: res.model, searched, noSearch: !!res.noSearch });
}

const WORDS: Record<string, string> = { start: "220 to 320", walk: "230 to 350", ride: "230 to 350", pass: "110 to 180" };

// Tour creation runs as several short calls driven by the app, so no single call hits the time limit:
// outline -> (narrate batches + geocode, in parallel) -> assemble
function briefOf(body: any) {
  return [
    `Where: ${S(body.where, 200)}`,
    body.start ? `Starting point: ${S(body.start, 200)}` : "Starting point: not given, choose one",
    `Length: ${S(body.length, 30)}`, `Getting around: ${S(body.transport, 30)}`, `Pace: ${S(body.pace, 30)}`,
    `Interests: ${(Array.isArray(body.interests) ? body.interests : []).map((x: unknown) => S(x, 40)).join(", ")}`,
    body.group ? `Group: ${S(body.group, 300)}` : "",
    body.more ? `Other wishes: ${S(body.more, 600)}` : "",
    body.lat != null ? `Their phone is currently at ${Number(body.lat).toFixed(4)}, ${Number(body.lng).toFixed(4)}` : "",
    body.local ? `Their local date and time: ${S(body.local, 40)}` : "",
  ].filter(Boolean).join("\n");
}

async function doOutline(key: string, body: any) {
  const where = S(body.where, 200).trim();
  if (!where) return json({ error: "where" }, 400);
  const brief = briefOf(body);
  const t0 = Date.now();
  const res = await claude(key, {
    max_tokens: 6000, system: CREATE_SYSTEM,
    messages: [{ role: "user", content: `Plan the tour outline, then call tour_outline.\n${brief}` }],
    tools: [{ ...WEB_SEARCH, max_uses: 4 }, OUTLINE_TOOL],
  });
  if (!res.ok) return json({ error: "llm", ...res.last }, 502);
  let tool = (res.j.content || []).find((c: any) => c.type === "tool_use" && c.name === "tour_outline");
  if (!tool) {
    const r2 = await claude(key, {
      max_tokens: 5000, system: CREATE_SYSTEM,
      messages: [{ role: "user", content: `Plan the tour outline.\n${brief}` }],
      tools: [OUTLINE_TOOL], tool_choice: { type: "tool", name: "tour_outline" },
    });
    if (!r2.ok) return json({ error: "llm", ...r2.last }, 502);
    tool = (r2.j.content || []).find((c: any) => c.type === "tool_use");
    if (!tool) return json({ error: "llm", detail: "no outline returned" }, 502);
  }
  const t = tool.input || {};
  const stops = (Array.isArray(t.stops) ? t.stops : []).filter((s: any) => s && s.name && Number.isFinite(+s.lat) && Number.isFinite(+s.lng)).slice(0, 22);
  if (stops.length < 2) return json({ error: "llm", detail: "tour too short" }, 502);
  stops[0].arrive = "start";
  const topics = (Array.isArray(t.story_topics) ? t.story_topics : []).filter((x: any) => x && x.name).slice(0, 12);
  const city = S(t.city, 120) || where;
  const outlineText = stops.map((s: any, i: number) => `${i + 1}. ${s.name} [${s.arrive}]: ${S(s.angle, 400)}`).join("\n")
    + "\nTravel stories:\n" + topics.map((x: any) => `- ${x.name}: ${S(x.angle, 300)}`).join("\n");
  const ctx = `TOUR: ${S(t.title, 80)} in ${city}\nTRIP: ${S(t.trip, 800)}\nGROUP NOTES: ${S(body.group, 300) || "none"}\nOUTLINE:\n${outlineText}`;
  const jobs = [
    ...stops.map((s: any, i: number) => ({ key: "stop" + i, words: WORDS[s.arrive] || WORDS.walk,
      prompt: `Write the narration for item ${i + 1}: ${s.name} (${s.arrive === "pass" ? "a pass-by point, heard while going past" : s.arrive === "start" ? "the starting point, heard when they tap Start" : "a main stop, heard on arrival"}).\nAngle: ${S(s.angle, 600)}\n${s.look ? "Look for: " + S(s.look, 200) + "\n" : ""}${i + 1 < stops.length ? "Next item: " + stops[i + 1].name + "\n" : "This is the last item: end with a warm goodbye.\n"}` })),
    ...topics.map((x: any, i: number) => ({ key: "story" + i, words: "100 to 170",
      prompt: `Write a standalone travel story titled "${S(x.name, 80)}" to play while the guests ${x.kind === "walk" ? "walk" : "ride"} between stops.\nAngle: ${S(x.angle, 500)}\n` })),
  ];
  console.log("outline", Math.round((Date.now() - t0) / 1000) + "s", stops.length, "items", topics.length, "stories");
  return json({ outline: { ...t, city, stops, story_topics: topics }, ctx, jobs, model: res.model });
}

async function doNarrate(key: string, body: any) {
  const ctx = S(body.ctx, 12000);
  const jobs = (Array.isArray(body.jobs) ? body.jobs : []).slice(0, 6);
  const texts: Record<string, string> = {};
  await Promise.all(jobs.map(async (job: any) => {
    const r = await claude(key, { max_tokens: 1500, system: NARRATOR + "\n\n" + ctx, messages: [{ role: "user", content: `${S(job.prompt, 1500)}Length: ${S(job.words, 20)} words.` }] });
    if (r.ok) texts[S(job.key, 20)] = (r.j.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").trim();
  }));
  return json({ texts });
}

async function doGeocode(body: any) {
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 22).map((x: any) => ({ name: S(x.name, 100), place_query: S(x.place_query, 200), lat: +x.lat, lng: +x.lng }));
  await fixCoords(items, S(body.city, 120));
  return json({ items: items.map((x: any) => ({ lat: x.lat, lng: x.lng, approx: !!x.approx })) });
}

async function doAssemble(body: any) {
  const t = body.outline || {};
  const texts = body.texts || {};
  const geo = Array.isArray(body.geo) ? body.geo : [];
  const raw = Array.isArray(t.stops) ? t.stops.slice(0, 22) : [];
  const topics = Array.isArray(t.story_topics) ? t.story_topics.slice(0, 12) : [];
  const where = S(body.where, 200);
  const id = `${slug(S(t.title, 60) || where || "tour")}-${Math.random().toString(36).slice(2, 6)}`;
  const quiz: Record<string, unknown> = {};
  const stops = raw.map((s: any, i: number) => {
    const sid = "s" + (i + 1);
    if (s.quiz_question && s.quiz_answer) quiz[sid] = { ask: S(s.quiz_question, 200), ans: S(s.quiz_answer, 200) };
    const start = i === 0, ride = s.arrive === "ride", pass = s.arrive === "pass";
    const g = geo[i] || {};
    return {
      id: sid, name: S(s.name, 80) + (pass ? " (passing)" : ""), lat: Number.isFinite(+g.lat) ? +g.lat : +s.lat, lng: Number.isFinite(+g.lng) ? +g.lng : +s.lng,
      radius: start ? 0 : pass ? 180 : ride ? 200 : 80, walk: !start && !ride && !pass,
      text: S(texts["stop" + i] || s.angle, 4000), look: s.look ? S(s.look, 140) : "", note: s.note ? S(s.note, 140) : "",
      approx: !!g.approx, mapLabel: start ? "Start" : "", photoQ: `${S(s.name, 80)} ${S(t.city, 60)}`,
    };
  }).filter((s: any) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.text);
  if (stops.length < 2) return json({ error: "assemble", detail: "tour too short" }, 400);
  const stories = topics.map((x: any, i: number) => ({ id: "f" + (i + 1), kind: x.kind, name: "Story: " + S(x.name, 80), text: S(texts["story" + i], 2500) })).filter((x: any) => x.text);
  const mode = ["walk", "walk_ride", "car"].includes(t.mode) ? t.mode : "walk_ride";
  const strip = (x: any) => ({ id: x.id, name: x.name, text: x.text });
  const tour = {
    id, title: S(t.title, 80) || where, city: S(t.city, 160) || where, tz: S(t.tz, 60) || undefined, mode,
    blurb: S(t.blurb, 160), trip: S(t.trip, 1500), guestNotes: S(body.group, 300),
    startId: "s1", stops, quiz,
    fillers: (mode === "walk" ? [] : stories.filter((x: any) => x.kind !== "walk")).map(strip),
    walkStories: (mode === "walk" ? stories : stories.filter((x: any) => x.kind === "walk")).map(strip),
    createdAt: new Date().toISOString(),
  };
  const ins = await rest("rhrn_tours", "POST", { id, title: tour.title, city: tour.city, blurb: tour.blurb, data: tour });
  if (!ins.ok) console.error("save tour failed", ins.status, await ins.text());
  console.log("assembled", id, stops.length, "stops", stories.length, "stories");
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
    if (body.mode === "create_outline") return await doOutline(key, body);
    if (body.mode === "create_narrate") return await doNarrate(key, body);
    if (body.mode === "create_geocode") return await doGeocode(body);
    if (body.mode === "create_assemble") return await doAssemble(body);
    return await doAsk(key, body);
  } catch (e) {
    console.error("handler error", String(e));
    return json({ error: String(e) }, 400);
  }
});
