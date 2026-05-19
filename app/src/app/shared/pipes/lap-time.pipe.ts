import { Pipe, PipeTransform } from '@angular/core';

/** Passes through lap-time strings unchanged but normalises `null/undefined` to `'—'`. */
@Pipe({ name: 'lapTime', standalone: true })
export class LapTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value && value.trim() ? value : '—';
  }
}
