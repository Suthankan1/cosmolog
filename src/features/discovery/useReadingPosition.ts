import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type ScrollViewInstance, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { clearReadingCheckpoint, getReadingCheckpoint, saveReadingCheckpoint } from '../../database/repositories/readingRepository';
import type { DiscoveryItem } from '../../database/models';
import { readingFingerprint, splitReadingParagraphs } from './readingPosition';

export function useReadingPosition(accountId: number | undefined, item: DiscoveryItem | undefined) {
  const scroll = useRef<ScrollViewInstance>(null);
  const localId = item?.localId;
  const body = item?.body ?? '';
  const paragraphs = useMemo(() => splitReadingParagraphs(body), [body]);
  const fingerprint = useMemo(() => readingFingerprint(body), [body]);
  const offsets = useRef(new Map<number, number>());
  const articleTop = useRef<number | null>(null);
  const bodyTop = useRef<number | null>(null);
  const pending = useRef<number | null>(null);
  const saved = useRef<number | null>(null);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const restoreIndex = useRef<number | null>(null);
  const userScrolled = useRef(false);
  const completed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const index = pending.current;
    if (!accountId || !localId || index === null || index === saved.current || completed.current) return;
    pending.current = null;
    saved.current = index;
    void saveReadingCheckpoint(accountId, localId, index, fingerprint).catch(() => {
      if (saved.current === index) saved.current = null;
    });
  }, [accountId, fingerprint, localId]);

  const restore = useCallback(() => {
    const index = restoreIndex.current;
    if (index === null || articleTop.current === null || bodyTop.current === null || !scroll.current || userScrolled.current) return;
    const offset = offsets.current.get(index);
    if (offset === undefined || !contentHeight.current || !viewportHeight.current) return;
    const target = articleTop.current + bodyTop.current + offset;
    restoreIndex.current = null;
    scroll.current.scrollTo({ y: Math.min(target, Math.max(0, contentHeight.current - viewportHeight.current)), animated: false });
  }, []);

  useEffect(() => {
    if (!accountId || !localId) return;
    let active = true;
    completed.current = false;
    userScrolled.current = false;
    saved.current = null;
    restoreIndex.current = null;
    void getReadingCheckpoint(accountId).then(checkpoint => {
      if (!active || completed.current || userScrolled.current || checkpoint?.item.localId !== localId) return;
      if (checkpoint.fingerprint === fingerprint && checkpoint.paragraph < paragraphs.length) {
        restoreIndex.current = checkpoint.paragraph;
        saved.current = checkpoint.paragraph;
        restore();
      }
    }).catch(() => {});
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') flush();
    });
    return () => {
      active = false;
      appState.remove();
      flush();
    };
  }, [accountId, fingerprint, flush, localId, paragraphs.length, restore]);

  useFocusEffect(useCallback(() => flush, [flush]));

  const beginScroll = () => {
    userScrolled.current = true;
    restoreIndex.current = null;
  };

  const trackScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userScrolled.current || completed.current || articleTop.current === null || bodyTop.current === null) return;
    const top = event.nativeEvent.contentOffset.y + viewportHeight.current * 0.55 - articleTop.current - bodyTop.current;
    if (top < 0) return;
    let paragraph = 0;
    for (const [index, offset] of offsets.current) {
      if (offset <= top && index > paragraph) paragraph = index;
    }
    pending.current = paragraph;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 400);
  };

  const markRead = async () => {
    if (!accountId || !localId) return;
    completed.current = true;
    clearTimeout(timer.current);
    pending.current = null;
    try {
      await clearReadingCheckpoint(accountId, localId);
      setStatus('Marked as read');
    } catch {
      completed.current = false;
      setStatus('Could not mark as read. Try again.');
    }
  };

  return {
    scroll, paragraphs, beginScroll, trackScroll, markRead, status, completeScroll: flush,
    measureViewport: (event: LayoutChangeEvent) => { viewportHeight.current = event.nativeEvent.layout.height; restore(); },
    measureContent: (_width: number, height: number) => { contentHeight.current = height; restore(); },
    measureArticle: (event: LayoutChangeEvent) => { articleTop.current = event.nativeEvent.layout.y; restore(); },
    measureBody: (event: LayoutChangeEvent) => { bodyTop.current = event.nativeEvent.layout.y; restore(); },
    measureParagraph: (index: number, event: LayoutChangeEvent) => {
      offsets.current.set(index, event.nativeEvent.layout.y);
      restore();
    },
  };
}
