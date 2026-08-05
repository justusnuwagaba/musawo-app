import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens';

const MULTILINE_MIN_HEIGHT = 100;

export default function Input({ label, error, style, multiline, ...textInputProps }) {
  // minHeight alone doesn't reliably grow a multiline TextInput on its own —
  // it needs to measure its own content and resize explicitly, otherwise it
  // renders as a fixed-height box that scrolls its content internally
  // instead of growing, which is what made earlier lines look like they were
  // being pushed out of view as you typed.
  const [contentHeight, setContentHeight] = useState(0);

  return (
    <View style={[styles.wrapper, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={[
          styles.input,
          multiline && [styles.inputMultiline, { height: Math.max(MULTILINE_MIN_HEIGHT, contentHeight + spacing.lg) }],
          !!error && styles.inputError,
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onContentSizeChange={multiline ? (e) => setContentHeight(e.nativeEvent.contentSize.height) : undefined}
        {...textInputProps}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.ink,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  // Actual sizing is handled by the explicit height computed from
  // onContentSizeChange above — this is just the visual floor before any
  // text is typed.
  inputMultiline: {
    minHeight: MULTILINE_MIN_HEIGHT,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
