// DoctorDashboardScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const DoctorDashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>
      <Button title="View Patients" onPress={() => navigation.navigate('PatientList')} />
      <Button title="Schedule Appointment" onPress={() => navigation.navigate('ScheduleAppointment')} />
      <Button title="Manage Appointments" onPress={() => navigation.navigate('ManageAppointments')} />
      <Button title="Medical Records" onPress={() => navigation.navigate('MedicalRecords')} />
      <Button title="Consultation History" onPress={() => navigation.navigate('ConsultationHistory')} />
      <Button title="Notifications" onPress={() => navigation.navigate('Notifications')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DoctorDashboardScreen;