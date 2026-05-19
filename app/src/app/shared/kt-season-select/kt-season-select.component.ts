import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SeasonStore } from '../../core/season.store';

/**
 * Season selector dropdown. Reads from and writes to `SeasonStore` —
 * any component that needs the currently selected season just reads
 * `seasonStore.selectedSeason()`.
 */
@Component({
  selector: 'kt-season-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './kt-season-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonSelectComponent {
  protected readonly store = inject(SeasonStore);

  protected onChange(id: string): void {
    this.store.select(id || null);
  }
}
