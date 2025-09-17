import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { firestore, auth } from './firebaseConfig'; // Ensure this path is correct
import { collection, getDocs, query } from 'firebase/firestore';

const PharmacyScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const medicinesQuery = query(collection(firestore, 'medicines'));
        const querySnapshot = await getDocs(medicinesQuery);
        
        const fetchedMedicines = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMedicines(fetchedMedicines);
      } catch (error) {
        console.error('Error fetching medicines: ', error);
        Alert.alert('Error', 'Failed to fetch medicines. Please try again later.');
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchMedicines();
  }, []);

  const handleOrder = (medicine) => {
    // Here you could implement the logic to order the medicine,
    // such as navigating to an order screen or showing a confirmation alert.
    Alert.alert('Order Medicine', `You have ordered ${medicine.name}.`);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#075eec" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pharmacy</Text>
      <Text style={styles.description}>Get affordable medicine.</Text>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.medicineItem}>
            <Text style={styles.medicineName}>{item.name}</Text>
            <Text style={styles.medicinePrice}>Price: ${item.price}</Text>
            <TouchableOpacity style={styles.orderButton} onPress={() => handleOrder(item)}>
              <Text style={styles.orderButtonText}>Order</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf4',
    width: '100%',
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  medicinePrice: {
    fontSize: 16,
    color: '#777',
  },
  orderButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#075eec',
    borderRadius: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PharmacyScreen;