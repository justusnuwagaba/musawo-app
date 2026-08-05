import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import AppointmentCard from '../../components/AppointmentCard';
import SegmentedToggle from '../../components/SegmentedToggle';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

const PAST_STATUSES = ['completed', 'cancelled', 'no_show'];

export default function MyAppointmentsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [appointments, setAppointments] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'appointments'),
      where('patientId', '==', user.uid),
      orderBy('scheduledAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[MyAppointmentsScreen] snapshot error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(firestore, 'reviews'), where('patientId', '==', user.uid)));
        setReviewedIds(new Set(snap.docs.map((d) => d.id)));
      } catch (err) {
        console.error('[MyAppointmentsScreen] reviewed check error:', err);
      }
    })();
  }, [user]);

  const handleCancel = (appointment) => {
    showAlert(t('appointments.cancelTitle'), t('appointments.cancelConfirm', { doctorName: appointment.doctorName }), [
      { text: t('appointments.keepIt'), style: 'cancel' },
      {
        text: t('appointments.cancelAppointment'),
        style: 'destructive',
        onPress: async () => {
          try {
            await updateDoc(doc(firestore, 'appointments', appointment.id), {
              status: 'cancelled',
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.error('[MyAppointmentsScreen] cancel error:', err);
            showAlert(t('appointments.couldNotCancel'), t('common.tryAgain'));
          }
        },
      },
    ]);
  };

  const handleMessage = (appointment) => {
    navigation.navigate(PATIENT_ROUTES.CHATS_TAB, {
      screen: PATIENT_ROUTES.CHAT,
      params: { appointmentId: appointment.id, otherName: appointment.doctorName || 'Doctor' },
    });
  };

  const handleRate = (appointment) => {
    navigation.navigate(PATIENT_ROUTES.RATE_APPOINTMENT, { appointment });
  };

  const handleJoinCall = (appointment) => {
    navigation.navigate(PATIENT_ROUTES.VIDEO_CONSULTATION, {
      channelId: appointment.id,
      appointmentId: appointment.id,
      callType: appointment.type,
      otherName: appointment.doctorName || 'Doctor',
    });
  };

  if (loading) return <LoadingSpinner />;

  // Uber-style split: active/requested bookings stay in "Upcoming"; anything
  // finished one way or another (completed, cancelled, no-show) moves to
  // "Past" — keeps status-colored badges (including red cancelled/no-show
  // ones) from cluttering the list you actually need to act on.
  const visibleAppointments = appointments.filter((a) =>
    tab === 'upcoming' ? !PAST_STATUSES.includes(a.status) : PAST_STATUSES.includes(a.status)
  );

  return (
    <SafeAreaView style={styles.container}>
      <SegmentedToggle
        style={styles.toggle}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: t('appointments.upcoming') },
          { value: 'past', label: t('appointments.past') },
        ]}
      />
      <FlatList
        data={visibleAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const actions = [];
          if (item.status === 'confirmed' && (item.type === 'video' || item.type === 'audio')) {
            actions.push({ label: t('appointments.joinCall'), onPress: () => handleJoinCall(item) });
          }
          if (item.status === 'confirmed' || item.status === 'completed') {
            actions.push({ label: t('appointments.message'), onPress: () => handleMessage(item) });
          }
          if (item.status === 'completed' && !reviewedIds.has(item.id)) {
            actions.push({ label: t('appointments.rate'), onPress: () => handleRate(item) });
          }
          if (item.status === 'requested' || item.status === 'confirmed') {
            actions.push(
              { label: t('appointments.reschedule'), onPress: () => navigation.navigate('EditAppointment', { appointment: item }) },
              { label: t('appointments.cancel'), destructive: true, onPress: () => handleCancel(item) }
            );
          }
          return <AppointmentCard appointment={item} personName={item.doctorName || 'Doctor'} actions={actions} />;
        }}
        ListEmptyComponent={
          tab === 'upcoming' ? (
            <EmptyState icon="calendar-outline" title={t('appointments.noAppointmentsTitle')} message={t('appointments.noAppointmentsMessage')} />
          ) : (
            <EmptyState icon="time-outline" title={t('appointments.noPastTitle')} message={t('appointments.noPastMessage')} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggle: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
