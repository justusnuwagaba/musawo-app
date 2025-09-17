// ScheduleAppointmentScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ScheduleAppointmentScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Appointment</Text>
      {/* Add form fields to schedule an appointment */}
      <Button title="Save Appointment" onPress={() => { /* Save logic */ }} />
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

export default ScheduleAppointmentScreen;