import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/tokens';

export function Earthrise({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.frame, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image
        source={require('../../../assets/editorial/earthrise.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ top: '67%', left: '50%' }}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.forestDark },
});
