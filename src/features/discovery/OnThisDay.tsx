import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '../../components/common/Button';
import type { DiscoveryItem } from '../../database/models';
import { findCachedPlateAnniversary } from '../../database/repositories/discoveryRepository';
import { navigateToDetails } from '../../navigation/types';
import type { Connection } from '../../services/network/networkObserver';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { formatEditorialDate } from '../../utils/text';
import { localCalendarDate, previousPlateDate } from './plateDates';

export function OnThisDay({ connection }: { connection: Connection }) {
  const router = useRouter();
  const today = localCalendarDate(new Date());
  const [result, setResult] = useState<{ date: string; attempt: number; item?: DiscoveryItem | null }>();
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    void findCachedPlateAnniversary(today).then(
      item => { if (active) setResult({ date: today, attempt, item }); },
      () => { if (active) setResult({ date: today, attempt }); },
    );
    return () => { active = false; };
  }, [today, attempt]));

  const current = result?.date === today && result.attempt === attempt ? result : undefined;
  const fallback = previousPlateDate(today);
  const plateDate = current?.item?.externalId ?? (current?.item === null && connection === 'online' ? fallback : null);
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>On This Day</Text>
      {!current ? <ActivityIndicator accessibilityLabel="Finding an archived plate" color={colors.forest} />
        : current.item === undefined ? (
          <>
            <Text accessibilityRole="alert" style={styles.copy}>Could not check the local archive.</Text>
            <Button title="Try again" variant="outline" onPress={() => setAttempt(value => value + 1)} />
          </>
        ) : plateDate ? (
          <>
            {current.item && <Text style={styles.copy}>{current.item.title}</Text>}
            <Button title={'Open plate from ' + formatEditorialDate(plateDate)} icon="calendar" variant="outline"
              onPress={() => navigateToDetails(router, 'nasa-apod', plateDate)} />
          </>
        ) : (
          <Text style={styles.copy}>{connection === 'offline' ? 'No matching plate on this device. Reconnect to look up an earlier plate.'
            : connection === 'unknown' ? 'Checking the connection for an earlier plate.' : 'No earlier plate for this date.'}</Text>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[2], padding: spacing[3], backgroundColor: colors.surface, borderRadius: radii.md },
  title: { ...typography.h2, color: colors.forest },
  copy: { ...typography.body, color: colors.muted },
});
