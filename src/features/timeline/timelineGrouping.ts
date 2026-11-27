/**
 * Timeline Date Grouping and Formatting (F09)
 *
 * Groups timeline items by local calendar day using the user's IANA timezone,
 * ensuring correct day boundaries (e.g. Asia/Colombo +05:30) and honest date kind labeling.
 */

import { TimelineGroup, TimelineItem } from './types';

export function getLocalCalendarDate(isoUtcString: string, timezone?: string): string {
  try {
    const date = new Date(isoUtcString);
    if (isNaN(date.getTime())) return 'invalid';

    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: 'YYYY-MM-DD'
  } catch {
    return isoUtcString.slice(0, 10);
  }
}

export function formatTimelineEventTime(
  isoUtcString: string | null,
  timezone?: string,
  options?: { includeTime?: boolean }
): string {
  if (!isoUtcString) return 'Undated';
  try {
    const date = new Date(isoUtcString);
    if (isNaN(date.getTime())) return 'Undated';

    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (options?.includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = false;
    }
    return new Intl.DateTimeFormat(undefined, formatOptions).format(date);
  } catch {
    return isoUtcString;
  }
}

export function formatTimelineItemSubtitle(item: TimelineItem, timezone?: string): string {
  const parts: string[] = [];

  switch (item.dateKind) {
    case 'observed': {
      const timeStr = formatTimelineEventTime(item.eventAt, item.metadata?.timezone || timezone, {
        includeTime: true,
      });
      parts.push(`Observed: ${timeStr}`);
      if (item.metadata?.conditions) {
        parts.push(item.metadata.conditions);
      }
      break;
    }
    case 'saved': {
      const savedTime = formatTimelineEventTime(item.eventAt, timezone, { includeTime: false });
      parts.push(`Saved: ${savedTime}`);
      if (item.metadata?.publishedAt) {
        const pubTime = formatTimelineEventTime(item.metadata.publishedAt, timezone, {
          includeTime: false,
        });
        parts.push(`Published: ${pubTime}`);
      }
      break;
    }
    case 'read': {
      const readTime = formatTimelineEventTime(item.eventAt, timezone, { includeTime: false });
      parts.push(`Read: ${readTime}`);
      if (item.metadata?.publishedAt) {
        const pubTime = formatTimelineEventTime(item.metadata.publishedAt, timezone, {
          includeTime: false,
        });
        parts.push(`Published: ${pubTime}`);
      }
      break;
    }
    case 'undated': {
      parts.push('Undated reference mark');
      if (item.metadata?.category) {
        parts.push(`Category: ${item.metadata.category}`);
      }
      break;
    }
  }

  return parts.join(' · ');
}

export function groupTimelineByDate(
  items: TimelineItem[],
  timezone?: string,
  nowIso?: string
): TimelineGroup[] {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const now = nowIso ? new Date(nowIso) : new Date();
  const todayCalendar = getLocalCalendarDate(now.toISOString(), tz);

  // Compute yesterday in local timezone
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayCalendar = getLocalCalendarDate(yesterday.toISOString(), tz);

  const groupMap = new Map<string, { title: string; items: TimelineItem[] }>();
  const undatedItems: TimelineItem[] = [];

  for (const item of items) {
    if (!item.eventAt || item.dateKind === 'undated') {
      undatedItems.push(item);
      continue;
    }

    const calendarDate = getLocalCalendarDate(item.eventAt, tz);
    let groupKey: string;
    let groupTitle: string;

    if (calendarDate === todayCalendar) {
      groupKey = 'today';
      groupTitle = 'Today';
    } else if (calendarDate === yesterdayCalendar) {
      groupKey = 'yesterday';
      groupTitle = 'Yesterday';
    } else {
      // Group by Year-Month e.g. '2026-11'
      const yearMonth = calendarDate.slice(0, 7);
      groupKey = yearMonth;

      // Human title e.g. 'November 2026'
      try {
        const [yearStr, monthStr] = yearMonth.split('-');
        const monthIndex = parseInt(monthStr, 10) - 1;
        const year = parseInt(yearStr, 10);
        const sampleDate = new Date(Date.UTC(year, monthIndex, 15));
        groupTitle = new Intl.DateTimeFormat(undefined, {
          timeZone: 'UTC',
          month: 'long',
          year: 'numeric',
        }).format(sampleDate);
      } catch {
        groupTitle = yearMonth;
      }
    }

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { title: groupTitle, items: [] });
    }
    groupMap.get(groupKey)!.items.push(item);
  }

  const result: TimelineGroup[] = [];

  // Dated groups preserving iteration order
  for (const [key, group] of groupMap.entries()) {
    result.push({
      key,
      title: group.title,
      items: group.items,
    });
  }

  // Undated group at the end if any
  if (undatedItems.length > 0) {
    result.push({
      key: 'undated',
      title: 'Undated Reference Marks',
      items: undatedItems,
    });
  }

  return result;
}
