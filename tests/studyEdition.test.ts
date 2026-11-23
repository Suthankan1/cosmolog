import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { studyEntries, sectionAnchor, glossary } from '../src/features/study/edition';
import { packEntries, manifestSchema } from '../src/features/study/packRepository';
import manifest from '../study-releases/manifest.json';

it('publishes eight ordered chapters with stable section anchors, definitions and valid local cross-references', () => {
  const chapters = studyEntries.filter(entry => entry.chapter);
  expect(chapters.map(chapter => chapter.chapter)).toEqual([1,2,3,4,5,6,7,8]);
  const ids = new Set(studyEntries.map(entry => entry.id));
  expect(ids.size).toBe(studyEntries.length);
  for (const entry of studyEntries) {
    expect(new URL(entry.url).protocol).toBe('https:');
    expect(entry.source.trim()).not.toBe('');
    for (const link of entry.related) expect(ids.has(link)).toBe(true);
  }
  for (const chapter of chapters) {
    const ids = chapter.body.split('\n\n').map((section, index) => {
      expect(section.split('\n')).toHaveLength(2);
      return sectionAnchor(chapter.id,index);
    });
    expect(ids).not.toContain(null);
    expect(new Set(ids).size).toBe(ids.length);
    expect(glossary[chapter.id].length).toBeGreaterThan(0);
  }
});

it('ships byte-identical resumable parts with the published counts and checksums',()=>{
  for (const pack of manifestSchema.parse(manifest).packs) {
    for (const part of pack.parts) {
      const raw=readFileSync(join(__dirname,'../study-releases',pack.id,String(pack.revision),part.file));
      const records=packEntries.parse(JSON.parse(raw.toString()));
      expect(records).toHaveLength(part.count);
      expect(raw.byteLength).toBe(part.bytes);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(part.sha256);
      expect(JSON.stringify(JSON.parse(raw.toString()))+'\n').toBe(raw.toString());
    }
  }
});
