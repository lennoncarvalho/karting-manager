import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats an ISO timestamp as `dd/MM/yyyy HH:mm` (pt-BR style). For the
 * `en` locale Angular's built-in DatePipe is preferred — this is a
 * lightweight default that doesn't require zone.js timezone data.
 */
@Pipe({ name: 'ktDateTime', standalone: true })
export class DateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }
}
