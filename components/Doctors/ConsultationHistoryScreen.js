// ConsultationHistoryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ConsultationHistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultation History</Text>
      {/* Display past consultations with patients */}
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

export default ConsultationHistoryScreen;