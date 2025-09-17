// AdminSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const AdminSettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Manage App Settings" onPress={() => {/* Add functionality */}} />
      <Button title="Notification Preferences" onPress={() => {/* Add functionality */}} />
      <Button title="System Configurations" onPress={() => {/* Add functionality */}} />
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

export default AdminSettingsScreen;