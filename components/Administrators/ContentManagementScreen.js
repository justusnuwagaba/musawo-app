// ContentManagementScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ContentManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Content Management</Text>
      <Button title="Upload Article" onPress={() => {/* Add functionality */}} />
      <Button title="Edit FAQs" onPress={() => {/* Add functionality */}} />
      <Button title="Delete Marketing Materials" onPress={() => {/* Add functionality */}} />
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

export default ContentManagementScreen;