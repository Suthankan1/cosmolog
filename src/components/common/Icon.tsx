import React from 'react';
import { ColorValue, StyleProp, TextStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../../theme/tokens';

export type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export interface IconProps {
  name: FeatherIconName;
  size?: number;
  color?: ColorValue | string | null;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = colors.ink,
  style,
  accessibilityLabel,
}) => {
  return (
    <Feather
      name={name}
      size={size}
      color={(color as string) || colors.ink}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? "yes" : "no-hide-descendants"}
    />
  );
};

export default Icon;
