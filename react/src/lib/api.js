import { supabase, APP_URL } from "./supabase";
import * as Sentry from "@sentry/react";

export function getSupabaseClient() {
  return supabase;
}

export async function getAuthenticatedClient() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return supabase;
}

export function handleApiError(error) {
  if (!error) return "An unexpected error occurred.";
  if (error.message?.includes("JWT"))
    return "Session expired. Please log in again.";
  if (error.message?.includes("duplicate key"))
    return "This record already exists.";
  if (error.message?.includes("foreign key"))
    return "Cannot delete: this record is referenced by other data.";
  if (error.message?.includes("violates check constraint"))
    return "Invalid data provided. Please check your input.";
  return error.message || "An unexpected error occurred. Please try again.";
}

function readStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const SEASONS_CACHE_KEY = "seasonsCache";
const SEASONS_CACHE_BY_ID_KEY = "seasonsCacheById";

function sortSeasonsByEndDate(list) {
  return [...list].sort((a, b) => {
    const l = a && a.end_date ? a.end_date : "";
    const r = b && b.end_date ? b.end_date : "";
    return r.localeCompare(l);
  });
}

function cacheSeasonById(season) {
  if (!season?.id) return;
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  cache[String(season.id)] = season;
  writeStorageJson(SEASONS_CACHE_BY_ID_KEY, cache);
}

function cacheSeasonsById(seasons) {
  if (!Array.isArray(seasons)) return;
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  seasons.forEach((s) => {
    if (s?.id) cache[String(s.id)] = s;
  });
  writeStorageJson(SEASONS_CACHE_BY_ID_KEY, cache);
}

export async function listSeasons(options = {}) {
  const { order, limit, offset, filters } = options;
  let query = supabase.from("seasons").select("*");
  if (filters)
    filters.forEach((f) => {
      query = query[f.operator](f.column, f.value);
    });
  if (order)
    query = query.order(order.column, { ascending: order.ascending !== false });
  if (limit) query = query.limit(limit);
  if (offset !== undefined)
    query = query.range(offset, offset + (limit || 10) - 1);
  const { data, error } = await query;
  if (error) throw new Error(handleApiError(error));
  if (!filters?.length)
    writeStorageJson(SEASONS_CACHE_KEY, sortSeasonsByEndDate(data));
  cacheSeasonsById(data);
  return data;
}

export async function getSeasonById(id) {
  if (id === undefined || id === null) return null;
  const key = String(id);
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  if (cache[key]) return cache[key];
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(handleApiError(error));
  const season = data?.[0] || null;
  if (season) cacheSeasonById(season);
  return season;
}

export async function createSeason(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("seasons")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  cacheSeasonById(data);
  const list = readStorageJson(SEASONS_CACHE_KEY) || [];
  const updated = list.map((item) =>
    String(item.id) === String(data.id) ? data : item,
  );
  if (!updated.some((i) => String(i.id) === String(data.id)))
    updated.push(data);
  writeStorageJson(SEASONS_CACHE_KEY, sortSeasonsByEndDate(updated));
  return data;
}

export async function updateSeason(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("seasons")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  cacheSeasonById(data);
  const list = readStorageJson(SEASONS_CACHE_KEY) || [];
  const updated = list.map((item) =>
    String(item.id) === String(id) ? data : item,
  );
  writeStorageJson(SEASONS_CACHE_KEY, sortSeasonsByEndDate(updated));
  return data;
}

export async function deleteSeason(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase.from("seasons").delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
  try {
    const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
    delete cache[String(id)];
    writeStorageJson(SEASONS_CACHE_BY_ID_KEY, cache);
  } catch {}
  const list = readStorageJson(SEASONS_CACHE_KEY) || [];
  writeStorageJson(
    SEASONS_CACHE_KEY,
    sortSeasonsByEndDate(list.filter((i) => String(i.id) !== String(id))),
  );
}

export async function listDrivers(options = {}) {
  const { order, limit, offset, filters } = options;
  let query = supabase.from("drivers").select("*");
  if (filters)
    filters.forEach((f) => {
      query = query[f.operator](f.column, f.value);
    });
  if (order)
    query = query.order(order.column, { ascending: order.ascending !== false });
  if (limit) query = query.limit(limit);
  if (offset !== undefined)
    query = query.range(offset, offset + (limit || 10) - 1);
  const { data, error } = await query;
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function createDriver(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert([payload])
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505" || error.status === 409)
      throw new Error("Email already exists. Please use a different email.");
    throw new Error(handleApiError(error));
  }
  return data;
}

