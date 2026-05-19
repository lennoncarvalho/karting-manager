import { Directive, HostBinding } from '@angular/core';

/** Sugar — `<th ktAccentHeader>` adds the `.kt-th-accent` class. */
@Directive({
  selector: '[ktAccentHeader]',
  standalone: true,
})
export class AccentHeaderDirective {
  @HostBinding('class.kt-th-accent') readonly accent = true;
}
