import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

const TIME_SLOTS = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export default function BookAppointmentScreen({ route, navigation }) {
  const { t } = useTranslation();
  const TYPES = [
    { value: 'video', label: t('appointments.typeVideo') },
    { value: 'audio', label: t('appointments.typeAudio') },
    { value: 'in_person', label: t('appointments.typeInPerson') },
  ];
  const { doctorId, doctorName, specialty } = route.params;
  const { user, profile } = useUserContext();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [type, setType] = useState('video');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // React state updates aren't synchronous — a rapid double/triple-tap can
  // fire handleConfirm multiple times before the Button's disabled={loading}
  // prop actually re-renders. This ref is checked immediately, before any
  // state update, closing that race.
  const submittingRef = useRef(false);

  // Consultation fee is only ever a *display estimate* here — the actual
  // amounts written are re-read fresh inside the booking transaction below,
  // so a stale fee/rate on this screen never causes a rules rejection.
  const [consultationFee, setConsultationFee] = useState(null);
  const [commissionRate, setCommissionRate] = useState(0.15);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null); // { code, type, value }
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [doctorSnap, commissionSnap] = await Promise.all([
          getDoc(doc(firestore, 'users', doctorId)),
          getDoc(doc(firestore, 'config', 'commission')),
        ]);
        if (doctorSnap.exists()) setConsultationFee(doctorSnap.data().consultationFee ?? 0);
        if (commissionSnap.exists()) setCommissionRate(commissionSnap.data().defaultRate ?? 0.15);
      } catch (err) {
        console.error('[BookAppointmentScreen] fee load error:', err);
      }
    })();
  }, [doctorId]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount || consultationFee == null) return 0;
    return appliedDiscount.type === 'percentage'
      ? Math.round((consultationFee * appliedDiscount.value) / 100)
      : Math.min(appliedDiscount.value, consultationFee);
  }, [appliedDiscount, consultationFee]);

  const finalAmount = consultationFee == null ? null : Math.max(consultationFee - discountAmount, 0);

  const handleApplyCode = async () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;
    setApplyingCode(true);
    try {
      const snap = await getDoc(doc(firestore, 'discounts', code));
      const d = snap.exists() ? snap.data() : null;
      const expired = d?.expiresAt && d.expiresAt.toDate().getTime() < Date.now();
      const exhausted = d?.usageLimit != null && d.usageCount >= d.usageLimit;
      if (!d || !d.active || expired || exhausted) {
        setAppliedDiscount(null);
        showAlert(t('appointments.invalidCode'), t('common.tryAgain'));
        return;
      }
      setAppliedDiscount({ code, type: d.type, value: d.value });
    } catch (err) {
      console.error('[BookAppointmentScreen] apply code error:', err);
      showAlert(t('appointments.invalidCode'), t('common.tryAgain'));
    } finally {
      setApplyingCode(false);
    }
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    if (!selectedDate || !selectedTime) {
      showAlert(t('appointments.missingDetails'), t('appointments.pickDateTime'));
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const appointmentRef = doc(collection(firestore, 'appointments'));
      const paymentRef = doc(firestore, 'payments', appointmentRef.id);
      const discountRef = appliedDiscount ? doc(firestore, 'discounts', appliedDiscount.code) : null;

      await runTransaction(firestore, async (transaction) => {
        // Re-read the canonical fee/rate fresh inside the transaction — these
        // are what firestore.rules' payments.create cross-check compares
        // against, so using anything but a fresh read here would risk a
        // rules rejection if either changed since this screen loaded.
        const doctorSnap = await transaction.get(doc(firestore, 'users', doctorId));
        const commissionSnap = await transaction.get(doc(firestore, 'config', 'commission'));
        const freshFee = doctorSnap.data()?.consultationFee ?? 0;
        const freshRate = commissionSnap.data()?.defaultRate ?? 0.15;

        let freshDiscountAmount = 0;
        let usedCode = null;
        if (discountRef) {
          const discountSnap = await transaction.get(discountRef);
          const d = discountSnap.exists() ? discountSnap.data() : null;
          const expired = d?.expiresAt && d.expiresAt.toDate().getTime() < Date.now();
          const exhausted = d?.usageLimit != null && d.usageCount >= d.usageLimit;
          if (!d || !d.active || expired || exhausted) throw new Error('DISCOUNT_INVALID');
          freshDiscountAmount = d.type === 'percentage' ? Math.round((freshFee * d.value) / 100) : Math.min(d.value, freshFee);
          usedCode = appliedDiscount.code;
          transaction.update(discountRef, { usageCount: d.usageCount + 1, updatedAt: serverTimestamp() });
        }

        const amount = Math.max(freshFee - freshDiscountAmount, 0);
        const commissionAmount = Math.round(amount * freshRate);
        const doctorEarnings = amount - commissionAmount;

        transaction.set(appointmentRef, {
          patientId: user.uid,
          patientName: profile?.displayName || 'Patient',
          doctorId,
          doctorName,
          specialty: specialty || 'General',
          scheduledAt,
          durationMinutes: 30,
          type,
          status: 'requested',
          reasonForVisit: reasonForVisit.trim(),
          paymentStatus: 'unpaid',
          reminderSent: false,
          consultationFee: freshFee,
          commissionRate: freshRate,
          discountCode: usedCode,
          discountAmount: freshDiscountAmount,
          finalAmount: amount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(paymentRef, {
          appointmentId: appointmentRef.id,
          patientId: user.uid,
          doctorId,
          patientName: profile?.displayName || 'Patient',
          doctorName,
          consultationFee: freshFee,
          commissionRate: freshRate,
          discountCode: usedCode,
          discountAmount: freshDiscountAmount,
          amount,
          commissionAmount,
          doctorEarnings,
          status: 'pending',
          paidAt: null,
          markedPaidBy: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      showAlert(t('appointments.requestedTitle'), t('appointments.requestedMessage', { doctorName }), [
        {
          text: t('common.ok'),
          onPress: () => navigation.navigate(PATIENT_ROUTES.APPOINTMENTS_TAB, { screen: PATIENT_ROUTES.MY_APPOINTMENTS }),
        },
      ]);
    } catch (err) {
      console.error('[BookAppointmentScreen] booking error:', err);
      if (err.message === 'DISCOUNT_INVALID') {
        showAlert(t('appointments.invalidCode'), t('common.tryAgain'));
      } else {
        showAlert(t('appointments.bookingFailedTitle'), t('appointments.bookingFailedMessage'));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.doctorLine}>{t('appointments.bookingWith')} <Text style={styles.doctorName}>{doctorName}</Text></Text>

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

        <Input
          label={t('appointments.reasonLabel')}
          placeholder={t('appointments.reasonPlaceholder')}
          value={reasonForVisit}
          onChangeText={setReasonForVisit}
          multiline
        />

        <Text style={styles.label}>{t('appointments.discountCodeLabel')}</Text>
        <View style={styles.discountRow}>
          <Input
            placeholder={t('appointments.discountCodePlaceholder')}
            value={discountCodeInput}
            onChangeText={setDiscountCodeInput}
            autoCapitalize="characters"
            style={styles.discountInput}
          />
          <Button title={t('appointments.applyCode')} variant="outline" onPress={handleApplyCode} loading={applyingCode} style={styles.applyButton} />
        </View>
        {appliedDiscount && <Text style={styles.codeAppliedText}>{t('appointments.codeApplied')}</Text>}

        {consultationFee != null && (
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>{t('appointments.feeLabel')}</Text>
              <Text style={styles.feeValue}>UGX {consultationFee.toLocaleString()}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>{t('appointments.discountLabel')}</Text>
                <Text style={[styles.feeValue, styles.discountValue]}>-UGX {discountAmount.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.feeRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('appointments.totalLabel')}</Text>
              <Text style={styles.totalValue}>UGX {finalAmount.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <Button title={t('appointments.confirmRequest')} onPress={handleConfirm} loading={submitting} style={styles.confirmButton} />
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
  discountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  discountInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  applyButton: {
    marginTop: spacing.xs,
  },
  codeAppliedText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  feeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  feeLabel: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  feeValue: {
    fontSize: fontSize.sm,
    color: colors.ink,
    fontWeight: fontWeight.semibold,
  },
  discountValue: {
    color: colors.success,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
