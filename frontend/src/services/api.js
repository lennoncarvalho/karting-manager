/**
 * Supabase API Client
 * Handles all database operations via Supabase REST API
 * 
 * Reference: contracts/api-contracts.md for endpoint specifications
 */

import * as Sentry from '@sentry/browser';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// Supabase client is initialized in index.html
// This module provides helper functions for API operations

/**
 * Get the Supabase client instance
 * @returns {Object} Supabase client
 */
export function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error('Supabase client not initialized. Ensure index.html loads Supabase JS.');
  }
  return window.supabase;
}

/**
 * Get authenticated Supabase client with session
 * @returns {Object} Supabase client with auth session
 */
export async function getAuthenticatedClient() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  return supabase;
}

/**
 * Handle API errors and return user-friendly messages
 * @param {Error} error - Error object from Supabase
 * @returns {string} User-friendly error message
 */
export function handleApiError(error) {
  if (error.message) {
    // Supabase-specific errors
    if (error.message.includes('JWT')) {
      return 'Session expired. Please log in again.';
    }
    if (error.message.includes('duplicate key')) {
      return 'This record already exists.';
    }
    if (error.message.includes('foreign key')) {
      return 'Cannot delete: this record is referenced by other data.';
    }
    if (error.message.includes('violates check constraint')) {
      return 'Invalid data provided. Please check your input.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Base query builder for Supabase operations
 * @param {string} table - Table name
 * @param {Object} options - Query options (select, filter, order, limit, offset)
 * @returns {Promise} Query result
 */
export async function queryTable(table, options = {}) {
  const supabase = getSupabaseClient();
  let query = supabase.from(table).select(options.select || '*');
  
  // Apply filters
  if (options.filters) {
    options.filters.forEach(filter => {
      query = query[filter.operator](filter.column, filter.value);
    });
  }
  
  // Apply ordering
  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending !== false });
  }
  
  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

/**
 * Seasons CRUD
 */
const SEASONS_CACHE_KEY = 'seasonsCache';
const SEASONS_CACHE_BY_ID_KEY = 'seasonsCacheById';

function readStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    Sentry.captureException(error);
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function readSeasonsListCache() {
  const data = readStorageJson(SEASONS_CACHE_KEY);
  return Array.isArray(data) ? data : null;
}

function sortSeasonsByEndDate(list) {
  return [...list].sort((left, right) => {
    const leftDate = left && left.end_date ? left.end_date : '';
    const rightDate = right && right.end_date ? right.end_date : '';
    return rightDate.localeCompare(leftDate);
  });
}

function writeSeasonsListCache(list) {
  writeStorageJson(SEASONS_CACHE_KEY, sortSeasonsByEndDate(list));
}

function writeSeasonsByIdCache(cache) {
  writeStorageJson(SEASONS_CACHE_BY_ID_KEY, cache);
}

function cacheSeasonById(season) {
  if (!season || season.id === undefined || season.id === null) return;
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  cache[String(season.id)] = season;
  writeSeasonsByIdCache(cache);
}

function cacheSeasonsById(seasons) {
  if (!Array.isArray(seasons)) return;
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  seasons.forEach(season => {
    if (season && season.id !== undefined && season.id !== null) {
      cache[String(season.id)] = season;
    }
  });
  writeSeasonsByIdCache(cache);
}

function upsertSeasonInListCache(season) {
  const list = readSeasonsListCache();
  if (!list || !season || season.id === undefined || season.id === null) return;
  const targetId = String(season.id);
  const updated = list.map(item => (String(item.id) === targetId ? season : item));
  if (!updated.some(item => String(item.id) === targetId)) {
    updated.push(season);
  }
  writeSeasonsListCache(updated);
}

function removeSeasonFromListCache(seasonId) {
  const list = readSeasonsListCache();
  if (!list) return;
  const targetId = String(seasonId);
  const updated = list.filter(item => String(item.id) !== targetId);
  writeSeasonsListCache(updated);
}

export async function listSeasons(options = {}) {
  const hasCustomQuery = !!(options.filters || options.limit || options.offset || options.order);
  if (!hasCustomQuery) {
    const cached = readSeasonsListCache();
    if (cached) {
      return cached;
    }
  }
  const data = await queryTable('seasons', {
    order: options.order || { column: 'end_date', ascending: false },
    limit: options.limit,
    offset: options.offset,
    filters: options.filters
  });
  if (!hasCustomQuery) {
    writeSeasonsListCache(data);
  }
  cacheSeasonsById(data);
  return data;
}

export async function getSeasonById(seasonId) {
  if (seasonId === undefined || seasonId === null) return null;
  const key = String(seasonId);
  const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
  if (cache[key]) {
    return cache[key];
  }
  const data = await queryTable('seasons', {
    filters: [{ column: 'id', operator: 'eq', value: seasonId }],
    limit: 1
  });
  const season = data[0] || null;
  if (season) {
    cacheSeasonById(season);
  }
  return season;
}

export async function createSeason(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('seasons')
    .insert([payload])
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  cacheSeasonById(data);
  upsertSeasonInListCache(data);
  return data;
}

export async function updateSeason(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('seasons')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  cacheSeasonById(data);
  upsertSeasonInListCache(data);
  return data;
}

export async function deleteSeason(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  try {
    const cache = readStorageJson(SEASONS_CACHE_BY_ID_KEY) || {};
    delete cache[String(id)];
    writeSeasonsByIdCache(cache);
  } catch (error) {
    Sentry.captureException(error);
    // Ignore storage errors.
  }
  removeSeasonFromListCache(id);
}

/**
 * Drivers CRUD
 */
export async function listDrivers(options = {}) {
  return queryTable('drivers', {
    order: options.order || { column: 'name', ascending: true },
    limit: options.limit,
    offset: options.offset,
    filters: options.filters
  });
}

export async function createDriver(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('drivers')
    .insert([payload])
    .select('*')
    .single();
  
  if (error) {
    if (error.code === '23505' || error.status === 409) {
      throw new Error('Email already exists. Please use a different email.');
    }
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function updateDriver(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function deleteDriver(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Cups CRUD
 */
export async function listCups(options = {}) {
  const filters = options.filters ? [...options.filters] : [];
  if (options.seasonId) {
    filters.push({ column: 'season_id', operator: 'eq', value: options.seasonId });
  }
  
  return queryTable('cups', {
    order: options.order || { column: 'start_date', ascending: true },
    limit: options.limit,
    offset: options.offset,
    filters
  });
}

export async function createCup(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('cups')
    .insert([payload])
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function updateCup(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('cups')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function deleteCup(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from('cups')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Races CRUD
 */
export async function listRaces(options = {}) {
  const filters = options.filters ? [...options.filters] : [];
  if (options.seasonId) {
    filters.push({ column: 'season_id', operator: 'eq', value: options.seasonId });
  }
  if (options.cupId) {
    filters.push({ column: 'cup_id', operator: 'eq', value: options.cupId });
  }
  
  return queryTable('races', {
    order: options.order || { column: 'race_datetime', ascending: true },
    limit: options.limit,
    offset: options.offset,
    filters
  });
}

export async function createRace(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('races')
    .insert([payload])
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function updateRace(id, updates) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('races')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function deleteRace(id) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from('races')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Save a race_results row snapshot to race_results_log before it is mutated or deleted.
 * Includes the authenticated user UUID that triggered the change.
 */
async function saveRaceResultLog(supabase, row) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  // Strip relational / computed fields that don't belong in the log table.
  const { drivers, penalties, ...columns } = row;

  const { error } = await supabase
    .from('race_results_log')
    .insert([{ ...columns, changed_by_user_id: userId }]);
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Race Results CRUD
 * On update/delete the previous row state is saved to race_results_log for audit.
 */
export async function listRaceResults(raceId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('race_results')
    .select('*, drivers(*), penalties(*)')
    .eq('race_id', raceId)
    .order('finish_position', { ascending: true });
  if (error) {
    throw new Error(handleApiError(error));
  }
  return data;
}

export async function listRaceResultsByRaceIds(raceIds = []) {
  if (!raceIds.length) {
    return [];
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('race_results')
    .select('*, drivers(*), penalties(*)')
    .in('race_id', raceIds);
  if (error) {
    throw new Error(handleApiError(error));
  }
  return data;
}

export async function createRaceResult(payload) {
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('race_results')
    .insert([payload])
    .select('*')
    .single();
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

/**
 * Update a race result in-place. Before applying changes the previous row
 * state is saved to race_results_log for audit purposes.
 */
export async function updateRaceResult(id, updates) {
  const supabase = await getAuthenticatedClient();

  // Fetch the current row so we can log it before mutating.
  const { data: current, error: currentError } = await supabase
    .from('race_results')
    .select('*')
    .eq('id', id)
    .single();
  if (currentError) {
    throw new Error(handleApiError(currentError));
  }

  // Save previous state to audit log.
  await saveRaceResultLog(supabase, current);

  const { data, error } = await supabase
    .from('race_results')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    throw new Error(handleApiError(error));
  }
  return data;
}

/** Delete a race result. The previous state is saved to race_results_log first. */
export async function deleteRaceResult(id) {
  const supabase = await getAuthenticatedClient();

  // Fetch the current row so we can log it before deleting.
  const { data: current, error: currentError } = await supabase
    .from('race_results')
    .select('*')
    .eq('id', id)
    .single();
  if (currentError) {
    throw new Error(handleApiError(currentError));
  }

  // Save previous state to audit log.
  await saveRaceResultLog(supabase, current);

  const { error } = await supabase
    .from('race_results')
    .delete()
    .eq('id', id);
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Penalties CRUD
 */
export async function createPenalties(penalties) {
  if (!penalties.length) {
    return [];
  }
  const supabase = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from('penalties')
    .insert(penalties)
    .select('*');
  
  if (error) {
    throw new Error(handleApiError(error));
  }
  
  return data;
}

export async function deletePenaltiesByRaceResult(raceResultId) {
  const supabase = await getAuthenticatedClient();
  const { error } = await supabase
    .from('penalties')
    .delete()
    .eq('race_result_id', raceResultId);
  
  if (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Sum penalty points by type and count
 * @param {Array} penalties - Penalty records
 * @returns {number} Total penalty points
 */
export function calculatePenaltyPoints(penalties = []) {
  return penalties.reduce((total, penalty) => {
    const count = Number(penalty.count || 0);
    const points = Number(penalty.point_deduction || 0);
    return total + (points * count);
  }, 0);
}
