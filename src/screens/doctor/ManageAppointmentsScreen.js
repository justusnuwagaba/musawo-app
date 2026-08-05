import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import SegmentedToggle from '../../components/SegmentedToggle';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, fontSize, fontWeight } from '../../theme/tokens';
import { DOCTOR_ROUTES } from '../../navigation/routes';

export default function ManageAppointmentsScreen({ navigation }) {
  const { t } = useTranslation();
  const TABS = [
    { value: 'requested', label: t('appointments.tabRequested') },
    { value: 'confirmed', label: t('appointments.tabConfirmed') },
    { value: 'completed', label: t('appointments.tabCompleted') },
  ];
  const { user } = useUserContext();
  const [tab, setTab] = useState('requested');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(firestore, 'appointments'),
      where('doctorId', '==', user.uid),
      where('status', '==', tab),
      orderBy('scheduledAt', tab === 'completed' ? 'desc' : 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[ManageAppointmentsScreen] snapshot error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, tab]);

  const updateStatus = async (appointment, status, successMessage) => {
    try {
      await updateDoc(doc(firestore, 'appointments', appointment.id), { status, updatedAt: serverTimestamp() });
      if (successMessage) showAlert(successMessage);
    } catch (err) {
      console.error('[ManageAppointmentsScreen] update error:', err);
      showAlert(t('appointments.couldNotUpdate'), t('common.tryAgain'));
    }
  };

  const handleDecline = (appointment) => {
    showAlert(t('appointments.declineTitle'), t('appointments.declineConfirm', { patientName: appointment.patientName }), [
      { text: t('appointments.keepIt'), style: 'cancel' },
      { text: t('appointments.decline'), style: 'destructive', onPress: () => updateStatus(appointment, 'cancelled') },
    ]);
  };

  const handleMessage = (appointment) => {
    navigation.navigate(DOCTOR_ROUTES.CHATS_TAB, {
      screen: DOCTOR_ROUTES.CHAT,
      params: { appointmentId: appointment.id, otherName: appointment.patientName || 'Patient' },
    });
  };

  const actionsFor = (appointment) => {
    const viewPatient = {
      label: t('appointments.viewPatient'),
      onPress: () => navigation.navigate(DOCTOR_ROUTES.PATIENT_DETAILS, { patientId: appointment.patientId, patientName: appointment.patientName }),
    };
    if (appointment.status === 'requested') {
      return [
        { label: t('appointments.accept'), onPress: () => updateStatus(appointment, 'confirmed') },
        { label: t('appointments.decline'), destructive: true, onPress: () => handleDecline(appointment) },
      ];
    }
    if (appointment.status === 'confirmed') {
      const actions = [
        viewPatient,
        { label: t('appointments.message'), onPress: () => handleMessage(appointment) },
        { label: t('appointments.markComplete'), onPress: () => updateStatus(appointment, 'completed') },
      ];
      if (appointment.type === 'video' || appointment.type === 'audio') {
        actions.unshift({
          label: t('appointments.startCall'),
          onPress: () =>
            navigation.navigate(DOCTOR_ROUTES.VIDEO_CONSULTATION, {
              channelId: appointment.id,
              appointmentId: appointment.id,
              callType: appointment.type,
              otherName: appointment.patientName,
            }),
        });
      }
      return actions;
    }
    return [viewPatient, { label: t('appointments.message'), onPress: () => handleMessage(appointment) }];
  };

  const EMPTY_TITLE = {
    requested: t('appointments.noRequestedTitle'),
    confirmed: t('appointments.noConfirmedTitle'),
    completed: t('appointments.noCompletedTitle'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('appointments.manageTitle')}</Text>
        <SegmentedToggle options={TABS} value={tab} onChange={setTab} />
      </View>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} personName={item.patientName || 'Patient'} actions={actionsFor(item)} />
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title={EMPTY_TITLE[tab]} message={t('appointments.noAppointmentsForDoctorMessage')} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
