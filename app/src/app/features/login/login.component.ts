import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth.store';
import { LoadingService } from '../../core/loading.service';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';
import { FormErrorComponent } from '../../shared/kt-form-error/kt-form-error.component';

@Component({
  selector: 'kt-login',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonComponent, FormErrorComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loading = inject(LoadingService);

  protected email = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<boolean>(false);

  protected async submit(form: NgForm): Promise<void> {
    if (form.invalid) return;
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.loading.track(this.auth.login(this.email, this.password));
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin';
      await this.router.navigateByUrl(returnUrl);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
