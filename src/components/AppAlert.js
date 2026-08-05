// Themed drop-in replacement for React Native's Alert.alert, so alerts match
// the app's design system instead of looking like a bare OS dialog.
// Mount <AppAlertHost/> once near the root (see App.js); call showAlert(...)
// from anywhere, same signature as Alert.alert.

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../theme/tokens';

let trigger = null;

export function showAlert(title, message, buttons) {
  if (!trigger) {
    console.warn('[AppAlert] showAlert called before <AppAlertHost/> mounted:', title);
    return;
  }
  trigger(title, message, buttons && buttons.length ? buttons : [{ text: 'OK' }]);
}

export default function AppAlertHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    trigger = (title, message, buttons) => setState({ title, message, buttons });
    return () => {
      trigger = null;
    };
  }, []);

  if (!state) return null;

  const close = (onPress) => {
    setState(null);
    if (onPress) setTimeout(onPress, 50);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{state.title}</Text>
          {!!state.message && <Text style={styles.message}>{state.message}</Text>}
          <View style={styles.buttonRow}>
            {state.buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.button, btn.style === 'destructive' && styles.destructiveButton]}
                onPress={() => close(btn.onPress)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === 'cancel' && styles.cancelText,
                    btn.style === 'destructive' && styles.destructiveText,
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.raised,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  buttonRow: {
    marginTop: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  destructiveButton: {},
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  cancelText: {
    color: colors.inkMuted,
  },
  destructiveText: {
    color: colors.danger,
  },
});
