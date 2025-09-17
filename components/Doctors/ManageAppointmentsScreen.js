// ManageAppointmentsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ManageAppointmentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Appointments</Text>
      {/* Display upcoming appointments and options to reschedule or cancel */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ManageAppointmentsScreen;