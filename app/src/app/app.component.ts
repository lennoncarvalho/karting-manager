import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavigationComponent } from './layout/navigation/navigation.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LoadingOverlayComponent } from './shared/kt-loading-overlay/kt-loading-overlay.component';

@Component({
  selector: 'kt-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, FooterComponent, LoadingOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
