import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Button,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';

const specialists = [
  // Sample data for specialists
  {
    id: '1',
    name: 'Dr. John Doe',
    specialization: 'Cardiologist',
    language: 'English',
    location: { latitude: 37.78825, longitude: -122.4324 },
    distance: '2 miles',
    rating: 4.5,
    availability: 'Available',
    reviews: ['Excellent doctor', 'Very professional'],
    schedule: ['10:00 AM', '2:00 PM', '4:00 PM'],
  },
  {
    id: '2',
    name: 'Dr. Jane Smith',
    specialization: 'Dermatologist',
    language: 'Spanish',
    location: { latitude: 37.78925, longitude: -122.4334 },
    distance: '5 miles',
    rating: 4.0,
    availability: 'Unavailable',
    reviews: ['Very helpful', 'Great experience'],
    schedule: ['9:00 AM', '1:00 PM', '3:00 PM'],
  },
  // Add more specialists as needed
];

const FindSpecialist = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filteredSpecialists, setFilteredSpecialists] = useState(specialists);
  const [viewMap, setViewMap] = useState(false);
  const [sortOption, setSortOption] = useState('distance');

  const handleSearch = () => {
    // Implement search logic here
    const filtered = specialists.filter(
      (specialist) =>
        specialist.name.toLowerCase().includes(search.toLowerCase()) ||
        specialist.specialization.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredSpecialists(filtered);
  };

  const handleSort = (option) => {
    const sorted = [...filteredSpecialists].sort((a, b) => {
      if (option === 'distance') {
        return parseFloat(a.distance) - parseFloat(b.distance);
      } else if (option === 'rating') {
        return b.rating - a.rating;
      }
    });
    setFilteredSpecialists(sorted);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a specialist"
        value={search}
        onChangeText={(text) => setSearch(text)}
        onSubmitEditing={handleSearch}
      />
      <View style={styles.filterContainer}>
        <Button
          title={viewMap ? 'List View' : 'Map View'}
          onPress={() => setViewMap(!viewMap)}
        />
        <Picker
          selectedValue={sortOption}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setSortOption(itemValue);
            handleSort(itemValue);
          }}>
          <Picker.Item label="Sort by Distance" value="distance" />
          <Picker.Item label="Sort by Rating" value="rating" />
        </Picker>
      </View>
      {viewMap ? (
        <MapView style={styles.map}>
          {filteredSpecialists.map((specialist) => (
            <Marker
              key={specialist.id}
              coordinate={specialist.location}
              title={specialist.name}
              description={specialist.specialization}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={filteredSpecialists}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('SpecialistDetails', { specialist: item })
              }>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.details}>
                {item.specialization} - {item.language}
              </Text>
              <Text style={styles.details}>Distance: {item.distance}</Text>
              <Text style={styles.details}>Rating: {item.rating}</Text>
              <Text style={styles.availability}>{item.availability}</Text>
              <Text style={styles.reviews}>
                Reviews: {item.reviews.join(', ')}
              </Text>
              <Text style={styles.schedule}>
                Schedule: {item.schedule.join(', ')}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: 150,
  },
  map: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
  availability: {
    fontSize: 14,
    color: 'green',
  },
  reviews: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  schedule: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
});

export default FindSpecialist;
