import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { PATIENT_ROUTES } from './routes';
import { useBaseTabScreenOptions, headerScreenOptions, tabIcon } from './tabBarOptions';

import HomeScreen from '../screens/patient/HomeScreen';
import FindDoctorScreen from '../screens/patient/FindDoctorScreen';
import DoctorProfileScreen from '../screens/patient/DoctorProfileScreen';
import BookAppointmentScreen from '../screens/patient/BookAppointmentScreen';
import VideoConsultationScreen from '../screens/patient/VideoConsultationScreen';
import MyAppointmentsScreen from '../screens/patient/MyAppointmentsScreen';
import EditAppointmentScreen from '../screens/patient/EditAppointmentScreen';
import RateAppointmentScreen from '../screens/patient/RateAppointmentScreen';
import MyAccountScreen from '../screens/patient/MyAccountScreen';
import FavoriteDoctorsScreen from '../screens/patient/FavoriteDoctorsScreen';
import DoctorApplicationScreen from '../screens/doctor/DoctorApplicationScreen';
import SettingsScreen from '../screens/patient/SettingsScreen';
import MyHealth from '../screens/patient/MyHealth';
import MedicalRecordsScreen from '../screens/patient/MedicalRecordsScreen';
import HealthTimelineScreen from '../screens/patient/HealthTimelineScreen';
import LabResultsScreen from '../screens/patient/LabResultsScreen';
import BloodGroup from '../screens/patient/BloodGroup';
import PaymentScreen from '../screens/patient/PaymentScreen';
import AboutUsScreen from '../screens/patient/AboutUsScreen';
import ContactUsScreen from '../screens/patient/ContactUsScreen';
import ChronicHome from '../screens/patient/ChronicHome';
import InsuranceHome from '../screens/patient/InsuranceHome';
import PharmacyHome from '../screens/patient/PharmacyHome';
import ScreeningHome from '../screens/patient/ScreeningHome';
import VaccinationHome from '../screens/patient/VaccinationHome';
import LabHomeScreen from '../screens/patient/LabHomeScreen';
import ServiceBookingScreen from '../screens/patient/ServiceBookingScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export function HomeStack() {
  return (
    <Stack.Navigator initialRouteName={PATIENT_ROUTES.HOME} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PATIENT_ROUTES.HOME} component={HomeScreen} />
    </Stack.Navigator>
  );
}

export function FindDoctorStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator initialRouteName={PATIENT_ROUTES.FIND_DOCTOR} screenOptions={{ ...headerScreenOptions, headerShown: false }}>
      <Stack.Screen name={PATIENT_ROUTES.FIND_DOCTOR} component={FindDoctorScreen} />
      <Stack.Screen name={PATIENT_ROUTES.DOCTOR_PROFILE} component={DoctorProfileScreen} options={{ headerShown: true, title: '' }} />
      <Stack.Screen name={PATIENT_ROUTES.BOOK_APPOINTMENT} component={BookAppointmentScreen} options={{ headerShown: true, title: t('doctorProfile.bookAppointment') }} />
      <Stack.Screen name={PATIENT_ROUTES.VIDEO_CONSULTATION} component={VideoConsultationScreen} />
    </Stack.Navigator>
  );
}

export function AppointmentsStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator initialRouteName={PATIENT_ROUTES.MY_APPOINTMENTS} screenOptions={{ ...headerScreenOptions, headerShown: true }}>
      <Stack.Screen name={PATIENT_ROUTES.MY_APPOINTMENTS} component={MyAppointmentsScreen} options={{ title: t('appointments.myAppointments') }} />
      <Stack.Screen name={PATIENT_ROUTES.EDIT_APPOINTMENT} component={EditAppointmentScreen} options={{ title: t('appointments.reschedule') }} />
      <Stack.Screen name={PATIENT_ROUTES.RATE_APPOINTMENT} component={RateAppointmentScreen} options={{ title: t('rateAppointment.title') }} />
      <Stack.Screen name={PATIENT_ROUTES.VIDEO_CONSULTATION} component={VideoConsultationScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export function ChatsStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator initialRouteName={PATIENT_ROUTES.CHAT_LIST} screenOptions={{ ...headerScreenOptions, headerShown: true }}>
      <Stack.Screen name={PATIENT_ROUTES.CHAT_LIST} component={ChatListScreen} options={{ title: t('chat.chats') }} />
      <Stack.Screen name={PATIENT_ROUTES.CHAT} component={ChatScreen} />
    </Stack.Navigator>
  );
}

