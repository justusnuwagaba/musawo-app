// PatientManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const PatientManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Management</Text>
      <Button title="Review Patient Profiles" onPress={() => {/* Add functionality */}} />
      <Button title="Assist with Issues" onPress={() => {/* Add functionality */}} />
      <Button title="Monitor Engagement" onPress={() => {/* Add functionality */}} />
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

export default PatientManagementScreen;