import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'kt-loading-overlay',
  standalone: true,
  templateUrl: './kt-loading-overlay.component.html',
  styleUrl: './kt-loading-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  private readonly loading = inject(LoadingService);
  readonly isLoading = this.loading.isLoading;
}