export function AccountStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator initialRouteName={PATIENT_ROUTES.ACCOUNT} screenOptions={{ ...headerScreenOptions, headerShown: true }}>
      <Stack.Screen name={PATIENT_ROUTES.ACCOUNT} component={MyAccountScreen} options={{ headerShown: false }} />
      <Stack.Screen name={PATIENT_ROUTES.DOCTOR_APPLICATION} component={DoctorApplicationScreen} options={{ title: 'Become a Doctor' }} />
      <Stack.Screen name={PATIENT_ROUTES.NOTIFICATIONS} component={NotificationsScreen} options={{ title: t('account.notifications') }} />
      <Stack.Screen name={PATIENT_ROUTES.SETTINGS} component={SettingsScreen} options={{ title: t('account.settings') }} />
      <Stack.Screen name={PATIENT_ROUTES.MY_HEALTH} component={MyHealth} options={{ title: t('account.myHealth') }} />
      <Stack.Screen name={PATIENT_ROUTES.MEDICAL_RECORDS} component={MedicalRecordsScreen} options={{ title: t('account.medicalRecords') }} />
      <Stack.Screen name={PATIENT_ROUTES.HEALTH_TIMELINE} component={HealthTimelineScreen} options={{ title: 'Health Timeline' }} />
      <Stack.Screen name={PATIENT_ROUTES.FAVORITE_DOCTORS} component={FavoriteDoctorsScreen} options={{ title: t('account.favoriteDoctors') }} />
      <Stack.Screen name={PATIENT_ROUTES.LAB_RESULTS} component={LabResultsScreen} options={{ title: 'Lab Results' }} />
      <Stack.Screen name={PATIENT_ROUTES.BLOOD_GROUP} component={BloodGroup} options={{ title: 'Blood Group' }} />
      <Stack.Screen name={PATIENT_ROUTES.PAYMENT} component={PaymentScreen} options={{ title: t('account.payments') }} />
      <Stack.Screen name={PATIENT_ROUTES.ABOUT_US} component={AboutUsScreen} options={{ title: 'About Us' }} />
      <Stack.Screen name={PATIENT_ROUTES.CONTACT_US} component={ContactUsScreen} options={{ title: 'Contact Us' }} />
      <Stack.Screen name={PATIENT_ROUTES.CHRONIC_HOME} component={ChronicHome} options={{ title: 'Chronic Illness' }} />
      <Stack.Screen name={PATIENT_ROUTES.INSURANCE_HOME} component={InsuranceHome} options={{ title: 'Insurance' }} />
      <Stack.Screen name={PATIENT_ROUTES.PHARMACY_HOME} component={PharmacyHome} options={{ title: 'Pharmacy' }} />
      <Stack.Screen name={PATIENT_ROUTES.SCREENING_HOME} component={ScreeningHome} options={{ title: 'Health Screening' }} />
      <Stack.Screen name={PATIENT_ROUTES.VACCINATION_HOME} component={VaccinationHome} options={{ title: 'Vaccination' }} />
      <Stack.Screen name={PATIENT_ROUTES.LAB_HOME} component={LabHomeScreen} options={{ title: 'Lab' }} />
      <Stack.Screen
        name={PATIENT_ROUTES.SERVICE_BOOKING}
        component={ServiceBookingScreen}
        options={({ route }) => ({ title: route.params?.categoryLabel ? `Request ${route.params.categoryLabel}` : 'Request Service' })}
      />
    </Stack.Navigator>
  );
}

export default function PatientNavigator() {
  const { t } = useTranslation();
  const screenOptions = useBaseTabScreenOptions();
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name={PATIENT_ROUTES.HOME_TAB} component={HomeStack} options={{ title: t('tabs.home'), ...tabIcon('home') }} />
      <Tab.Screen name={PATIENT_ROUTES.FIND_DOCTOR_TAB} component={FindDoctorStack} options={{ title: t('tabs.findDoctor'), ...tabIcon('search') }} />
      <Tab.Screen name={PATIENT_ROUTES.APPOINTMENTS_TAB} component={AppointmentsStack} options={{ title: t('tabs.appointments'), ...tabIcon('calendar') }} />
      <Tab.Screen name={PATIENT_ROUTES.CHATS_TAB} component={ChatsStack} options={{ title: t('chat.chats'), ...tabIcon('chatbubble-ellipses') }} />
      <Tab.Screen
        name={PATIENT_ROUTES.ACCOUNT_TAB}
        component={AccountStack}
        options={{ title: t('tabs.account'), ...tabIcon('person') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Home's service tiles (Vaccination/Pharmacy/etc.) navigate
            // straight into this tab's nested stack, so tapping the tab bar
            // icon afterwards would otherwise resume on whichever of those
            // screens was last visited instead of the account menu itself —
            // reset to the root screen every time the tab is pressed.
            e.preventDefault();
            navigation.navigate(PATIENT_ROUTES.ACCOUNT_TAB, { screen: PATIENT_ROUTES.ACCOUNT });
          },
        })}
      />
    </Tab.Navigator>
  );
}
