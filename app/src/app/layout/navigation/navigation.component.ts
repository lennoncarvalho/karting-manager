import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapse, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthStore } from '../../core/auth.store';
import { SeasonSelectComponent } from '../../shared/kt-season-select/kt-season-select.component';

@Component({
  selector: 'kt-navigation',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgbCollapse,
    NgbDropdownModule,
    SeasonSelectComponent,
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** ng-bootstrap [ngbCollapse] is `true` when the menu is hidden. */
  protected readonly collapsed = signal(true);

  protected toggleCollapsed(): void {
    this.collapsed.update((c) => !c);
  }

  protected closeMenu(): void {
    this.collapsed.set(true);
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.closeMenu();
    await this.router.navigateByUrl('/');
  }
}
