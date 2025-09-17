import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const QuickLinks = ({ navigation }) => (
  <View style={styles.wrapper}>
    <Text style={styles.title}>Quick Links</Text>
    <View style={styles.linkContainer}>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('MyAccountScreen')}>
        <MaterialIcons name="account-circle" size={24} color="#fff" />
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('AppointmentScreen')}>
        <MaterialIcons name="event-note" size={24} color="#fff" />
        <Text style={styles.linkText}>Appointments</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('MedicalRecordsScreen')}>
        <MaterialIcons name="description" size={24} color="#fff" />
        <Text style={styles.linkText}>Medical Records</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('SettingsScreen')}>
        <MaterialIcons name="settings" size={24} color="#fff" />
        <Text style={styles.linkText}>Settings</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  linkContainer: {
    backgroundColor: '#075eec',
    borderRadius: 10,
    padding: 20,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 10,
  },
});

export default QuickLinks;
