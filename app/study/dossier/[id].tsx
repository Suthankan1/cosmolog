import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../../src/components/common/Header';
import { Button } from '../../../src/components/common/Button';
import { Icon } from '../../../src/components/common/Icon';
import { OfflineBanner } from '../../../src/components/common/OfflineBanner';
import { useAppSelector } from '../../../src/store';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';
import { EvidenceDossier } from '../../../src/features/study/evidence';
import { getEvidenceDossierById } from '../../../src/features/study/evidenceRepository';

export default function EvidenceDossierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector((state) => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod']?.lastSyncedAt ?? legacySyncedAt;

  const [dossier, setDossier] = useState<EvidenceDossier | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getEvidenceDossierById(id)
      .then((result) => {
        if (mounted) {
          setDossier(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setDossier(null);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleOpenSource = async (url: string) => {
    if (offline) {
      Alert.alert('Offline Mode', 'External source links require an active internet connection.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Could not open source', 'The external link could not be opened on this device.');
      }
    } catch {
      Alert.alert('Could not open source', 'Failed to navigate to external citation.');
    }
  };

  const handleOpenRelated = (relatedId: string) => {
    if (relatedId.startsWith('chapter:') || relatedId.startsWith('exo:') || relatedId.startsWith('black-hole:')) {
      router.push({ pathname: '/study/[id]', params: { id: relatedId } } as never);
    } else if (relatedId.startsWith('moon:') || relatedId.startsWith('body:')) {
      router.push({ pathname: '/study/[id]', params: { id: relatedId } } as never);
    } else {
      router.push({ pathname: '/study/[id]', params: { id: relatedId } } as never);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Behind the Discovery" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading evidence dossier…</Text>
          </View>
        ) : !dossier ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={32} color={colors.terracotta} />
            <Text accessibilityRole="header" style={styles.errorTitle}>
              Dossier Unavailable
            </Text>
            <Text style={styles.errorBody}>
              The requested evidence dossier could not be found in the local archive.
            </Text>
            <Button
              title="Browse all dossiers"
              icon="arrow-left"
              variant="outline"
              onPress={() => router.push('/study/dossiers' as never)}
            />
          </View>
        ) : (
          <>
            {/* Masthead */}
            <View style={styles.masthead}>
              <View style={styles.kickerRow}>
                <Text style={styles.kicker}>EVIDENCE DOSSIER · F07</Text>
                <View style={styles.revBadge}>
                  <Text style={styles.revText}>REV {dossier.revision}</Text>
                </View>
              </View>

              <Text accessibilityRole="header" style={styles.title}>
                {dossier.headline}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.targetBadge}>
                  <Icon name="target" size={13} color={colors.forest} />
                  <Text style={styles.targetText}>{dossier.targetName}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{dossier.category}</Text>
                </View>
              </View>

              <Text style={styles.reviewDate}>
                Peer reviewed & verified: {dossier.reviewedAt}
              </Text>
            </View>

            {/* Ruled Block 1: Observation */}
            <View style={styles.blockCard} testID="dossier-block-observation">
              <View style={styles.blockHeader}>
                <View style={[styles.blockIconWrapper, { backgroundColor: '#EBF2EE' }]}>
                  <Icon name="eye" size={16} color={colors.forest} />
                </View>
                <View style={styles.blockHeaderText}>
                  <Text style={styles.blockLabel}>BLOCK 1</Text>
                  <Text accessibilityRole="header" style={styles.blockTitle}>
                    Empirical Observation
                  </Text>
                </View>
              </View>
              <Text style={styles.blockSubtitle}>
                Measured physical signal and raw detection
              </Text>
              <Text style={styles.blockBody}>{dossier.observation}</Text>
            </View>

            {/* Ruled Block 2: Method */}
            <View style={styles.blockCard} testID="dossier-block-method">
              <View style={styles.blockHeader}>
                <View style={[styles.blockIconWrapper, { backgroundColor: '#F6EEDB' }]}>
                  <Icon name="tool" size={16} color={colors.brass} />
                </View>
                <View style={styles.blockHeaderText}>
                  <Text style={styles.blockLabel}>BLOCK 2</Text>
                  <Text accessibilityRole="header" style={styles.blockTitle}>
                    Method & Instrumentation
                  </Text>
                </View>
              </View>
              <Text style={styles.blockSubtitle}>
                Observational facility, wavelength regime & detector mode
              </Text>
              <Text style={styles.blockBody}>{dossier.method}</Text>
            </View>

            {/* Ruled Block 3: Inference */}
            <View style={styles.blockCard} testID="dossier-block-inference">
              <View style={styles.blockHeader}>
                <View style={[styles.blockIconWrapper, { backgroundColor: '#EBF2EE' }]}>
                  <Icon name="layers" size={16} color={colors.forest} />
                </View>
                <View style={styles.blockHeaderText}>
                  <Text style={styles.blockLabel}>BLOCK 3</Text>
                  <Text accessibilityRole="header" style={styles.blockTitle}>
                    Scientific Inference
                  </Text>
                </View>
              </View>
              <Text style={styles.blockSubtitle}>
                Conclusions supported by physical evidence
              </Text>
              <Text style={styles.blockBody}>{dossier.inference}</Text>
            </View>

            {/* Ruled Block 4: Uncertainty & Caveats */}
            <View style={[styles.blockCard, styles.uncertaintyCard]} testID="dossier-block-uncertainty">
              <View style={styles.blockHeader}>
                <View style={[styles.blockIconWrapper, { backgroundColor: '#FCECE8' }]}>
                  <Icon name="alert-triangle" size={16} color={colors.terracotta} />
                </View>
                <View style={styles.blockHeaderText}>
                  <Text style={[styles.blockLabel, { color: colors.terracotta }]}>BLOCK 4 · CRITICAL BOUNDARY</Text>
                  <Text accessibilityRole="header" style={[styles.blockTitle, { color: colors.terracotta }]}>
                    What Evidence Does NOT Establish
                  </Text>
                </View>
              </View>
              <Text style={styles.blockSubtitle}>
                Boundary conditions, model degeneracies & limitations
              </Text>
              <Text style={styles.blockBody}>{dossier.uncertainty}</Text>
            </View>

            {/* Scientific Asset Card (if available) */}
            {dossier.asset && (
              <View style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <Text style={styles.assetLabel}>{dossier.asset.label}</Text>
                  <View
                    style={[
                      styles.conceptBadge,
                      {
                        backgroundColor: dossier.asset.isArtistConcept ? '#FCECE8' : '#EBF2EE',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.conceptBadgeText,
                        {
                          color: dossier.asset.isArtistConcept ? colors.terracotta : colors.forest,
                        },
                      ]}
                    >
                      {dossier.asset.isArtistConcept ? 'ARTIST CONCEPT' : 'EMPIRICAL DATA'}
                    </Text>
                  </View>
                </View>
                {Boolean(dossier.asset.caption) && (
                  <Text style={styles.assetCaption}>{dossier.asset.caption}</Text>
                )}
                <Text style={styles.assetCredit}>Credit: {dossier.asset.credit}</Text>
              </View>
            )}

            {/* Primary Source Citations */}
            <View style={styles.sectionDivider} />
            <Text accessibilityRole="header" style={styles.sectionHeading}>
              Authoritative Primary References
            </Text>
            <Text style={styles.sectionIntro}>
              Independent scientific sources backing this evidence dossier. Tap to open original publication:
            </Text>

            {dossier.sourceRefs.map((ref) => (
              <View key={ref.id} style={styles.sourceCard}>
                <View style={styles.sourceMeta}>
                  <Text style={styles.sourcePublisher}>{ref.publisher}</Text>
                  <Text style={styles.sourceTitle}>{ref.title}</Text>
                  {Boolean(ref.credit) && (
                    <Text style={styles.sourceCredit}>Credit: {ref.credit}</Text>
                  )}
                  {Boolean(ref.notes) && <Text style={styles.sourceNotes}>{ref.notes}</Text>}
                </View>
                <Button
                  title={offline ? 'Source link (offline)' : 'Open primary reference'}
                  icon="external-link"
                  variant="outline"
                  disabled={offline}
                  onPress={() => void handleOpenSource(ref.url)}
                />
              </View>
            ))}

            {/* Related Curriculum & Targets */}
            {dossier.relatedIds.length > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text accessibilityRole="header" style={styles.sectionHeading}>
                  Related Space Study Material
                </Text>
                <View style={styles.relatedRow}>
                  {dossier.relatedIds.map((relId) => (
                    <Button
                      key={relId}
                      title={`Open ${relId.replace('chapter:', 'Chapter: ')}`}
                      icon="book-open"
                      variant="destination"
                      onPress={() => handleOpenRelated(relId)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Return to Dossiers */}
            <View style={{ marginTop: spacing[6] }}>
              <Button
                title="All Evidence Dossiers"
                icon="layers"
                variant="outline"
                onPress={() => router.push('/study/dossiers' as never)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  errorContainer: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.h2,
    color: colors.terracotta,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  masthead: {
    marginBottom: spacing[5],
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
  },
  revBadge: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  revText: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  targetText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.forest,
  },
  categoryBadge: {
    backgroundColor: '#F6EEDB',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  categoryText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  reviewDate: {
    ...typography.bodySmall,
    color: colors.muted,
    fontStyle: 'italic',
  },
  blockCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  uncertaintyCard: {
    backgroundColor: '#FFFBF9',
    borderColor: '#E8D4CE',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  blockIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockHeaderText: {
    flex: 1,
  },
  blockLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.brass,
    letterSpacing: 0.8,
  },
  blockTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.forest,
  },
  blockSubtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: spacing[3],
  },
  blockBody: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  assetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  assetLabel: {
    ...typography.label,
    color: colors.forest,
    flex: 1,
  },
  conceptBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  conceptBadgeText: {
    ...typography.label,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  assetCaption: {
    ...typography.bodySmall,
    color: colors.ink,
    marginBottom: 4,
  },
  assetCredit: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
  sectionHeading: {
    ...typography.h2,
    color: colors.forest,
    marginBottom: spacing[1],
  },
  sectionIntro: {
    ...typography.bodySmall,
    color: colors.muted,
    marginBottom: spacing[3],
  },
  sourceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  sourceMeta: {
    gap: 2,
  },
  sourcePublisher: {
    ...typography.label,
    fontSize: 11,
    color: colors.terracotta,
  },
  sourceTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.forest,
  },
  sourceCredit: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.muted,
  },
  sourceNotes: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.ink,
    fontStyle: 'italic',
  },
  relatedRow: {
    gap: spacing[2],
  },
});
