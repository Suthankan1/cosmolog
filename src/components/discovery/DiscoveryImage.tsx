import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useAppDispatch } from '../../store';
import { reportImageFailure } from '../../store/slices/favouritesSlice';
import { useReducedMotion } from 'react-native-reanimated';
import type { DiscoveryItem } from '../../database/models';
import { httpsUrl } from '../../services/api/mediaPolicy';
import { colors } from '../../theme/tokens';
import { Icon } from '../common/Icon';

interface DiscoveryImageProps {
  item: DiscoveryItem;
  offline?: boolean;
  style?: StyleProp<ViewStyle>;
  labelled?: boolean;
}

export function DiscoveryImage({ item, offline, style, labelled }: DiscoveryImageProps) {
  const dispatch = useAppDispatch();
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = useState<string | null>(null);
  const uri = item.imageLocalUri ?? (!offline ? httpsUrl(item.imageRemoteUrl) : null);

  return (
    <View style={[styles.frame, style]}>
      {uri && uri !== failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={reducedMotion ? 0 : 150}
          recyclingKey={item.localId}
          onError={() => {
            setFailed(uri);
            if (uri === item.imageLocalUri) void dispatch(reportImageFailure(item.localId, uri));
          }}
          accessible={Boolean(labelled)}
          accessibilityLabel={labelled ? 'Image for ' + item.title : undefined}
        />
      ) : uri && uri === failed && !offline && labelled ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Retry image" style={styles.retry}
          onPress={() => setFailed(null)}>
          <Icon name="refresh-cw" size={20} color={colors.forest} />
        </Pressable>
      ) : (
        <Icon name={item.mediaType === 'video' ? 'play-circle' : 'image'} size={25} color={colors.forest} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  retry: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  frame: { backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
