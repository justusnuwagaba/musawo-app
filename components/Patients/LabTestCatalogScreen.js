import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const TESTS = [
  { id: '1', name: 'Complete Blood Count', price: '$20', description: 'A basic test to evaluate overall health.' },
  { id: '2', name: 'Lipid Panel', price: '$30', description: 'A test to measure cholesterol levels.' },
  // Add more tests here
];

const LabTestCatalogScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Catalog</Text>
      <FlatList
        data={TESTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.testItem}>
            <Text style={styles.testName}>{item.name}</Text>
            <Text style={styles.testPrice}>{item.price}</Text>
            <Text style={styles.testDescription}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075eec',
  },
  testItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf4',
  },
  testName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075eec',
  },
  testPrice: {
    color: '#777',
    marginBottom: 10,
  },
  testDescription: {
    color: '#555',
  },
});

export default LabTestCatalogScreen;
