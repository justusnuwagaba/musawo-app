import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';

const IMAGES_DATA = [
  { id: '1', uri: 'https://example.com/image1.jpg' },
  { id: '2', uri: 'https://example.com/image2.jpg' },
];

 const ImagesDocuments = () => (
 <View style={styles.wrapper}>
    <Text style={styles.title}>Images & Documents</Text>
    <FlatList
      data={IMAGES_DATA}
      renderItem={({ item }) => (
        <Image source={{ uri: item.uri }} style={styles.image} />
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.container}
    />
  </View> 
); 
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  container: {
    paddingBottom: 20,
  },
  image: {
    width: '48%',
    height: 150,
    borderRadius: 10,
    margin: '1%',
  },
});

export default ImagesDocuments;
