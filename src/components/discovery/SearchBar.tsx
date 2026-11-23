import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { Icon } from '../common/Icon';

export interface SearchBarProps {
  value: string;
  placeholder?: string;
  accessibilityLabel?: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder = 'Search celestial observations...',
  accessibilityLabel = 'Search observation archive',
  onChangeText,
  onClear,
}) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={colors.muted} style={styles.searchIcon} />
      <TextInput
        maxLength={256}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.textInput}
        accessibilityRole="search"
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {Boolean(value) && (
        <Pressable
          onPress={onClear || (() => onChangeText(''))}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search input"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="x" size={16} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[4],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.ink,
  },
  clearButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;
