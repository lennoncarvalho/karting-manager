import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Language flag icon (uses flag-icons). `locale` is e.g. `pt-BR` or `en`. */
@Component({
  selector: 'kt-flag',
  standalone: true,
  templateUrl: './kt-flag.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagComponent {
  readonly locale = input<string>('pt-BR');
  protected readonly code = () => {
    const loc = this.locale().toLowerCase();
    if (loc.startsWith('pt')) return 'br';
    if (loc.startsWith('en')) return 'us';
    return loc.split('-')[0] ?? 'us';
  };
}
