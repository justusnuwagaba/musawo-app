// PatientDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PatientDetailsScreen = ({ route }) => {
  const { patientId } = route.params; // Get patient ID from navigation params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Details</Text>
      <Text>Patient ID: {patientId}</Text>
      {/* Add more patient details and medical history here */}
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

export default PatientDetailsScreen;