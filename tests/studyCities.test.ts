import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

it('bundles Kandy, worldwide city namesakes and valid observing zones', () => {
  const db = new DatabaseSync(join(__dirname, '../assets/study/cities-v1.db'), { readOnly: true });
  try {
    const city = db
      .prepare("SELECT * FROM city WHERE name='Kandy' AND country='Sri Lanka' ORDER BY pop DESC LIMIT 1")
      .get();
    expect(city?.zone).toBe('Asia/Colombo');
    expect(Number(city?.latitude)).toBeCloseTo(7.29, 1);
    expect(
      db.prepare("SELECT DISTINCT country FROM alias JOIN city USING(id) WHERE term='paris'").all().length,
    ).toBeGreaterThan(1);
    expect(db.prepare('PRAGMA quick_check').get()?.quick_check).toBe('ok');
  } finally {
    db.close();
  }
});
