// Run with Node's TypeScript support. Inputs are the four GeoNames downloads listed in assets/study/README.md.
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [world, sriLanka, regionsFile, countriesFile, destination] = process.argv.slice(2);
if (!destination)
  throw Error(
    'Expected cities15000.zip, LK.zip, admin1CodesASCII.txt, countryInfo.txt and a new database path',
  );
function labels(file: string, column: number) {
  return new Map(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const fields = line.split('\t');
        return [fields[0], fields[column]];
      }),
  );
}
const regions = labels(regionsFile, 1);
const countries = labels(countriesFile, 4);
const db = new DatabaseSync(destination);
db.exec(`PRAGMA page_size=4096; BEGIN;
 CREATE TABLE city(id INTEGER PRIMARY KEY,name TEXT,region TEXT,country TEXT,latitude REAL,longitude REAL,zone TEXT,pop INTEGER);
 CREATE TABLE alias(term TEXT COLLATE NOCASE,id INTEGER,PRIMARY KEY(term,id)) WITHOUT ROWID;`);
const add = db.prepare('INSERT OR IGNORE INTO city VALUES (?,?,?,?,?,?,?,?)');
const alias = db.prepare('INSERT OR IGNORE INTO alias VALUES (?,?)');
for (const [file, member] of [
  [world, 'cities15000.txt'],
  [sriLanka, 'LK.txt'],
]) {
  const contents = execFileSync('unzip', ['-p', file, member], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  for (const line of contents.trimEnd().split('\n')) {
    const [id, name, ascii, alternates, lat, lon, kind, code, country, , admin, , , , pop, , , zone] =
      line.split('\t');
    if (kind !== 'P' || ['PPLH', 'PPLQ', 'PPLW'].includes(code) || !zone) continue;
    if (!Number.isFinite(+lat) || !Number.isFinite(+lon) || Math.abs(+lat) > 90 || Math.abs(+lon) > 180)
      throw Error('Invalid coordinates ' + id);
    const result = add.run(
      +id,
      name,
      regions.get(country + '.' + admin) ?? admin,
      countries.get(country) ?? country,
      +lat,
      +lon,
      zone,
      Number(pop) || 0,
    );
    if (result.changes)
      for (const value of new Set([name, ascii, ...alternates.split(',')])) {
        const term = value.trim().normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
        if (term) alias.run(term, +id);
      }
  }
}
db.exec('COMMIT; VACUUM');
console.log(db.prepare('SELECT COUNT(*) AS cities FROM city').get());
db.close();
