import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { firestore } from './firebaseConfig'; // Ensure this path is correct
import { collection, getDocs, query, where } from 'firebase/firestore';

const SearchDoctors = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery) {
            Alert.alert('Error', 'Please enter a search term.');
            return;
        }

        setLoading(true);
        try {
            const doctorsQuery = query(
                collection(firestore, 'doctors'),
                where('specialty', '==', searchQuery) // Assuming you have a 'specialty' field in your doctors collection
            );
            const querySnapshot = await getDocs(doctorsQuery);
            const fetchedDoctors = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDoctors(fetchedDoctors);
        } catch (error) {
            console.error('Error fetching doctors: ', error);
            Alert.alert('Error', 'Failed to fetch doctors. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const renderDoctorItem = ({ item }) => (
        <TouchableOpacity style={styles.doctorItem} onPress={() => Alert.alert('Doctor Details', `You selected Dr. ${item.name}`)}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search for Doctors</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Enter specialty (e.g., Cardiologist)"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            {loading ? (
                <ActivityIndicator size="large" color="#075eec" style={styles.loading} />
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderDoctorItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
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
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    searchButton: {
        backgroundColor: '#075eec',
        borderRadius: 5,
        padding: 15,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loading: {
        marginTop: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    doctorItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
        elevation: 2,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    doctorSpecialty: {
        color: '#777',
    },
});

export default SearchDoctors;