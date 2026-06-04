import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Generic table skeleton row.
 *
 * Renders `[rows]` shimmering placeholder rows, each with `[columns]`
 * cells. Uses an attribute selector on `<tbody>` so the produced
 * `<tr>` rows are valid direct children of the host table body.
 *
 * Usage (drop the attribute on the loading `<tbody>` itself):
 *   <tbody kt-skeleton-row [columns]="5" [rows]="4"></tbody>
 *
 * Or wrap conditionally with two bodies:
 *   @if (loading()) {
 *     <tbody kt-skeleton-row [columns]="5" [rows]="4"></tbody>
 *   } @else {
 *     <tbody> ... </tbody>
 *   }
 */
@Component({
  selector: 'tbody[kt-skeleton-row]',
  standalone: true,
  templateUrl: './kt-skeleton-row.component.html',
  styleUrl: './kt-skeleton-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonRowComponent {
  readonly columns = input<number>(4);
  readonly rows = input<number>(5);

  /** Pre-computed `[0..rows-1]` index array. */
  protected readonly rowIndexes = computed(() =>
    Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i),
  );

  /** Pre-computed `[0..columns-1]` index array. */
  protected readonly colIndexes = computed(() =>
    Array.from({ length: Math.max(1, this.columns()) }, (_, i) => i),
  );

  /** Vary placeholder widths so the rows don't look identical. */
  protected widthFor(col: number, row: number): string {
    const pattern = [85, 60, 70, 50, 75, 65, 80, 55];
    return `${pattern[(col + row) % pattern.length]}%`;
  }
}
