import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

/**
 * Holds the current Supabase auth session as a signal. Any authenticated
 * user is considered an admin (mirrors v1 behaviour: there is no
 * `profiles` table or role column).
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly supa = inject(SupabaseService);

  /** Raw Supabase session, or null when logged out. */
  readonly session = signal<Session | null>(null);

  /** True while we are still trying to restore a persisted session. */
  readonly hydrating = signal<boolean>(true);

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAdmin = computed(() => this.user() !== null);
  readonly userEmail = computed(() => this.user()?.email ?? null);

  constructor() {
    // Keep the signal in sync with Supabase's own subscription.
    this.supa.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  /**
   * Load any persisted session from local storage. Resolves once.
   * Called from `app.config.ts` via `provideAppInitializer` + `inject()`.
   */
  // fallow-ignore-next-line unused-class-member
  async restoreSession(): Promise<void> {
    try {
      const { data } = await this.supa.client.auth.getSession();
      this.session.set(data.session);
    } finally {
      this.hydrating.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supa.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(SupabaseService.humanize(error));
    this.session.set(data.session);
  }

  async logout(): Promise<void> {
    const { error } = await this.supa.client.auth.signOut();
    if (error) throw new Error(SupabaseService.humanize(error));
    this.session.set(null);
  }

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await this.supa.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(SupabaseService.humanize(error));
  }
}
