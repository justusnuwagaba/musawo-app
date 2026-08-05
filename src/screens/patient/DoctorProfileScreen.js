import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/Ionicons';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import RadarPulse from '../../components/RadarPulse';
import EmptyState from '../../components/EmptyState';
import { showAlert } from '../../components/AppAlert';
import { getDoctorRatingSummary } from '../../utils/ratings';
import { isFavoriteDoctor, toggleFavoriteDoctor } from '../../utils/favorites';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

export default function DoctorProfileScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { doctorId } = route.params;
  const { user, profile, updateProfile } = useUserContext();
  const [doctor, setDoctor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({ average: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [snap, summary] = await Promise.all([
          getDoc(doc(firestore, 'users', doctorId)),
          getDoctorRatingSummary(doctorId),
        ]);
        setDoctor(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setRatingSummary(summary);
      } catch (err) {
        console.error('[DoctorProfileScreen] load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  const handleConsultNow = async () => {
    setConnecting(true);
    try {
      const queueRef = await addDoc(collection(firestore, 'consultationQueue'), {
        patientId: user.uid,
        patientName: profile?.displayName || 'Patient',
        patientType: 'self',
        specialty: doctor.specialty || 'General',
        matchedDoctorId: doctor.id,
        status: 'matched',
        requestedAt: serverTimestamp(),
        matchedAt: serverTimestamp(),
      });
      navigation.navigate('VideoConsultation', {
        channelId: queueRef.id,
        queueId: queueRef.id,
        callType: 'video',
        otherName: doctor.displayName,
      });
    } catch (err) {
      console.error('[DoctorProfileScreen] consult now error:', err);
      showAlert(t('doctorProfile.couldNotConnect'), t('doctorProfile.tryAgainMoment'));
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!doctor) return <EmptyState icon="alert-circle-outline" title={t('doctorProfile.notFoundTitle')} message={t('doctorProfile.notFoundMessage')} />;

  if (connecting) {
    return (
      <View style={styles.connectingContainer}>
        <RadarPulse color={colors.primary} size={130} />
        <Text style={styles.connectingText}>{t('doctorProfile.connectingTo', { name: doctor.displayName })}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavoriteDoctor(profile, updateProfile, doctor.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={isFavoriteDoctor(profile, doctor.id) ? 'heart' : 'heart-outline'} size={24} color={isFavoriteDoctor(profile, doctor.id) ? colors.accent : colors.inkFaint} />
          </TouchableOpacity>
          <Avatar name={doctor.displayName} photoURL={doctor.photoURL} size="lg" />
          <Text style={styles.name}>{doctor.displayName}</Text>
          <Text style={styles.specialty}>{doctor.specialty || 'General Practitioner'}</Text>
          <View style={styles.metaRow}>
            {ratingSummary.average != null ? (
              <View style={styles.metaItem}>
                <Icon name="star" size={14} color={colors.warning} />
                <Text style={styles.metaText}>{ratingSummary.average.toFixed(1)} ({ratingSummary.count})</Text>
              </View>
            ) : (
              <Text style={styles.metaText}>{t('doctorProfile.noRatingsYet')}</Text>
            )}
            {doctor.isOnline && (
              <View style={styles.metaItem}>
                <View style={styles.onlineDot} />
                <Text style={[styles.metaText, { color: colors.secondary }]}>{t('doctorProfile.onlineNow')}</Text>
              </View>
            )}
          </View>
        </View>

        {!!doctor.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('doctorProfile.about')}</Text>
            <Text style={styles.bio}>{doctor.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('doctorProfile.details')}</Text>
          {!!doctor.yearsExperience && <DetailRow icon="ribbon-outline" label={t('doctorProfile.yearsExperience', { count: doctor.yearsExperience })} />}
          {!!doctor.languagesSpoken?.length && <DetailRow icon="language-outline" label={doctor.languagesSpoken.join(', ')} />}
          {!!doctor.consultationFee && (
            <DetailRow icon="cash-outline" label={t('doctorProfile.perConsultation', { amount: doctor.consultationFee.toLocaleString() })} />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {doctor.isOnline && (
          <Button title={t('doctorProfile.consultNow')} variant="primary" onPress={handleConsultNow} style={styles.footerButton} />
        )}
        <Button
          title={t('doctorProfile.bookAppointment')}
          variant={doctor.isOnline ? 'outline' : 'primary'}
          onPress={() => navigation.navigate('BookAppointment', { doctorId: doctor.id, doctorName: doctor.displayName, specialty: doctor.specialty })}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text style={styles.detailText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  connectingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  connectingText: {
    marginTop: spacing.lg,
    fontSize: fontSize.md,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  scroll: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  specialty: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginLeft: 4,
    fontWeight: fontWeight.semibold,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary, // the doctor's own state, as seen by the patient — cyan, not green
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerButton: {
    marginBottom: spacing.sm,
  },
});
