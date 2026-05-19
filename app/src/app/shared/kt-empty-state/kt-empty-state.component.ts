import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kt-empty-state',
  standalone: true,
  templateUrl: './kt-empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input<string>('Nothing to show');
  readonly message = input<string | null>(null);
}
