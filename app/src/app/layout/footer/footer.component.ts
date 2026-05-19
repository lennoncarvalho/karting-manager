import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FlagComponent } from '../../shared/kt-flag/kt-flag.component';

@Component({
  selector: 'kt-footer',
  standalone: true,
  imports: [FlagComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly locales: ReadonlyArray<{ code: string; href: string }> = [
    { code: 'pt-BR', href: '/' },
    { code: 'en', href: '/en/' },
  ];

  protected switch(href: string): void {
    // Angular i18n bundles live under `/<locale>/`. Hard-navigate so the
    // browser loads the correct bundle.
    window.location.href = href;
  }
}
