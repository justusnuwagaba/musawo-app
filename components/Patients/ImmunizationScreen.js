import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ImmunizationScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Immunization</Text>
      <Text style={styles.description}>Convenience at home.</Text>
      <TouchableOpacity style={styles.button} onPress={() => alert('Schedule Immunization')}>
        <Text style={styles.buttonText}>Schedule Immunization</Text>
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

export default ImmunizationScreen;
