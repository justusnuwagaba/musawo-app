import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { showAlert } from '../../components/AppAlert';
import { SUPPORT_CONTACT } from '../../config/contact';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

function ContactRow({ icon, color, title, subtitle, onPress, disabled }) {
  return (
    <TouchableOpacity style={[styles.row, disabled && styles.rowDisabled]} onPress={onPress} disabled={disabled}>
      <Icon name={icon} size={22} color={color} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ContactUsScreen() {
  const open = (url) => Linking.openURL(url).catch(() => showAlert('Could not open', 'Please try again later.'));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.subHeader}>We're happy to help</Text>

      <ContactRow
        icon="logo-whatsapp"
        color="#25D366"
        title="WhatsApp"
        subtitle={SUPPORT_CONTACT.whatsapp ? '24/7, fastest support' : 'Coming soon'}
        disabled={!SUPPORT_CONTACT.whatsapp}
        onPress={() => open(`whatsapp://send?phone=${SUPPORT_CONTACT.whatsapp}`)}
      />
      <ContactRow
        icon="mail-outline"
        color={colors.warning}
        title="Email"
        subtitle={SUPPORT_CONTACT.email || 'Coming soon'}
        disabled={!SUPPORT_CONTACT.email}
        onPress={() => open(`mailto:${SUPPORT_CONTACT.email}`)}
      />
      <ContactRow
        icon="call-outline"
        color={colors.primary}
        title="Call"
        subtitle={SUPPORT_CONTACT.phone || 'Coming soon'}
        disabled={!SUPPORT_CONTACT.phone}
        onPress={() => open(`tel:${SUPPORT_CONTACT.phone}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  subHeader: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    marginLeft: spacing.md,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
});
