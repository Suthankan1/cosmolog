export function splitReadingParagraphs(body: string): string[] {
  return body.split(/\n\s*\n/).flatMap(paragraph => {
    const trimmed = paragraph.trim();
    if (trimmed.length <= 480) return trimmed ? [trimmed] : [];
    const sentences = trimmed.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [trimmed];
    const sections: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > 480) {
        sections.push(current.trim());
        current = '';
      }
      current += sentence;
    }
    if (current.trim()) sections.push(current.trim());
    return sections;
  });
}

/** Identifies the text revision so scroll anchors cannot point into changed content. */
export function readingFingerprint(body: string): string {
  let hash = 2166136261;
  for (let index = 0; index < body.length; index++) {
    hash = Math.imul(hash ^ body.charCodeAt(index), 16777619);
  }
  return body.length + ':' + (hash >>> 0).toString(16);
}
