import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "accept, apikey, content-type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

const text = (value: unknown, max = 100) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "GET") return response({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return response({ error: "Servicio no configurado" }, 503);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // This endpoint is intentionally public and read-only. Keep the response allowlisted.
  const { data: games, error: gamesError } = await supabase
    .from("live_games_feed")
    .select("id,table_name,status,started_at,largos_score,cortos_score")
    .eq("status", "activa")
    .order("started_at", { ascending: true })
    .limit(24);

  if (gamesError) return response({ error: "No se pudo cargar el marcador" }, 503);

  const ids = (games || []).map((game) => game.id).filter(Boolean);
  let players: Array<Record<string, any>> = [];
  if (ids.length) {
    const { data, error } = await supabase
      .from("game_players")
      .select("game_id,team,seat,members(full_name,nickname)")
      .in("game_id", ids)
      .order("seat", { ascending: true });
    if (error) return response({ error: "No se pudieron cargar las parejas" }, 503);
    players = data || [];
  }

  const matches = (games || []).map((game, index) => {
    const assigned = players.filter((player) => player.game_id === game.id);
    const pairLabel = (team: string) => assigned
      .filter((player) => String(player.team || "").toUpperCase() === team.toUpperCase())
      .map((player) => {
        const member = player.members || {};
        return text(member.nickname, 40) || text(member.full_name, 40);
      })
      .filter(Boolean)
      .join(" / ")
      .slice(0, 100);
    return {
      table: index + 1,
      tableName: text(game.table_name, 48) || "Mesa " + (index + 1),
      teamA: pairLabel("L") || "Largos",
      teamB: pairLabel("C") || "Cortos",
      scoreA: Number.isSafeInteger(game.largos_score) ? game.largos_score : 0,
      scoreB: Number.isSafeInteger(game.cortos_score) ? game.cortos_score : 0,
      target: 200,
      status: "activa",
    };
  });

  return response({
    revision: Date.now(),
    snapshot: {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      matches,
    },
  });
});
