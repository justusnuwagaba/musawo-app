import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { firestore } from './firebaseConfig'; // Adjust the import path as needed
import { collection, getDocs } from 'firebase/firestore';

export default function MedicalRecordsScreen() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        const recordsCollection = collection(firestore, 'medicalRecords'); // Ensure this matches your Firestore structure
        const recordsSnapshot = await getDocs(recordsCollection);
        const recordsList = recordsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMedicalRecords(recordsList);
      } catch (error) {
        Alert.alert('Error fetching medical records:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalRecords();
  }, []);

  const renderRecord = ({ item }) => (
    <View style={styles.recordContainer}>
      <Text style={styles.recordText}>Date: {item.date}</Text>
      <Text style={styles.recordText}>Details: {item.details}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#075eec" />
      ) : (
        <>
          <Text style={styles.header}>Medical Records</Text>
          <FlatList
            data={medicalRecords}
            keyExtractor={(item) => item.id}
            renderItem={renderRecord}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e8ecf4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075eec',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  recordContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  recordText: {
    fontSize: 16,
    color: '#1D2A32',
  },
});