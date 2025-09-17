// DrMedicalRecordsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DrMedicalRecordsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Records</Text>
      {/* Display and manage patient medical records */}
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

export default DrMedicalRecordsScreen;