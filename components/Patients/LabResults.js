import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { firestore, auth } from './firebaseConfig'; // Ensure this path is correct
import { collection, query, where, getDocs } from 'firebase/firestore';

const LabResultsScreen = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabResults = async () => {
      try {
        const userId = auth.currentUser?.uid; // Get the current user's ID
        if (!userId) {
          Alert.alert('Error', 'No user is currently logged in.');
          return; // Exit if no user is logged in
        }

        const resultsQuery = query(collection(firestore, 'labResults'), where('userId', '==', userId));
        const querySnapshot = await getDocs(resultsQuery);
        
        const fetchedResults = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setResults(fetchedResults);
      } catch (error) {
        console.error('Error fetching lab results: ', error);
        Alert.alert('Error', 'Failed to fetch lab results. Please try again later.');
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchLabResults();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#075eec" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Results</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultTest}>{item.test}</Text>
            <Text style={styles.result}>{item.result}</Text>
            <Text style={styles.resultDate}>{item.date}</Text>
          </View>
        )}
      />
      {results.length === 0 && <Text style={styles.noResults}>No lab results found.</Text>}
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
  resultItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf4',
  },
  resultTest: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075eec',
  },
  result: {
    color: '#777',
    marginBottom: 10,
  },
  resultDate: {
    color: '#555',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
});

export default LabResultsScreen;