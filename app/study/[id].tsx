import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { useAppSelector } from '../../src/store';
import {
  bookmarkStudy,
  saveStudyNote,
  checkpoint,
  readStudy,
  type StudyRow,
} from '../../src/features/study/repository';
import { FieldNote } from '../../src/features/journal/FieldNote';
import { studyEntries, glossary } from '../../src/features/study/edition';
import { studyStyles as s } from '../../src/features/study/layout';

export default function StudyReader() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  return <Reader key={id} id={id} section={section} />;
}
function Reader({ id, section }: { id: string; section?: string }) {
  const router = useRouter();
  const account = useAppSelector((state) => state.auth.user?.id);
  const offline = useAppSelector((state) => state.feed.connection === 'offline');
  const [entry, setEntry] = useState<StudyRow | null>(null);
  const [page, setPage] = useState(0);
  const [marked, setMarked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Opening guide…');
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    if (account)
      readStudy(id, account)
        .then(({ entry: row, marked: mark, note: savedNote }) => {
          if (!active) return;
          setNote(savedNote);
          setMarked(mark);
          setPage(Math.min(row?.body.split('\n\n').length ?? 1, Math.max(1, (Number(section) || 0) + 1)) - 1);
          setEntry(row);
          setMessage(row ? '' : 'This entry is unavailable.');
        })
        .catch(() => {
          if (active) setMessage('Could not read the local entry.');
        });
    return () => {
      active = false;
    };
  }, [account, id, section, attempt]);
  useEffect(() => {
    if (account && entry?.chapter && entry.id === id)
      void checkpoint(account, id, page).catch(() => setMessage('Reading position could not be saved.'));
  }, [account, entry, id, page]);
  const blocks = entry?.body.split('\n\n') ?? [];
  const [heading, ...paragraphs] = (blocks[page] ?? '').split('\n');
  const open = (next: string) => router.push({ pathname: '/study/[id]', params: { id: next } });
  async function toggle() {
    if (!account || busy) return;
    setBusy(true);
    try {
      await bookmarkStudy(account, id, !marked, page);
      setMarked(!marked);
      setNote(null);
    } catch {
      Alert.alert('Could not update bookmark');
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={s.page}>
      <Header title="Space Study" showBack />
      <ScrollView key={id + '-' + page} contentContainerStyle={s.content}>
        {!!message && <Text style={s.note}>{message}</Text>}
        {!entry && message.startsWith('Could') && (
          <Button title="Try again" onPress={() => retry(attempt + 1)} />
        )}
        {entry && (
          <>
            <Text style={s.note}>
              {offline ? 'Offline · ' : ''}
              {entry.chapter ? 'Chapter ' + entry.chapter : entry.category}
            </Text>
            <Text accessibilityRole="header" style={s.heading}>
              {entry.title}
            </Text>
            {entry.chapter ? (
              <>
                <Text style={s.kicker}>
                  Section {page + 1} of {blocks.length}
                </Text>
                <Text accessibilityRole="header" style={s.section}>
                  {heading}
                </Text>
                <Text style={s.body}>{paragraphs.join('\n')}</Text>
              </>
            ) : (
              <Text style={s.body}>{entry.body}</Text>
            )}
            {page > 0 && (
              <Button title="Previous section" variant="outline" onPress={() => setPage(page - 1)} />
            )}
            {page + 1 < blocks.length && <Button title="Next section" onPress={() => setPage(page + 1)} />}
            {entry.chapter != null &&
              page + 1 === blocks.length &&
              studyEntries.some((e) => e.chapter === entry.chapter! + 1) && (
                <Button
                  title="Next chapter"
                  icon="book-open" variant="destination"
                  onPress={() => open(studyEntries.find((e) => e.chapter === entry.chapter! + 1)!.id)}
                />
              )}
            <Button
              title={marked ? 'Remove study bookmark' : 'Save to Field Shelf'}
              icon={marked ? 'check' : 'bookmark'}
              variant="outline"
              loading={busy}
              onPress={() => void toggle()}
            />
            {Boolean(entry.sky) && (
              <Button
                title="Show in sky"
                variant="destination"
                icon="compass"
                onPress={() => router.push({ pathname: '/sky-viewer', params: { target: id } })}
              />
            )}
            {marked && account && (
              <FieldNote
                note={note}
                onSave={async (value) => {
                  await saveStudyNote(account, id, value);
                  setNote(value);
                }}
              />
            )}
            {entry.id === 'chapter:sun-earth-moon' && page === 0 && (
              <>
                <Image
                  source={require('../../assets/editorial/earthrise.jpg')}
                  accessible
                  accessibilityLabel="Earth rises beyond the grey lunar horizon in the Apollo 8 photograph."
                  style={{ width: '100%', height: 180 }}
                  resizeMode="contain"
                />
                <Text style={s.note}>Earthrise · NASA / Bill Anders · Apollo 8, AS08-14-2383</Text>
              </>
            )}
            {glossary[id] && (
              <Button
                title={terms ? 'Close glossary' : 'Chapter glossary'}
                variant="outline"
                onPress={() => setTerms(!terms)}
              />
            )}
            {terms &&
              glossary[id]?.map(([word, meaning]) => (
                <Text key={word} style={s.body}>
                  {word} · {meaning}
                </Text>
              ))}
            {entry.related !== '[]' && <Text style={s.section}>Related reading</Text>}
            {(JSON.parse(entry.related) as string[]).map((link) => (
              <Button
                key={link}
                title={studyEntries.find((e) => e.id === link)?.title ?? link}
                variant="destination"
                onPress={() => open(link)}
              />
            ))}
            <Text style={s.note}>{entry.source}</Text>
            <Button
              title="Original source"
              icon="external-link"
              variant="outline"
              disabled={offline}
              onPress={() =>
                void Linking.openURL(entry.url).catch(() => Alert.alert('Could not open source'))
              }
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
