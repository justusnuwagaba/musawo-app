import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const LabBookingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Lab Test</Text>
      {/* Add booking form or options here */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Schedule Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075eec',
  },
  button: {
    backgroundColor: '#075eec',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default LabBookingScreen;
