import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import Button from '../../components/Button';
import { useUserContext } from '../../context/UserProvider';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const STATUS_COPY = {
  unsubmitted: {
    icon: 'document-text-outline',
    title: 'Finish your doctor application',
    message: 'Submit your license and specialty details so a Musawo reviewer can verify you before you can see patients.',
  },
  pending: {
    icon: 'time-outline',
    title: 'Application under review',
    message: "We've received your application. A Musawo admin will verify your license details shortly — you'll be notified as soon as you're approved.",
  },
  rejected: {
    icon: 'alert-circle-outline',
    title: 'Application needs changes',
    message: 'Your application was not approved. Please review the feedback and resubmit your details.',
  },
};

export default function VerificationPendingScreen() {
  const { profile, logout } = useUserContext();
  const copy = STATUS_COPY[profile?.verificationStatus] ?? STATUS_COPY.unsubmitted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name={copy.icon} size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        {!!profile?.rejectionReason && profile.verificationStatus === 'rejected' && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Reviewer feedback</Text>
            <Text style={styles.reasonText}>{profile.rejectionReason}</Text>
          </View>
        )}
        <Button title="Log out" variant="outline" onPress={logout} style={styles.logoutButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  reasonBox: {
    width: '100%',
    backgroundColor: colors.dangerLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  reasonLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  logoutButton: {
    marginTop: spacing.xxl,
    minWidth: 160,
  },
});
