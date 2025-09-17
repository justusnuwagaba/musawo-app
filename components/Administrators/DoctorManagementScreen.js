// DoctorManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const DoctorManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Management</Text>
      <Button title="Approve Doctor Applications" onPress={() => {/* Add functionality */}} />
      <Button title="View Doctor Details" onPress={() => {/* Add functionality */}} />
      <Button title="Manage Specialties" onPress={() => {/* Add functionality */}} />
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

export default DoctorManagementScreen;