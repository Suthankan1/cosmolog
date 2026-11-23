import { Button } from '../../components/common/Button';
import { StyleSheet, Text, View } from 'react-native';
import type { SatelliteCacheEntry } from '../../database/repositories/satelliteOrbitRepository';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { satelliteObjects } from './satelliteCatalog';
import { orbitAge } from './satellitePrediction';
import type { SkyPosition } from './skyMath';

interface Props {
  rows: readonly SatelliteCacheEntry[];
  positions: readonly SkyPosition[];
  status: 'loading' | 'ready' | 'unavailable';
  offline: boolean;
  now: number;
  resume?: () => void;
}

export function SatelliteStatus({ rows, positions, status, offline, now, resume }: Props) {
  const paused = rows.some(row => row.failure === 'paused');
  const message = status === 'unavailable' ? 'Could not read or refresh the orbit cache.'
    : paused ? 'The orbit source paused requests. Cached predictions are shown where available.'
    : null;

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Satellite predictions</Text>
      {satelliteObjects.map(object => {
        const row = rows.find(entry => entry.noradId === object.noradId);
        const position = positions.find(entry => entry.id === object.id);
        let label: string;
        if (position) {
          const horizon = position.altitude >= 0 ? 'Above horizon' : 'Below horizon';
          label = position.prediction?.older ? `${horizon} · Older orbit data` : horizon;
        } else if (row?.elements && orbitAge(row.elements.epochAt, now) === 'expired') {
          label = 'Orbit data expired';
        } else if (offline && !row?.elements) {
          label = 'Connect to download orbit data';
        } else if (status === 'loading' && !row?.elements) {
          label = 'Loading orbit data…';
        } else {
          label = 'Orbit data unavailable';
        }
        return <Text key={object.id} style={styles.note}>{object.name} · {label}</Text>;
      })}
      {paused && !offline && resume && <Button title="Resume orbit checks after provider cooldown" variant="outline" onPress={resume}/>}
      {message && <Text style={styles.note}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing[3], gap: spacing[1], borderRadius: radii.md, backgroundColor: colors.sageLight },
  title: { ...typography.label, color: colors.forest },
  note: { ...typography.bodySmall, color: colors.ink },
});
