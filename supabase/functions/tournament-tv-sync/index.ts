import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const LAB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const LAB_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, accept",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};
const respond = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: cors });
const safeText = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const safeScore = (v: unknown, max = 10000) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max ? Number(v) : 0;
const safePhoto = (v: unknown) => typeof v === "string" && v.length <= 10000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(v) ? v : "";

function publicSnapshot(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid snapshot");
  const data = input as Record<string, any>;
  if (data.schemaVersion !== 1 || !Array.isArray(data.matches)) throw new Error("Invalid snapshot");
  const players = (list: unknown) => Array.isArray(list) ? list.slice(0, 2).map((p: any) => ({
    name: safeText(p?.name, 40) || "Jugador",
    photo: safePhoto(p?.photo),
  })) : [];
  const matches = data.matches.slice(0, 32).map((m: any, index: number) => ({
    table: Number.isInteger(m?.table) && m.table >= 1 && m.table <= 100 ? m.table : index + 1,
    round: safeText(m?.round, 50),
    teamA: safeText(m?.teamA, 90) || "Pareja A",
    teamB: safeText(m?.teamB, 90) || "Pareja B",
    teamAPlayers: players(m?.teamAPlayers),
    teamBPlayers: players(m?.teamBPlayers),
    scoreA: safeScore(m?.scoreA),
    scoreB: safeScore(m?.scoreB),
  }));
  const events = (Array.isArray(data.events) ? data.events : []).slice(-20).map((e: any) => ({
    id: safeText(e?.id, 120),
    label: safeText(e?.label, 200),
    points: safeScore(e?.points, 250),
    table: Number.isInteger(e?.table) && e.table >= 1 && e.table <= 100 ? e.table : null,
    createdAt: safeText(e?.createdAt, 40),
  }));
  const bracket = (Array.isArray(data.bracket) ? data.bracket : []).slice(0, 64).map((b: any) =>
    typeof b === "string" ? safeText(b, 140) : { label: safeText(b?.label, 140) }
  );
  const leader = (v: any, kind: "mvp" | "points") => {
    if (!v || typeof v !== "object") return null;
    return kind === "mvp"
      ? { name: safeText(v.name, 60), average: Number.isFinite(v.average) ? Number(v.average) : 0 }
      : { name: safeText(v.name, 60), value: safeScore(v.value) };
  };
  return {
    schemaVersion: 1,
    tournament: safeText(data.tournament, 120) || "Torneo Titanes",
    updatedAt: new Date().toISOString(),
    matches,
    bracket,
    events,
    leaders: {
      mvp: leader(data.leaders?.mvp, "mvp"),
      points: leader(data.leaders?.points, "points"),
    },
  };
}

async function authorizeOrganizer(request: Request) {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || token.length > 4096) return { ok: false as const, status: 401, error: "Inicia sesión en Titanes Dominó." };
  const labAuth = createClient(LAB_URL, LAB_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await labAuth.auth.getUser(token);
  if (authError || !authData.user) return { ok: false as const, status: 401, error: "Sesión no válida." };
  const { data: member, error } = await labAuth.from("members")
    .select("role,active,access_status,deleted_at,is_guest")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (error || !member) return { ok: false as const, status: 403, error: "No tienes acceso de miembro activo." };
  if (member.active !== true || member.access_status !== "activo" || member.deleted_at || member.is_guest === true) {
    return { ok: false as const, status: 403, error: "La cuenta no está habilitada para organizar torneos." };
  }
  if (!["admin", "directiva"].includes(member.role)) {
    return { ok: false as const, status: 403, error: "Solo Presidencia o la directiva pueden publicar el torneo." };
  }
  return { ok: true as const };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (LAB_URL !== "https://hvpyngkqtqzvmweavego.supabase.co" || !LAB_SERVICE_KEY) return respond({ error: "Servicio de torneos no configurado." }, 503);
  const url = new URL(request.url);
  const pathParts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const routeIndex = pathParts.lastIndexOf("tournament-tv-sync");
  const id = routeIndex >= 0 && pathParts.length === routeIndex + 2
    ? pathParts[routeIndex + 1]
    : pathParts.length === 1 ? pathParts[0] : null;
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id) || url.search || url.hash) {
    return respond({ error: "Torneo no encontrado." }, 404);
  }

  const lab = createClient(LAB_URL, LAB_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  if (request.method === "GET") {
    const { data, error } = await lab.from("tv_tournament_snapshots")
      .select("revision,snapshot,updated_at").eq("tournament_id", id).maybeSingle();
    if (error) return respond({ error: "No se pudo leer el torneo." }, 503);
    if (!data) return respond({ error: "Torneo no encontrado." }, 404);
    return respond({ revision: Number(data.revision), snapshot: data.snapshot, updatedAt: data.updated_at });
  }
  if (request.method !== "PUT") return respond({ error: "Método no permitido." }, 405);

  const authorization = await authorizeOrganizer(request);
  if (!authorization.ok) return respond({ error: authorization.error }, authorization.status);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return respond({ error: "Se requiere JSON." }, 415);
  }
  const raw = await request.text();
  if (raw.length > 1050000) return respond({ error: "El snapshot es demasiado grande." }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return respond({ error: "JSON inválido." }, 400); }
  if (!body || typeof body !== "object" || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0 ||
      typeof body.operationId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(body.operationId)) {
    return respond({ error: "Solicitud de sincronización inválida." }, 400);
  }
  let snapshot: ReturnType<typeof publicSnapshot>;
  try { snapshot = publicSnapshot(body.snapshot); } catch { return respond({ error: "Snapshot inválido." }, 400); }
  if (JSON.stringify(snapshot).length > 1040000) return respond({ error: "Reduce las fotos o la cantidad de mesas del snapshot." }, 413);
  const { data, error } = await lab.rpc("publish_tv_tournament_snapshot", {
    p_tournament_id: id,
    p_expected_revision: body.expectedRevision,
    p_operation_id: body.operationId,
    p_snapshot: snapshot,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("Revision conflict")) return respond({ error: "El torneo cambió en otro dispositivo. Actualiza y vuelve a intentar." }, 409);
    return respond({ error: "No se pudo guardar el marcador." }, 503);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return respond({ error: "No se recibió confirmación." }, 503);
  return respond({ revision: Number(row.revision), snapshot: row.snapshot, updatedAt: row.updated_at });
});
