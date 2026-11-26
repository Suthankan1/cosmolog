import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { Icon } from '../common/Icon';
import { useVoiceToText } from '../../hooks/useVoiceToText';

export interface SearchBarProps {
  value: string;
  placeholder?: string;
  accessibilityLabel?: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  enableVoice?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder = 'Search celestial observations...',
  accessibilityLabel = 'Search observation archive',
  onChangeText,
  onClear,
  enableVoice = true,
}) => {
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const { isListening, error, startListening, stopListening, clearError } = useVoiceToText({
    onTranscriptChange: (text) => {
      onChangeText(text);
      setVoiceNotice(null);
    },
    onError: (err) => {
      setVoiceNotice(err);
      setTimeout(() => setVoiceNotice(null), 3000);
    },
    continuous: false,
    addsPunctuation: false,
  });

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      clearError();
      setVoiceNotice(null);
      await startListening();
    }
  };

  const handleClear = () => {
    if (isListening) {
      stopListening();
    }
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isListening && styles.containerListening]}>
        <Icon
          name="search"
          size={18}
          color={isListening ? colors.forest : colors.muted}
          style={styles.searchIcon}
        />
        <TextInput
          maxLength={256}
          value={value}
          onChangeText={onChangeText}
          placeholder={isListening ? 'Listening... speak now' : placeholder}
          placeholderTextColor={isListening ? colors.forest : colors.muted}
          style={styles.textInput}
          accessibilityRole="search"
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {Boolean(value) && (
          <Pressable
            onPress={handleClear}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search input"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={16} color={colors.muted} />
          </Pressable>
        )}
        {enableVoice && (
          <Pressable
            onPress={handleVoiceToggle}
            style={[styles.actionButton, isListening && styles.micButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Stop voice search' : 'Search with voice'}
            accessibilityState={{ selected: isListening }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="search-voice-button"
          >
            <Icon
              name="mic"
              size={18}
              color={isListening ? colors.terracotta : colors.forest}
            />
          </Pressable>
        )}
      </View>
      {Boolean(voiceNotice || error) && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {voiceNotice || error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[4],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
  },
  containerListening: {
    borderColor: colors.forest,
    borderWidth: 1.5,
    backgroundColor: colors.sageLight,
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
  actionButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
});

export default SearchBar;
