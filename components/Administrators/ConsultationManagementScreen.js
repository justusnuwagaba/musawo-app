// ConsultationManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ConsultationManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultation Management</Text>
      <Button title="View Scheduled Consultations" onPress={() => {/* Add functionality */}} />
      <Button title="Assign Doctors to Patients" onPress={() => {/* Add functionality */}} />
      <Button title="Manage Consultation Fees" onPress={() => {/* Add functionality */}} />
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

export default ConsultationManagementScreen;