import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../../core/auth.store';

/**
 * Deep-link target for Supabase's password recovery e-mail.
 *
 * Supabase fires a `PASSWORD_RECOVERY` event on `onAuthStateChange` when
 * the user follows the e-mail link with a hash containing the recovery
 * tokens. By the time this component mounts, `AuthStore` already
 * reflects the temporary session, so we can call
 * `supabase.auth.updateUser({ password })` via `AuthStore.changePassword`
 * directly.
 */
@Component({
  selector: 'kt-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal(false);

  protected setPassword(v: string): void {
    this.password.set(v);
  }
  protected setConfirm(v: string): void {
    this.confirm.set(v);
  }

  protected async submit(): Promise<void> {
    this.error.set(null);
    const pw = this.password();
    if (pw.length < 8) {
      this.error.set($localize`Password must be at least 8 characters.`);
      return;
    }
    if (pw !== this.confirm()) {
      this.error.set($localize`Passwords do not match.`);
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.changePassword(pw);
      this.done.set(true);
      setTimeout(() => void this.router.navigateByUrl('/admin'), 1500);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
