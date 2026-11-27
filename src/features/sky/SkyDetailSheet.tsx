import { useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { findSkyObject, type SkyObjectId } from './catalog';
import type { SkyPosition } from './skyMath';

interface Props {
  id: SkyObjectId;
  position: SkyPosition;
  offline: boolean;
  onStudy?: () => void;
  onInstrument?: () => void;
  onClose: () => void;
}

export function SkyDetailSheet({ id, position, offline, onStudy, onInstrument, onClose }: Props) {
  const [linkError, setLinkError] = useState(false);
  const heading = useRef<ComponentRef<typeof Text>>(null);
  const insets = useSafeAreaInsets();
  const object = findSkyObject(id);
  if (!object) return null;

  const openLink = async (url: string) => {
    setLinkError(false);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(true);
    }
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} onShow={() => {
      if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
    }}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.category}>{object.category}</Text>
            <Text ref={heading} accessible accessibilityRole="header" style={styles.title}>{object.name}</Text>
            <Text style={styles.summary}>{object.summary}</Text>
            <View style={styles.position}>
              <Text style={styles.category}>{position.prediction ? 'Predicted direction' : 'Direction'}</Text>
              <Text style={styles.summary}>
                Bearing {Math.round(position.azimuth) % 360}° · Elevation {Math.round(position.altitude)}°
              </Text>
            </View>
            {position.prediction && (
              <Text style={styles.credit}>
                Orbital epoch {new Date(position.prediction.epochAt).toISOString().slice(0, 16).replace('T', ' ')} UTC.
                {position.prediction.older ? ' Older orbit data can reduce accuracy.' : ''}
                {' '}Visibility also depends on sunlight and observing conditions.
              </Text>
            )}
            <Text style={styles.credit}>{object.source}</Text>
            {offline && <Text style={styles.credit}>Connect to open the links.</Text>}
            {linkError && <Text accessibilityRole="alert" style={styles.credit}>Could not open the link.</Text>}
            <>{onStudy && <Button title="Read in Space Study" icon="book-open" onPress={onStudy}/>}</>
            <>{onInstrument && <Button title="Sight in Field Instrument" icon="compass" variant="outline" onPress={onInstrument}/>}</>
            <Button title="Read more" icon="external-link" disabled={offline} onPress={() => { void openLink(object.readMoreUrl); }} />
            {object.sourceUrl !== object.readMoreUrl && (
              <Button title="View catalog source" variant="outline" disabled={offline} onPress={() => { void openLink(object.sourceUrl); }} />
            )}
          </ScrollView>
          <Button title="Close" variant="outline" style={styles.close} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16, 47, 38, 0.50)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: colors.surface, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl },
  content: { padding: spacing[6], gap: spacing[3] },
  title: { ...typography.display, color: colors.ink, borderTopWidth: 3, borderColor: colors.terracotta, paddingTop: spacing[3] },
  category: { ...typography.label, color: colors.forest },
  summary: { ...typography.body, color: colors.ink },
  credit: { ...typography.bodySmall, color: colors.muted },
  position: { backgroundColor: colors.sageLight, borderRadius: radii.md, padding: spacing[3], gap: spacing[1] },
  close: { marginHorizontal: spacing[6] },
});
