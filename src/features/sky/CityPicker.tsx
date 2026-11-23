import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { studyStyles as s } from '../study/layout';

export interface City {
  id: number;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  zone: string;
}
function CityResults({ onSelect }: { onSelect: (city: City) => void }) {
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<City[]>([]);
  const [loaded, setLoaded] = useState('');
  const [failed, setFailed] = useState(false);
  const term = query.trim().normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  useEffect(() => {
    if (term.length < 2) return;
    let active = true;
    const pattern = term.replace(/[!%_]/g, '!$&') + '%';
    db.getAllAsync<City>(
      `SELECT c.*,MIN(CASE WHEN a.term=? THEN 0 ELSE 1 END) AS rank
      FROM alias a JOIN city c ON c.id=a.id WHERE a.term LIKE ? ESCAPE '!'
      GROUP BY c.id ORDER BY rank,c.pop DESC,c.name LIMIT 12`,
      [term, pattern],
    )
      .then((found) => {
        if (active) {
          setRows(found);
          setLoaded(term);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          setLoaded(term);
          setRows([]);
        }
      });
    return () => {
      active = false;
    };
  }, [db, term]);
  return (
    <View style={{ gap: 8 }}>
      <Input label="Find a city offline" value={query} onChangeText={setQuery} placeholder="Kandy" />
      {term.length >= 2 &&
        (loaded !== term ? (
          <Text style={s.note}>Searching places…</Text>
        ) : rows.length ? (
          rows.map((city) => (
            <Button
              key={city.id}
              title={[city.name, city.region, city.country].filter(Boolean).join(', ')}
              variant="outline"
              onPress={() => onSelect(city)}
            />
          ))
        ) : (
          <Text style={s.note}>
            {failed ? 'City index unavailable.' : 'No matching city.'} You can enter coordinates below.
          </Text>
        ))}
      <Text style={s.note}>City data · GeoNames · CC BY 4.0</Text>
    </View>
  );
}
export function CityPicker({ onSelect }: { onSelect: (city: City) => void }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <Text style={s.note}>Could not open city index. Enter coordinates below.</Text>
  ) : (
    <SQLiteProvider
      databaseName="cities-v1.db"
      assetSource={{ assetId: require('../../../assets/study/cities-v1.db') }}
      onError={() => setFailed(true)}
    >
      <CityResults onSelect={onSelect} />
    </SQLiteProvider>
  );
}
