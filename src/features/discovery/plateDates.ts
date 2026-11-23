import { isCalendarDate } from '../../navigation/types';

export const APOD_ARCHIVE_START = '1995-06-16';

export function localCalendarDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function previousPlateDate(today: string): string | null {
  for (let year = Number(today.slice(0, 4)) - 1; year >= 1995; year--) {
    const candidate = year + today.slice(4);
    if (candidate >= APOD_ARCHIVE_START && isCalendarDate(candidate)) return candidate;
  }
  return null;
}
