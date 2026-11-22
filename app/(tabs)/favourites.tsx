import React, { useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  loadFavouritesThunk,
  toggleFavouriteThunk,
} from '../../src/store/slices/favouritesSlice';
import { navigateToDetails } from '../../src/navigation/types';
import { colors, layout, spacing, typography } from '../../src/theme/tokens';
import { DispatchRow } from '../../src/components/discovery/DispatchRow';
import { EmptyState } from '../../src/components/common/EmptyState';
import { FavouriteDiscoveryItem } from '../../src/database/repositories/favouritesRepository';

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const { favourites, favouriteMap, isLoading } = useAppSelector((state) => state.favourites);

  useEffect(() => {
    dispatch(loadFavouritesThunk());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(loadFavouritesThunk());
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>The Field Shelf</Text>
        <Text style={styles.subtitle}>
          {favourites.length === 1
            ? '1 preserved celestial discovery'
            : `${favourites.length} preserved celestial discoveries`}
        </Text>
      </View>

      {favourites.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="The Shelf is Empty"
          description="Save celestial plates and spaceflight dispatches during your field sessions for guaranteed offline reading."
          actionTitle="Explore Discoveries"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={(item) => item.localId}
          renderItem={({ item }: { item: FavouriteDiscoveryItem }) => (
            <DispatchRow
              item={item}
              isSaved={Boolean(favouriteMap[item.localId])}
              onPress={() => navigateToDetails(router, item.source, item.externalId)}
              onToggleSave={() => dispatch(toggleFavouriteThunk(item))}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.forest}
              colors={[colors.forest, colors.brass]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  header: {
    paddingHorizontal: layout.horizontalInset,
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: layout.horizontalInset,
    paddingBottom: spacing[8],
  },
});
