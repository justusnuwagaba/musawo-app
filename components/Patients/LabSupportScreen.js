import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const LabSupportScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Support</Text>
      <Text style={styles.description}>
        If you have any questions or need assistance, please contact our support team.
      </Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Contact Support</Text>
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
  description: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
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

export default LabSupportScreen;
