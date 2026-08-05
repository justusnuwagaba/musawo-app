import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DOCTOR_ROUTES } from './routes';
import { useBaseTabScreenOptions, headerScreenOptions, tabIcon } from './tabBarOptions';

import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import PatientListScreen from '../screens/doctor/PatientListScreen';
import ManageAppointmentsScreen from '../screens/doctor/ManageAppointmentsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ConsultationHistoryScreen from '../screens/doctor/ConsultationHistoryScreen';
import ScheduleAppointmentScreen from '../screens/doctor/ScheduleAppointmentScreen';
import PatientDetailsScreen from '../screens/doctor/PatientDetailsScreen';
import DrMedicalRecordsScreen from '../screens/doctor/DrMedicalRecordsScreen';
import VideoConsultationScreen from '../screens/patient/VideoConsultationScreen';
import MyAccountScreen from '../screens/patient/MyAccountScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import ChatScreen from '../screens/shared/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// NOTE: existing (pre-redesign) doctor screens wired in as-is — restyled and
// extended (verification application etc.) in Phase 4.

function ChatsStack() {
  return (
    <Stack.Navigator initialRouteName={DOCTOR_ROUTES.CHAT_LIST} screenOptions={{ ...headerScreenOptions, headerShown: true }}>
      <Stack.Screen name={DOCTOR_ROUTES.CHAT_LIST} component={ChatListScreen} options={{ title: 'Chats' }} />
      <Stack.Screen name={DOCTOR_ROUTES.CHAT} component={ChatScreen} />
    </Stack.Navigator>
  );
}

function DoctorTabs() {
  const screenOptions = useBaseTabScreenOptions();
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name={DOCTOR_ROUTES.DASHBOARD_TAB} component={DoctorDashboardScreen} options={{ title: 'Dashboard', ...tabIcon('speedometer') }} />
      <Tab.Screen name={DOCTOR_ROUTES.APPOINTMENTS_TAB} component={ManageAppointmentsScreen} options={{ title: 'Appointments', ...tabIcon('calendar') }} />
      <Tab.Screen name={DOCTOR_ROUTES.CHATS_TAB} component={ChatsStack} options={{ title: 'Chats', ...tabIcon('chatbubble-ellipses') }} />
      <Tab.Screen name={DOCTOR_ROUTES.NOTIFICATIONS_TAB} component={NotificationsScreen} options={{ title: 'Alerts', ...tabIcon('notifications') }} />
      <Tab.Screen name={DOCTOR_ROUTES.ACCOUNT_TAB} component={MyAccountScreen} options={{ title: 'Account', ...tabIcon('person') }} />
    </Tab.Navigator>
  );
}

export default function DoctorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ ...headerScreenOptions, headerShown: true }}>
      <Stack.Screen name={DOCTOR_ROUTES.TABS} component={DoctorTabs} options={{ headerShown: false }} />
      <Stack.Screen name={DOCTOR_ROUTES.PATIENT_LIST} component={PatientListScreen} options={{ title: 'My Patients' }} />
      <Stack.Screen name={DOCTOR_ROUTES.PATIENT_DETAILS} component={PatientDetailsScreen} options={{ title: 'Patient Record' }} />
      <Stack.Screen name={DOCTOR_ROUTES.VIDEO_CONSULTATION} component={VideoConsultationScreen} options={{ headerShown: false }} />
      <Stack.Screen name={DOCTOR_ROUTES.SCHEDULE_APPOINTMENT} component={ScheduleAppointmentScreen} options={{ title: 'Schedule New' }} />
      <Stack.Screen name={DOCTOR_ROUTES.MEDICAL_RECORDS} component={DrMedicalRecordsScreen} options={{ title: 'Medical Records' }} />
      <Stack.Screen name={DOCTOR_ROUTES.CONSULTATION_HISTORY} component={ConsultationHistoryScreen} options={{ title: 'Consultation History' }} />
    </Stack.Navigator>
  );
}
