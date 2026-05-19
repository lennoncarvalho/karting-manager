import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

/**
 * Singleton wrapper around the Supabase JS client. Only the anon key is
 * sent to the browser; row-level security enforces the authorization
 * rules documented in `kartarados/skills/supabase/SKILL.md`.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  /** Translate a Supabase/PostgREST error into a user-friendly message. */
  static humanize(error: { message?: string; code?: string } | null | undefined): string {
    if (!error) return 'An unexpected error occurred. Please try again.';
    const msg = error.message ?? '';
    if (msg.includes('JWT')) return 'Session expired. Please log in again.';
    if (error.code === '23505' || msg.includes('duplicate key')) return 'This record already exists.';
    if (msg.includes('foreign key')) return 'Cannot delete: this record is referenced by other data.';
    if (msg.includes('violates check constraint')) return 'Invalid data provided. Please check your input.';
    return msg || 'An unexpected error occurred. Please try again.';
  }
}
