// AdminDashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const AdminDashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text>Overview of User Registrations: 150</Text>
      <Text>Consultations Today: 75</Text>
      <Text>Pending Approvals: 5</Text>
      <Button title="Manage Users" onPress={() => navigation.navigate('UserManagement')} />
      <Button title="Consultation Management" onPress={() => navigation.navigate('ConsultationManagement')} />
      <Button title="Content Management" onPress={() => navigation.navigate('ContentManagement')} />
      <Button title="Finance Management" onPress={() => navigation.navigate('FinanceManagement')} />
      <Button title="Support Management" onPress={() => navigation.navigate('SupportManagement')} />
      <Button title="Analytics and Reports" onPress={() => navigation.navigate('AnalyticsReports')} />
      <Button title="Role Management" onPress={() => navigation.navigate('RoleManagement')} />
      <Button title="System Logs" onPress={() => navigation.navigate('SystemLogs')} />
      <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AdminDashboardScreen;