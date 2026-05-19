import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type KtButtonVariant =
  | 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  | 'info' | 'light' | 'dark' | 'link'
  | 'outline-primary' | 'outline-secondary' | 'outline-danger';

/**
 * Reusable Bootstrap button with optional `loading` spinner and an
 * `accent` flag that paints the button with `--kt-season-accent`.
 * Single source of truth for every button in the app (spec §7.2).
 */
@Component({
  selector: 'kt-button',
  standalone: true,
  templateUrl: './kt-button.component.html',
  styleUrl: './kt-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<KtButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly accent = input<boolean>(false);
  readonly icon = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly fullWidth = input<boolean>(false);

  readonly clicked = output<void>();

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit();
  }
}
