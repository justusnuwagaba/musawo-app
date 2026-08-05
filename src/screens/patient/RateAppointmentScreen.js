import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import StarRating from '../../components/StarRating';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, fontSize, fontWeight } from '../../theme/tokens';

export default function RateAppointmentScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { appointment } = route.params;
  const { user } = useUserContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      showAlert(t('appointments.missingDetails'), t('rateAppointment.ratingLabel'));
      return;
    }
    setSubmitting(true);
    try {
      await setDoc(doc(firestore, 'reviews', appointment.id), {
        appointmentId: appointment.id,
        patientId: user.uid,
        doctorId: appointment.doctorId,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      showAlert(t('rateAppointment.submittedTitle'), t('rateAppointment.submittedMessage'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('[RateAppointmentScreen] submit error:', err);
      showAlert(t('rateAppointment.failedTitle'), t('rateAppointment.failedMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.doctorLine}>
          {t('rateAppointment.title')} <Text style={styles.doctorName}>{appointment.doctorName}</Text>
        </Text>

        <Text style={styles.label}>{t('rateAppointment.ratingLabel')}</Text>
        <StarRating value={rating} onChange={setRating} size={36} style={styles.stars} />

        <Input
          label={t('rateAppointment.commentLabel')}
          placeholder={t('rateAppointment.commentPlaceholder')}
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <Button title={t('rateAppointment.submit')} onPress={handleSubmit} loading={submitting} style={styles.submitButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
  },
  doctorLine: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },
  doctorName: {
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  stars: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
