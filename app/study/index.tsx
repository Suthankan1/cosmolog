import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { useAppSelector } from '../../src/store';
import { edition, studyEntries, sectionNumber } from '../../src/features/study/edition';
import { listStudy, resumeStudy, type Listing } from '../../src/features/study/repository';
import { studyStyles as s } from '../../src/features/study/layout';

export default function StudyLibrary() {
  const router = useRouter();
  const saved = useLocalSearchParams<{ saved?: string }>().saved === '1';
  const account = useAppSelector((state) => state.auth.user?.id);
  const offline = useAppSelector((state) => state.feed.connection === 'offline');
  const [query, setQuery] = useState('');
  const [atlas, setAtlas] = useState(false);
  const [limit, setLimit] = useState(30);
  const [rows, setRows] = useState<Listing[]>([]);
  const [resume, setResume] = useState<Awaited<ReturnType<typeof resumeStudy>>>(null);
  const [status, setStatus] = useState('Loading field guide…');
  const [attempt, retry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (!account) return;
      let active = true;
      setStatus(attempt ? 'Opening local guide…' : 'Loading field guide…');
      setRows([]);
      Promise.all([listStudy(query, saved, account, limit + 1, atlas), resumeStudy(account)])
        .then(([items, last]) => {
          if (active) {
            setRows(items);
            setResume(last);
            setStatus('');
          }
        })
        .catch(() => {
          if (active) setStatus('Could not open the local guide.');
        });
      return () => {
        active = false;
      };
    }, [query, saved, account, limit, atlas, attempt]),
  );
  function open(id: string, section = 0) {
    router.push({ pathname: '/study/[id]', params: { id, section: String(section) } });
  }
  return (
    <View style={s.page}>
      <Header title={saved ? 'Saved study entries' : 'Space Study'} showBack />
      <FlatList
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        data={rows.slice(0, limit)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Text style={s.note}>
              {offline ? 'Offline · ' : ''}
              {edition}
            </Text>
            <Text accessibilityRole="header" style={s.heading}>
              {saved ? 'Study bookmarks' : 'The field guide'}
            </Text>
            {!saved && (
              <>
                <Text style={s.note}>
                  8 chapters · {studyEntries.filter((e) => !e.chapter).length} bundled object profiles
                </Text>
                {resume && (
                  <Button
                    title={'Continue reading · ' + resume.title}
                    icon="book-open"
                    onPress={() => open(resume.entry_id, resume.section)}
                  />
                )}
                <Button
                  title="Editions and downloads"
                  variant="destination"
                  icon="download"
                  onPress={() => router.push('/study/downloads')}
                />
                <Button
                  title="My sky"
                  variant="destination"
                  icon="compass"
                  onPress={() => router.push('/sky-viewer')}
                />
                <Button
                  title={atlas ? 'Browse chapters' : 'Browse object atlas'}
                  variant="outline"
                  icon="list"
                  onPress={() => {
                    setAtlas(!atlas);
                    setLimit(30);
                  }}
                />
              </>
            )}
            <Input
              label={saved ? 'Search study bookmarks' : 'Search chapters, objects or catalog IDs'}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setLimit(30);
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={s.row}
            onPress={() => open(item.id, saved ? sectionNumber(item.id, item.anchor) : 0)}
          >
            <Text style={s.body}>{item.title}</Text>
            <Text style={s.note}>{item.category}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={s.note}>
            {status || (saved ? 'No matching study bookmarks.' : 'No matching entries in this edition.')}
          </Text>
        }
        ListFooterComponent={
          status.startsWith('Could') ? (
            <Button title="Try again" onPress={() => retry(attempt + 1)} />
          ) : rows.length > limit ? (
            <Button title="More results" onPress={() => setLimit(limit + 30)} />
          ) : undefined
        }
      />
    </View>
  );
}
