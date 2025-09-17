// SwitchRoleScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useUser } from './UserContext';

const SwitchRoleScreen = () => {
  const { loginAsPatient } = useUser();
  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');

  const handleSwitchToPatient = () => {
    // Here you would typically authenticate the patient credentials
    // For example, call your API to validate the patient ID and password
    const patient = { id: patientId, role: 'Patient' }; // Mock patient object
    loginAsPatient(patient); // Set the patient as the current user
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Switch to Patient</Text>
      <TextInput
        placeholder="Patient ID"
        value={patientId}
        onChangeText={setPatientId}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Switch" onPress={handleSwitchToPatient} />
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
  },
});

export default SwitchRoleScreen;