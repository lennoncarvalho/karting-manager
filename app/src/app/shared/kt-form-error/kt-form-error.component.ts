import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kt-form-error',
  standalone: true,
  templateUrl: './kt-form-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorComponent {
  readonly message = input<string | null | undefined>(null);
}
