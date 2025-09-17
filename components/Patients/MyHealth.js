import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

const HEALTH_DATA = [
  { id: '5', title: 'Notifications', icon: 'notifications' },
  { id: '6', title: 'Quick Links', icon: 'link' },
  { id: '7', title: 'Lab Results', icon: 'flask' },
  { id: '8', title: 'Blood Group', icon: 'water' },
  { id: '9', title: 'Images & Documents', icon: 'documents' },
  { id: '10', title: 'Vitals', icon: 'pulse' },
];

const MyHealthItem = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Icon name={icon} size={24} color="#fff" />
    <Text style={styles.subtitle}>{title}</Text>
  </TouchableOpacity>
);

const MyHealth = ({ navigation }) => (
  <View style={styles.wrapper}>
    <FlatList
      data={HEALTH_DATA}
      renderItem={({ item }) => (
        <MyHealthItem
          title={item.title}
          icon={item.icon}
          onPress={() => {
            switch (item.id) {
              case '5':
                navigation.navigate('Notifications');
                break;
              case '6':
                navigation.navigate('QuickLinks');
                break;
              case '7':
                navigation.navigate('LabResults');
                break;
              case '8':
                navigation.navigate('BloodGroup');
                break;
              case '9':
                navigation.navigate('ImagesDocuments');
                break;
              case '10':
                navigation.navigate('Vitals');
                break;
              default:
                break;
            }
          }}
        />
      )}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    paddingTop: 20,
  },
  container: {
    paddingHorizontal: 16,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  item: {
    backgroundColor: '#075eec',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default MyHealth;
