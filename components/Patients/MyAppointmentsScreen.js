import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const initialAppointments = [
  { id: '1', title: 'Appointment 1', specialty: 'Cardiology', date: '2024-07-01', time: '08:30', type: 'In Person', status: 'Confirmed' },
  { id: '2', title: 'Appointment 2', specialty: 'Dermatology', date: '2024-07-02', time: '09:00', type: 'Audio Call', status: 'Confirmed' },
  { id: '3', title: 'Appointment 3', specialty: 'Neurology', date: '2024-07-03', time: '09:30', type: 'Video Session', status: 'Confirmed' },
];

const MyAppointmentsScreen = ({ route }) => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (route.params?.newAppointment) {
      const newAppointment = {
        id: Date.now().toString(),
        title: route.params.newAppointment.name,
        specialty: 'Specialty not provided',
        date: 'Date not provided',
        time: 'Time not provided',
        type: 'Type not provided',
        status: 'Confirmed',
      };
      setAppointments((prevAppointments) => [...prevAppointments, newAppointment]);
    }
  }, [route.params?.newAppointment]);

  const handleCancel = (appointment) => {
    setShowCancelModal(true);
    setSelectedAppointment(appointment);
  };

  const confirmCancel = () => {
    setAppointments(appointments.filter((appointment) => appointment.id !== selectedAppointment.id));
    setShowCancelModal(false);
    setSelectedAppointment(null);
  };

  const handleEdit = (appointment) => {
    navigation.navigate('EditAppointment', { appointment });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentTitle}>{item.title}</Text>
            <Text style={styles.appointmentDetails}>Specialty: {item.specialty}</Text>
            <Text style={styles.appointmentDetails}>Date: {item.date}</Text>
            <Text style={styles.appointmentDetails}>Time: {item.time}</Text>
            <Text style={styles.appointmentDetails}>Type: {item.type}</Text>
            <Text style={styles.appointmentDetails}>Status: {item.status}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => handleCancel(item)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={showCancelModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to cancel this appointment?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonYes]}
                onPress={confirmCancel}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonNo]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e8ecf4',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  appointmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D2A32',
    marginBottom: 10,
  },
  appointmentDetails: {
    fontSize: 16,
    color: '#1D2A32',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%',
  },
  editButton: {
    backgroundColor: '#075eec',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%',
  },
  modalButtonYes: {
    backgroundColor: '#e74c3c',
  },
  modalButtonNo: {
    backgroundColor: '#2ecc71',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MyAppointmentsScreen;