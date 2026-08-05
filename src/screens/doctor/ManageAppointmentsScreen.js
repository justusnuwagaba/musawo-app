import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import SegmentedToggle from '../../components/SegmentedToggle';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing } from '../../theme/tokens';
import { DOCTOR_ROUTES } from '../../navigation/routes';

const TABS = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
];

export default function ManageAppointmentsScreen({ navigation }) {
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
      showAlert('Could not update', 'Please try again.');
    }
  };

  const handleDecline = (appointment) => {
    showAlert('Decline appointment', `Decline the request from ${appointment.patientName}?`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => updateStatus(appointment, 'cancelled') },
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
      label: 'Patient',
      onPress: () => navigation.navigate(DOCTOR_ROUTES.PATIENT_DETAILS, { patientId: appointment.patientId, patientName: appointment.patientName }),
    };
    if (appointment.status === 'requested') {
      return [
        { label: 'Accept', onPress: () => updateStatus(appointment, 'confirmed') },
        { label: 'Decline', destructive: true, onPress: () => handleDecline(appointment) },
      ];
    }
    if (appointment.status === 'confirmed') {
      const actions = [viewPatient, { label: 'Message', onPress: () => handleMessage(appointment) }, { label: 'Mark complete', onPress: () => updateStatus(appointment, 'completed') }];
      if (appointment.type === 'video' || appointment.type === 'audio') {
        actions.unshift({
          label: 'Start call',
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
    return [viewPatient, { label: 'Message', onPress: () => handleMessage(appointment) }];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
            <EmptyState icon="calendar-outline" title={`No ${tab} appointments`} message="They'll show up here as patients book with you." />
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
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
