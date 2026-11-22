/**
 * Cleans HTML content returned by astronomy feeds into clean editorial prose.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Formats an ISO date or YYYY-MM-DD string into editorial date display (e.g. "22 Nov 2026").
 */
export function formatEditorialDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date unavailable';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? 'UTC' : undefined,
    });
  } catch {
    return dateStr;
  }
}
