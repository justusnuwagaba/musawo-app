import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const HealthScreeningScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Screening</Text>
      <Text style={styles.description}>Become responsible for your health.</Text>
      <TouchableOpacity style={styles.button} onPress={() => alert('Book Health Screening')}>
        <Text style={styles.buttonText}>Book Health Screening</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#075eec',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HealthScreeningScreen;
