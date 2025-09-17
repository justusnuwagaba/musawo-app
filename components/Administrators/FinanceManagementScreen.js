// FinanceManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const FinanceManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finance Management</Text>
      <Button title="View Transaction History" onPress={() => {/* Add functionality */}} />
      <Button title="Manage Refunds" onPress={() => {/* Add functionality */}} />
      <Button title="Generate Financial Reports" onPress={() => {/* Add functionality */}} />
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

export default FinanceManagementScreen;