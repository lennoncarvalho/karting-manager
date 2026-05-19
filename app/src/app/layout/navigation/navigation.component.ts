import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthStore } from '../../core/auth.store';
import { SeasonSelectComponent } from '../../shared/kt-season-select/kt-season-select.component';
import { ButtonComponent } from '../../shared/kt-button/kt-button.component';

@Component({
  selector: 'kt-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SeasonSelectComponent, ButtonComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
