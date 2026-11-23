import { localCalendarDate, previousPlateDate } from '../src/features/discovery/plateDates';

it('uses the device calendar, skips invalid leap dates and respects the archive start', () => {
  expect(localCalendarDate(new Date(2026, 10, 23, 0, 30))).toBe('2026-11-23');
  expect(previousPlateDate('2026-11-23')).toBe('2025-11-23');
  expect(previousPlateDate('2028-02-29')).toBe('2024-02-29');
  expect(previousPlateDate('1996-06-15')).toBeNull();
  expect(previousPlateDate('1996-06-16')).toBe('1995-06-16');
});
