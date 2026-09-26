import { supabase, APP_URL } from "./supabase";
import * as Sentry from "@sentry/react";

let isRefreshing = false;
let refreshPromise = null;

export function getSupabaseClient() {
  return supabase;
}

async function getAuthenticatedClient() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return supabase;
}

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = supabase.auth.refreshSession();
  try {
    const { data, error } = await refreshPromise;
    if (error) throw error;
    return data.session;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function executeWithRetry(requestFn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.message?.includes("JWT") && attempt < maxRetries) {
        try {
          await refreshToken();
          continue;
        } catch (refreshError) {
          Sentry.captureException(refreshError);
          throw new Error("Session expired. Please log in again.");
        }
      }
      if (attempt === maxRetries) {
        Sentry.captureException(error);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

function handleApiError(error) {
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

export function invalidateSeasonCache() {
  try {
    localStorage.removeItem(SEASONS_CACHE_KEY);
    localStorage.removeItem(SEASONS_CACHE_BY_ID_KEY);
  } catch {}
}

function applyListOptions(query, { order, limit, offset, filters } = {}) {
  if (filters)
    filters.forEach((f) => {
      query = query[f.operator](f.column, f.value);
    });
  if (order)
    query = query.order(order.column, { ascending: order.ascending !== false });
  if (limit) query = query.limit(limit);
  if (offset !== undefined)
    query = query.range(offset, offset + (limit || 10) - 1);
  return query;
}

async function insertOne(supabase, table, payload) {
  const { data, error } = await supabase
    .from(table)
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

async function updateOne(supabase, table, id, updates) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(handleApiError(error));
  return data;
}

async function deleteById(supabase, table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(handleApiError(error));
}

export async function listSeasons(options = {}) {
  return executeWithRetry(async () => {
    const query = applyListOptions(
      supabase.from("seasons").select("*"),
      options,
    );
    const { data, error } = await query;
    if (error) throw new Error(handleApiError(error));
    if (!options.filters?.length)
      writeStorageJson(SEASONS_CACHE_KEY, sortSeasonsByEndDate(data));
    cacheSeasonsById(data);
    return data;
  });
}

export async function getSeasonById(id) {
  if (id === undefined || id === null) return null;
  const key = String(id);
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  if (cache[key]) return cache[key];
  return executeWithRetry(async () => {
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", id)
      .limit(1);
    if (error) throw new Error(handleApiError(error));
    const season = data?.[0] || null;
    if (season) cacheSeasonById(season);
    return season;
  });
}

export async function createSeason(payload) {
  const supabase = await getAuthenticatedClient();
  const result = await executeWithRetry(() =>
    insertOne(supabase, "seasons", payload),
  );
  cacheSeasonById(result);
  invalidateSeasonCache();
  return result;
}

export async function updateSeason(id, updates) {
  const supabase = await getAuthenticatedClient();
  const result = await executeWithRetry(() =>
    updateOne(supabase, "seasons", id, updates),
  );
  cacheSeasonById(result);
  invalidateSeasonCache();
  return result;
}

export async function deleteSeason(id) {
  const supabase = await getAuthenticatedClient();
  await executeWithRetry(() => deleteById(supabase, "seasons", id));
  invalidateSeasonCache();
}

export async function listDrivers(options = {}) {
  return executeWithRetry(async () => {
    const query = applyListOptions(
      supabase.from("drivers").select("*"),
      options,
    );
    const { data, error } = await query;
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function createDriver(payload) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(async () => {
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
  });
}

export async function updateDriver(id, updates) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => updateOne(supabase, "drivers", id, updates));
}

export async function deleteDriver(id) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => deleteById(supabase, "drivers", id));
}

export async function listCups(options = {}) {
  return executeWithRetry(async () => {
    const { seasonId, filters, ...rest } = options;
    const f = filters ? [...filters] : [];
    if (seasonId)
      f.push({ column: "season_id", operator: "eq", value: seasonId });
    const query = applyListOptions(supabase.from("cups").select("*"), {
      ...rest,
      filters: f,
    });
    const { data, error } = await query;
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function createCup(payload) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => insertOne(supabase, "cups", payload));
}

export async function updateCup(id, updates) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => updateOne(supabase, "cups", id, updates));
}

export async function deleteCup(id) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => deleteById(supabase, "cups", id));
}

export async function listRaces(options = {}) {
  return executeWithRetry(async () => {
    const { seasonId, cupId, filters, ...rest } = options;
    const f = filters ? [...filters] : [];
    if (seasonId)
      f.push({ column: "season_id", operator: "eq", value: seasonId });
    if (cupId) f.push({ column: "cup_id", operator: "eq", value: cupId });
    const query = applyListOptions(supabase.from("races").select("*"), {
      ...rest,
      filters: f,
    });
    const { data, error } = await query;
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function createRace(payload) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => insertOne(supabase, "races", payload));
}

export async function updateRace(id, updates) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => updateOne(supabase, "races", id, updates));
}

export async function deleteRace(id) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => deleteById(supabase, "races", id));
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
  return executeWithRetry(async () => {
    const { data, error } = await supabase
      .from("race_results")
      .select("*, drivers(*), penalties(*)")
      .eq("race_id", raceId)
      .order("finish_position", { ascending: true });
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function listRaceResultsByRaceIds(raceIds = []) {
  if (!raceIds.length) return [];
  return executeWithRetry(async () => {
    const { data, error } = await supabase
      .from("race_results")
      .select("*, drivers(*), penalties(*)")
      .in("race_id", raceIds);
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

async function fetchRaceResultCurrent(supabase, id) {
  return executeWithRetry(async () => {
    const { data, error } = await supabase
      .from("race_results")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function createRaceResult(payload) {
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(() => insertOne(supabase, "race_results", payload));
}

export async function updateRaceResult(id, updates) {
  const supabase = await getAuthenticatedClient();
  const current = await fetchRaceResultCurrent(supabase, id);
  await saveRaceResultLog(supabase, current);
  return executeWithRetry(() =>
    updateOne(supabase, "race_results", id, updates),
  );
}

export async function deleteRaceResult(id) {
  const supabase = await getAuthenticatedClient();
  const current = await fetchRaceResultCurrent(supabase, id);
  await saveRaceResultLog(supabase, current);
  return executeWithRetry(() => deleteById(supabase, "race_results", id));
}

export async function createPenalties(penalties) {
  if (!penalties.length) return [];
  const supabase = await getAuthenticatedClient();
  return executeWithRetry(async () => {
    const { data, error } = await supabase
      .from("penalties")
      .insert(penalties)
      .select("*");
    if (error) throw new Error(handleApiError(error));
    return data;
  });
}

export async function uploadPicture(file) {
  const supabase = getSupabaseClient();
  return executeWithRetry(async () => {
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
  });
}
