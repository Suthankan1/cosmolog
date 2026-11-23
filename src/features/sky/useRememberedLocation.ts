import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { getDatabase, writeDatabase } from '../../database/db';
import { useSkyLocation, type ManualLocation } from './useSkyLocation';

export function useRememberedLocation(active: boolean) {
  const [restored, setRestored] = useState(false);
  const controls = useSkyLocation(active && restored);
  const choose = useRef(controls.chooseLocation);
  const clearCity = useRef(controls.clearRememberedCity);
  const changes = useRef(0);
  useEffect(() => {
    if (!active) return;
    const startingRevision = changes.current;
    let mounted = true;
    async function restore() {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM study_meta WHERE key='sky-city'",
      );
      if (!mounted || changes.current !== startingRevision) return;
      if (!row) {
        clearCity.current();
        return;
      }
      const place: ManualLocation = JSON.parse(row.value);
      if (
        place.city &&
        place.kind === 'manual' &&
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude)
      ) {
        new Intl.DateTimeFormat(undefined, { timeZone: place.city.zone });
        choose.current(place);
      }
    }
    void restore()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setRestored(true);
      });
    return () => {
      mounted = false;
    };
  }, [active]);
  function remember(place?: ManualLocation) {
    changes.current += 1;
    void writeDatabase((db) =>
      place?.city
        ? db.runAsync("INSERT OR REPLACE INTO study_meta VALUES ('sky-city',?)", [JSON.stringify(place)])
        : db.runAsync("DELETE FROM study_meta WHERE key='sky-city'"),
    ).catch(() => Alert.alert('City preference could not be saved'));
  }
  return {
    ...controls,
    chooseLocation: (place: ManualLocation) => {
      remember(place);
      controls.chooseLocation(place);
    },
    useLocation: () => {
      remember();
      controls.useLocation();
    },
  };
}
