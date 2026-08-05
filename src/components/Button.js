import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens';

const VARIANTS = {
  primary: { bg: colors.primary, text: colors.onPrimary },
  accent: { bg: colors.accent, text: colors.onAccent },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  outlineLight: { bg: 'transparent', text: colors.white, border: colors.white },
  ghost: { bg: 'transparent', text: colors.primary },
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1.5 : 0 },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
