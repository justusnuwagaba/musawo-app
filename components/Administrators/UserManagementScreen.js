// UserManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const UserManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <Button title="Add Admin" onPress={() => {/* Add functionality */}} />
      <Button title="View Admin List" onPress={() => {/* Add functionality */}} />
      <Button title="Edit Admin" onPress={() => {/* Add functionality */}} />
      <Button title="Remove Admin" onPress={() => {/* Add functionality */}} />
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

export default UserManagementScreen;