import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import { useAppSelector } from '../../src/store';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { EvidenceDossier } from '../../src/features/study/evidence';
import { listEvidenceDossiers } from '../../src/features/study/evidenceRepository';

export default function EvidenceDossiersIndexScreen() {
  const router = useRouter();
  const { connection, metadata, legacySyncedAt } = useAppSelector((state) => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod']?.lastSyncedAt ?? legacySyncedAt;

  const [dossiers, setDossiers] = useState<EvidenceDossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEvidenceDossiers().then((items) => {
      setDossiers(items);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <Header title="Behind the Discovery" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masthead}>
          <Text style={styles.kicker}>SCIENCE BEHIND SPACE · F07</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Behind the Discovery
          </Text>
          <Text style={styles.summary}>
            Peer-reviewed empirical dossiers examining real spacecraft measurements, instrumentation methods, scientific inferences, and boundary conditions separating verified data from illustrative artist concepts.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading curated dossiers…</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {dossiers.map((dossier) => (
              <Pressable
                key={dossier.id}
                accessibilityRole="button"
                accessibilityLabel={`Open evidence dossier: ${dossier.headline} for ${dossier.targetName}`}
                accessibilityHint="Navigates to the four-block evidence dossier reader"
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push({ pathname: '/study/dossier/[id]', params: { id: dossier.id } } as never)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.targetBadge}>
                    <Icon name="target" size={12} color={colors.forest} />
                    <Text style={styles.targetText}>{dossier.targetName}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{dossier.category}</Text>
                  </View>
                </View>

                <Text accessibilityRole="header" style={styles.cardTitle}>
                  {dossier.headline}
                </Text>

                <Text numberOfLines={3} style={styles.cardExcerpt}>
                  {dossier.observation}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.footerInfo}>
                    <Text style={styles.revText}>REV {dossier.revision}</Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.reviewedText}>Verified {dossier.reviewedAt}</Text>
                  </View>
                  <View style={styles.actionPrompt}>
                    <Text style={styles.actionText}>Read dossier</Text>
                    <Icon name="chevron-right" size={16} color={colors.forest} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.standardsBox}>
          <View style={styles.standardsHeader}>
            <Icon name="shield" size={15} color={colors.forest} />
            <Text style={styles.standardsTitle}>Scientific Integrity Standard</Text>
          </View>
          <Text style={styles.standardsBody}>
            Every dossier is authored from authoritative primary research papers (NASA, ESA, STScI, Keck) and verified to explicitly distinguish measurements from artist concepts. No fabricated claims or automated generative summaries.
          </Text>
        </View>
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
  masthead: {
    marginBottom: spacing[6],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
    marginBottom: spacing[1],
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: spacing[1],
  },
  summary: {
    ...typography.body,
    color: colors.muted,
  },
  loadingContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  listContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  cardPressed: {
    backgroundColor: colors.sageLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  targetText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.forest,
    fontSize: 11,
  },
  categoryBadge: {
    backgroundColor: '#F6EEDB',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  categoryText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  cardTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.forest,
    marginBottom: spacing[2],
  },
  cardExcerpt: {
    ...typography.body,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  revText: {
    ...typography.label,
    fontSize: 10,
    color: colors.terracotta,
  },
  dot: {
    color: colors.muted,
  },
  reviewedText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.muted,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  standardsBox: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing[4],
  },
  standardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  standardsTitle: {
    ...typography.label,
    color: colors.forest,
  },
  standardsBody: {
    ...typography.bodySmall,
    color: colors.muted,
    lineHeight: 18,
  },
});
