import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LabHomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lab Tests</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LabTestCatalog')}>
        <MaterialIcons name="list" size={24} color="#fff" />
        <Text style={styles.buttonText}>View Test Catalog</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LabBooking')}>
        <MaterialIcons name="event" size={24} color="#fff" />
        <Text style={styles.buttonText}>Book a Lab Test</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LabResults')}>
        <MaterialIcons name="assessment" size={24} color="#fff" />
        <Text style={styles.buttonText}>View Test Results</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LabSupport')}>
        <MaterialIcons name="support-agent" size={24} color="#fff" />
        <Text style={styles.buttonText}>Customer Support</Text>
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
});

export default LabHomeScreen;
