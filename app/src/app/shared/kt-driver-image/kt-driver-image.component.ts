import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Driver avatar / picture. Falls back to a Bootstrap-icon placeholder
 * when no picture is set. Single source of truth for showing a driver's
 * face anywhere in the app (rankings, race detail, driver list).
 */
@Component({
  selector: 'kt-driver-image',
  standalone: true,
  templateUrl: './kt-driver-image.component.html',
  styleUrl: './kt-driver-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverImageComponent {
  readonly src = input<string | null | undefined>(null);
  readonly name = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly rounded = input<'circle' | 'square'>('circle');

  protected readonly sizePx = computed(() => {
    switch (this.size()) {
      case 'sm': return 28;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 40;
    }
  });

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  });
}
