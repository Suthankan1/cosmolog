import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { Button } from '../src/components/common/Button';
import { EmptyState } from '../src/components/common/EmptyState';
import { Header } from '../src/components/common/Header';
import { Icon } from '../src/components/common/Icon';
import { Input } from '../src/components/common/Input';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import { DispatchRow } from '../src/components/discovery/DispatchRow';
import {
  COLLECTION_NAME_LIMIT, getCollections, removeCollection, saveCollectionName, setCollectionItems, type ShelfCollection,
} from '../src/database/repositories/collectionsRepository';
import { useToggleFavourite } from '../src/features/journal/useToggleFavourite';
import { navigateToDetails } from '../src/navigation/types';
import { useAppSelector } from '../src/store';
import { colors, layout, radii, spacing, typography } from '../src/theme/tokens';

type Editor = { kind: 'name'; id: number | null; name: string } | { kind: 'items'; id: number; itemIds: string[] };

export default function CollectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const toggleFavourite = useToggleFavourite();
  const accountId = useAppSelector(state => state.auth.user?.id);
  const { favourites, pending } = useAppSelector(state => state.favourites);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const [result, setResult] = useState<{ accountId: number; rows: ShelfCollection[] | null }>();
  const [selected, setSelected] = useState<number>();
  const [editor, setEditor] = useState<Editor>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const reload = useCallback(async (owner: number, isActive: () => boolean = () => true) => {
    try {
      const rows = await getCollections(owner);
      if (isActive()) setResult({ accountId: owner, rows });
    } catch {
      if (isActive()) setResult({ accountId: owner, rows: null });
    }
  }, []);
  useFocusEffect(useCallback(() => {
    if (!accountId) return;
    let active = true;
    void reload(accountId, () => active);
    return () => { active = false; };
  }, [accountId, reload]));

  const collections = result?.accountId === accountId ? result?.rows : undefined;
  const current = collections?.find(collection => collection.id === selected);
  const currentItems = current ? favourites.filter(item => current.itemIds.includes(item.localId)) : [];
  const offline = connection === 'offline';
  const syncedAt = Object.values(metadata).flatMap(source => source.lastSyncedAt ?? []).sort().at(-1) ?? legacySyncedAt;
  const openEditor = (value: Editor) => { setError(undefined); setEditor(value); };
  const closeEditor = () => { if (!saving) { setError(undefined); setEditor(undefined); } };

  const save = async () => {
    if (!accountId || saving || !editor) return;
    if (editor.kind === 'name') {
      const name = editor.name.trim();
      if (!name) { setError('Enter a collection name.'); return; }
      if (collections?.some(row => row.id !== editor.id && row.name.toLowerCase() === name.toLowerCase())) {
        setError('A collection already uses this name.');
        return;
      }
    }
    setSaving(true);
    setError(undefined);
    try {
      if (editor.kind === 'name') await saveCollectionName(accountId, editor.id, editor.name);
      else await setCollectionItems(accountId, editor.id, editor.itemIds);
      await reload(accountId);
      setEditor(undefined);
    } catch {
      setError('Could not save the collection. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!accountId || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await removeCollection(accountId, id);
      setSelected(undefined);
      await reload(accountId);
    } catch {
      setError('Could not remove the collection. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (id: string) => {
    setEditor(value => value?.kind !== 'items' ? value : {
      ...value,
      itemIds: value.itemIds.includes(id) ? value.itemIds.filter(itemId => itemId !== id) : [...value.itemIds, id],
    });
  };

  return (
    <View style={styles.screen}>
      <Header title="Collections" showBack onBack={current ? () => { setSelected(undefined); setError(undefined); } : undefined} />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}
      {current ? (
        <FlatList key={current.id} data={currentItems} keyExtractor={item => item.localId} contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.group}>
              <Text accessibilityRole="header" style={styles.title}>{current.name}</Text>
              <Button title="Choose discoveries" icon="check-square" onPress={() => openEditor({ kind: 'items', id: current.id, itemIds: current.itemIds })} disabled={saving} />
              <Button title="Rename collection" icon="edit-2" variant="outline" disabled={saving}
                onPress={() => openEditor({ kind: 'name', id: current.id, name: current.name })} />
              <Button title="Delete collection" icon="trash-2" variant="danger" disabled={saving}
                onPress={() => Alert.alert('Delete this collection?', 'Your saved discoveries and notes stay on the Field Shelf.', [
                  { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void remove(current.id); } },
                ])} />
              {!editor && error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            </View>
          }
          ListEmptyComponent={<EmptyState icon="folder" title="This collection is empty" description="Choose discoveries from your Field Shelf to add them." />}
          renderItem={({ item }) => (
            <DispatchRow item={item} isSaved pending={Boolean(pending[item.localId])} offline={offline} notePreview={item.note}
              onPress={() => navigateToDetails(router, item.source, item.externalId)} onToggleSave={() => toggleFavourite(item.localId)} />
          )} />
      ) : (
        <FlatList key="collections" data={collections ?? []} keyExtractor={item => String(item.id)} contentContainerStyle={styles.content}
          ListHeaderComponent={collections ? <Button title="New collection" icon="plus"
            onPress={() => openEditor({ kind: 'name', id: null, name: '' })} /> : undefined}
          ListEmptyComponent={collections === undefined ? <ActivityIndicator color={colors.forest} accessibilityLabel="Loading collections" />
            : collections === null ? <EmptyState icon="alert-circle" title="Could not open collections" description="Try reading the local archive again."
              actionTitle="Try again" onAction={() => { if (accountId) void reload(accountId); }} />
              : <EmptyState icon="folder" title="No collections yet" description="Group saved discoveries by a topic you want to revisit." />}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => setSelected(item.id)} style={styles.row}>
              <Icon name="folder" size={20} color={colors.forest} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.secondary}>{favourites.filter(entry => item.itemIds.includes(entry.localId)).length} saved</Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.forest} />
            </Pressable>
          )} />
      )}
      <Modal visible={Boolean(editor)} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={closeEditor}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, styles.group, { paddingTop: insets.top + spacing[5] }]}>
            <Text accessibilityRole="header" style={styles.title}>
              {editor?.kind === 'items' ? 'Choose discoveries' : editor?.id ? 'Rename collection' : 'New collection'}
            </Text>
            {editor?.kind === 'name' && <Input label="Collection name" value={editor.name} maxLength={COLLECTION_NAME_LIMIT} editable={!saving}
              onChangeText={name => { setEditor({ ...editor, name }); setError(undefined); }} onSubmitEditing={() => { void save(); }} />}
            {editor?.kind === 'items' && (favourites.length ? favourites.map(item => {
              const checked = editor.itemIds.includes(item.localId);
              return (
                <Pressable key={item.localId} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: saving }}
                  disabled={saving} style={[styles.row, checked && styles.checked]} onPress={() => toggleItem(item.localId)}>
                  <Icon name={checked ? 'check-square' : 'square'} size={20} color={colors.forest} />
                  <Text style={styles.rowCopy}>{item.title}</Text>
                </Pressable>
              );
            }) : <Text style={styles.secondary}>Save a discovery to the Field Shelf before adding it to a collection.</Text>)}
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Button title="Save collection" loading={saving} onPress={() => { void save(); }} />
            <Button title="Cancel" variant="outline" disabled={saving} onPress={closeEditor} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.ivory, flex: 1 },
  content: { paddingHorizontal: layout.horizontalInset, paddingVertical: spacing[4] },
  group: { gap: spacing[3] },
  title: { ...typography.h1, color: colors.forest },
  secondary: { ...typography.bodySmall, color: colors.muted },
  error: { ...typography.bodySmall, color: colors.danger },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: layout.minimumTouchTarget,
    padding: spacing[3], borderBottomWidth: 1, borderColor: colors.border,
  },
  rowCopy: { ...typography.body, flex: 1, color: colors.ink },
  rowTitle: { ...typography.h2, color: colors.forest },
  checked: { backgroundColor: colors.sageLight, borderRadius: radii.md },
});
