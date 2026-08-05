import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ADMIN_ROUTES } from './routes';
import { useBaseTabScreenOptions, tabIcon } from './tabBarOptions';
import { AccountStack } from './PatientNavigator';
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  const screenOptions = useBaseTabScreenOptions();
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name={ADMIN_ROUTES.PANEL_TAB} component={AdminPanelScreen} options={{ title: 'Admin', ...tabIcon('shield-checkmark') }} />
      <Tab.Screen name={ADMIN_ROUTES.ACCOUNT_TAB} component={AccountStack} options={{ title: 'Account', ...tabIcon('person') }} />
    </Tab.Navigator>
  );
}
