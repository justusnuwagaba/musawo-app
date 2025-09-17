// PatientListScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const PatientListScreen = () => {
  const patients = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    // Add more patients as needed
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient List</Text>
      <FlatList
        data={patients}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            {/* Add navigation to Patient Details */}
          </View>
        )}
      />
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
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default PatientListScreen;