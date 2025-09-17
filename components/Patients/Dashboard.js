import React from 'react'; 
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native'; 
import Icon from '@expo/vector-icons/Ionicons'; 
const DATA = [ 
  { id: '1', title: 'Appointments', icon: 'calendar' }, 
  { id: '2', title: 'Recent Consultations', icon: 'time' }, 
  { id: '3', title: 'My Health', icon: 'heart' }, 
  { id: '4', title: 'My Account', icon: 'person' }, 
  { id: '5', title: 'Find a specialist', icon: 'search' }, 
  { id: '6', title: 'Lab', icon: 'flask' }, 
  { id: '7', title: 'Payments', icon: 'cash' }, 
]; 
const DashboardItem = ({ title, icon, onPress }) => ( 
  <TouchableOpacity style={styles.item} onPress={onPress}> 
    <Icon name={icon} size={30} color="#fff" /> 
    <Text style={styles.title}>{title}</Text> 
  </TouchableOpacity> 
); 
const Dashboard = ({ navigation }) => ( 
  <View style={styles.container}> 
    <FlatList 
      data={DATA} 
      renderItem={({ item }) => ( 
        <DashboardItem 
          title={item.title} 
          icon={item.icon} 
          onPress={() => { 
            if (item.title === 'Appointments') { 
              navigation.navigate('AppointmentScreen'); 
            } else if (item.title === 'Recent Consultations') { 
              navigation.navigate('RecentConsultations'); 
            } else if (item.title === 'My Account') { 
              navigation.navigate('Account'); 
            } else if (item.title === 'My Health') { 
              navigation.navigate('MyHealth'); 
            } else if (item.title === 'Find a specialist') { 
              navigation.navigate('VideoConsultationScreen'); 
            } else if (item.title === 'Lab') { 
              navigation.navigate('LabHome');  
            } else if (item.title === 'Payments') { 
              navigation.navigate('Payment');  
            } 
          }} 
        /> 
      )} 
      keyExtractor={(item) => item.id} 
      numColumns={2} 
      columnWrapperStyle={styles.row} 
      contentContainerStyle={styles.contentContainer} 
    /> 
  </View> 
); 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#e8ecf4', 
    paddingHorizontal: 16, 
    paddingTop: 20, 
  }, 
  contentContainer: { 
    paddingBottom: 20, 
  }, 
  row: { 
    flex: 1, 
    justifyContent: 'space-between', 
    marginBottom: 16, 
  }, 
  item: { 
    backgroundColor: '#075eec', 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    margin: 10, 
    borderRadius: 10, 
  }, 
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff', 
    textAlign: 'center', 
    marginTop: 10, 
  }, 
}); 
export default Dashboard;