import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import Button from '../../components/Button';
import RadarPulse from '../../components/RadarPulse';
import { useUserContext } from '../../context/UserProvider';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

// Icon color follows the app's existing status-color conventions
// (warning=pending, danger=rejected — same as AppointmentCard's
// STATUS_STYLE) rather than always green regardless of state.
const STATUS_COPY = {
  unsubmitted: {
    icon: 'document-text-outline',
    color: colors.primary,
    bg: colors.primaryMuted,
    title: 'Finish your doctor application',
    message: 'Submit your license and specialty details so a Musawo reviewer can verify you before you can see patients.',
  },
  pending: {
    icon: 'time-outline',
    color: colors.warning,
    bg: colors.warningLight,
    title: 'Application under review',
    message: "We've received your application. A Musawo admin will verify your license details shortly — you'll be notified as soon as you're approved.",
  },
  rejected: {
    icon: 'alert-circle-outline',
    color: colors.danger,
    bg: colors.dangerLight,
    title: 'Application needs changes',
    message: 'Your application was not approved. Please review the feedback and resubmit your details.',
  },
};

function formatSubmittedDate(submittedAt) {
  if (!submittedAt?.toDate) return null;
  return submittedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VerificationPendingScreen() {
  const { user, profile, logout } = useUserContext();
  const status = profile?.verificationStatus ?? 'unsubmitted';
  const copy = STATUS_COPY[status] ?? STATUS_COPY.unsubmitted;
  const [submittedAt, setSubmittedAt] = useState(null);

  // Real field from doctorApplications/{uid}.submittedAt (see
  // DoctorApplicationScreen) — only fetched when an application actually
  // exists on file (pending/rejected), not for the unsubmitted state.
  useEffect(() => {
    if (!user || status === 'unsubmitted') return;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'doctorApplications', user.uid));
        if (snap.exists()) setSubmittedAt(snap.data().submittedAt);
      } catch (err) {
        console.error('[VerificationPendingScreen] fetch application error:', err);
      }
    })();
  }, [user, status]);

  const submittedLabel = formatSubmittedDate(submittedAt);
  const iconCircle = (
    <View style={[styles.iconCircle, { backgroundColor: copy.bg }]}>
      <Icon name={copy.icon} size={36} color={copy.color} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Only the actively-waiting "pending" state gets the pulsing
            treatment — unsubmitted needs the doctor's own next action,
            rejected is a settled state, neither is "waiting in motion." */}
        {status === 'pending' ? (
          <RadarPulse color={colors.warning} size={100} showDot={false}>
            {iconCircle}
          </RadarPulse>
        ) : (
          iconCircle
        )}
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        {!!submittedLabel && <Text style={styles.submittedLabel}>Submitted on {submittedLabel}</Text>}
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
  submittedLabel: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: spacing.md,
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
