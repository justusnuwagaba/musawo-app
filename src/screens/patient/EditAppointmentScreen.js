import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const TIME_SLOTS = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export default function EditAppointmentScreen({ route, navigation }) {
  const { t } = useTranslation();
  const TYPES = [
    { value: 'video', label: t('appointments.typeVideo') },
    { value: 'audio', label: t('appointments.typeAudio') },
    { value: 'in_person', label: t('appointments.typeInPerson') },
  ];
  const { appointment } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [type, setType] = useState(appointment.type || 'video');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      showAlert(t('appointments.missingDetails'), t('appointments.pickNewDateTime'));
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    setSubmitting(true);
    try {
      await updateDoc(doc(firestore, 'appointments', appointment.id), {
        scheduledAt,
        type,
        status: 'requested',
        updatedAt: serverTimestamp(),
      });
      showAlert(t('appointments.updatedTitle'), t('appointments.updatedMessage'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('MyAppointments') },
      ]);
    } catch (err) {
      console.error('[EditAppointmentScreen] update error:', err);
      showAlert(t('appointments.couldNotReschedule'), t('common.tryAgain'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.doctorLine}>{t('appointments.reschedulingWith')} <Text style={styles.doctorName}>{appointment.doctorName}</Text></Text>

        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            minDate={new Date().toISOString().split('T')[0]}
            markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: colors.primary } } : {}}
            theme={{
              todayTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              arrowColor: colors.primary,
              monthTextColor: colors.ink,
              textDayFontWeight: '600',
              textMonthFontWeight: 'bold',
            }}
          />
        </View>

        <Text style={styles.label}>{t('appointments.pickTime')}</Text>
        <View style={styles.chipWrap}>
          {TIME_SLOTS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.timeChip, selectedTime === time && styles.timeChipSelected]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeChipText, selectedTime === time && styles.timeChipTextSelected]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('appointments.consultationType')}</Text>
        <SegmentedToggle options={TYPES} value={type} onChange={setType} style={styles.toggle} />

        <Button title={t('appointments.confirmReschedule')} onPress={handleConfirm} loading={submitting} style={styles.confirmButton} />
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
    marginBottom: spacing.md,
  },
  doctorName: {
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    color: colors.inkMuted,
    fontWeight: fontWeight.semibold,
  },
  timeChipTextSelected: {
    color: colors.onPrimary,
  },
  toggle: {
    marginBottom: spacing.xl,
  },
  confirmButton: {
    marginBottom: spacing.xl,
  },
});