export async function updateDriver(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("drivers")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function deleteDriver(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
}

export async function listCups(options = {}) {
  const { order, limit, offset, filters, seasonId } = options;
  let f = filters ? [...filters] : [];
  if (seasonId)
    f.push({ column: "season_id", operator: "eq", value: seasonId });
  let query = supabase.from("cups").select("*");
  f.forEach((fi) => {
    query = query[fi.operator](fi.column, fi.value);
  });
  if (order)
    query = query.order(order.column, { ascending: order.ascending !== false });
  if (limit) query = query.limit(limit);
  if (offset !== undefined)
    query = query.range(offset, offset + (limit || 10) - 1);
  const { data, error } = await query;
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function createCup(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("cups")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function updateCup(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("cups")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function deleteCup(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase.from("cups").delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
}

export async function listRaces(options = {}) {
  const { order, limit, offset, filters, seasonId, cupId } = options;
  let f = filters ? [...filters] : [];
  if (seasonId)
    f.push({ column: "season_id", operator: "eq", value: seasonId });
  if (cupId) f.push({ column: "cup_id", operator: "eq", value: cupId });
  let query = supabase.from("races").select("*");
  f.forEach((fi) => {
    query = query[fi.operator](fi.column, fi.value);
  });
  if (order)
    query = query.order(order.column, { ascending: order.ascending !== false });
  if (limit) query = query.limit(limit);
  if (offset !== undefined)
    query = query.range(offset, offset + (limit || 10) - 1);
  const { data, error } = await query;
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function createRace(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("races")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function updateRace(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("races")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function deleteRace(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase.from("races").delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
}

async function saveRaceResultLog(supabase, row) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;
  const { drivers, penalties, ...columns } = row;
  const { error } = await supabase
    .from("race_results_log")
    .insert([{ ...columns, changed_by_user_id: userId }]);
  if (error) throw new Error(handleApiError(error));
}

export async function listRaceResults(raceId) {
  const { data, error } = await supabase
    .from("race_results")
    .select("*, drivers(*), penalties(*)")
    .eq("race_id", raceId)
    .order("finish_position", { ascending: true });
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function listRaceResultsByRaceIds(raceIds = []) {
  if (!raceIds.length) return [];
  const { data, error } = await supabase
    .from("race_results")
    .select("*, drivers(*), penalties(*)")
    .in("race_id", raceIds);
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function createRaceResult(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("race_results")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function updateRaceResult(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data: current, error: currentError } = await supabase
    .from("race_results")
    .select("*")
    .eq("id", id)
    .single();
  if (currentError) throw new Error(handleApiError(currentError));
  await saveRaceResultLog(supabase, current);
  const { data, error } = await supabase
    .from("race_results")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function deleteRaceResult(id) {
  const supabase = await getAuthenticatedClient();
  const { data: current, error: currentError } = await supabase
    .from("race_results")
    .select("*")
    .eq("id", id)
    .single();
  if (currentError) throw new Error(handleApiError(currentError));
  await saveRaceResultLog(supabase, current);
  const { error } = await supabase.from("race_results").delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
}

export async function createPenalties(penalties) {
  if (!penalties.length) return [];
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("penalties")
    .insert(penalties)
    .select("*");
  if (error) throw new Error(handleApiError(error));
  return data;
}

export async function deletePenaltiesByRaceResult(raceResultId) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from("penalties")
    .delete()
    .eq("race_result_id", raceResultId);
  if (error) throw new Error(handleApiError(error));
}

export async function uploadPicture(file) {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("driver-pictures")
    .upload(fileName, file);
  if (error) throw new Error(error.message || "Failed to upload image");
  const { data: publicData } = supabase.storage
    .from("driver-pictures")
    .getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function uploadRaceImage(file) {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop();
  const fileName = `races/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("race-images")
    .upload(fileName, file);
  if (error) throw new Error(error.message || "Failed to upload image");
  const { data: publicData } = supabase.storage
    .from("race-images")
    .getPublicUrl(data.path);
  return publicData.publicUrl;
}
