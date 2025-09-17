import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
// Import UserProvider from one location
import { UserProvider } from './components/UserProvider'; // Keep this import

// Import your screens
// Patient Screens
import SplashScreen from './components/Patients/SplashScreen';
import Login from './components/Patients/Login';
import SignUp from './components/Patients/SignUp';
import ForgotPassword from './components/Patients/ForgotPassword';
import HomeScreen from './components/Patients/HomeScreen';
import Dashboard from './components/Patients/Dashboard';
import MyAccountScreen from './components/Patients/MyAccountScreen';
import AppointmentScreen from './components/Patients/AppointmentScreen';
import MyAppointmentsScreen from './components/Patients/MyAppointmentsScreen';
import EditAppointmentScreen from './components/Patients/EditAppointmentScreen';
import VideoConsultationScreen from './components/Patients/VideoConsultationScreen';
import MedicalRecordsScreen from './components/Patients/MedicalRecordsScreen';
import PaymentScreen from './components/Patients/PaymentScreen';
import DoctorDashboardScreen from './components/Patients/DoctorDashboardScreen';
import AdminPanelScreen from './components/Patients/AdminPanelScreen';
import ProfileManagementScreen from './components/Patients/ProfileManagementScreen';
import RecentConsultationScreen from './components/Patients/RecentConsultationScreen';
import BookAppointmentScreen from './components/Patients/BookAppointmentScreen';
import AboutUsScreen from './components/Patients/AboutUsScreen';
import ContactUsScreen from './components/Patients/ContactUsScreen';
import FindSpecialist from './components/Patients/FindSpecialist';
import MyHealth from './components/Patients/MyHealth';
import VaccinationScreen from './components/Patients/VaccinationScreen';
import ImmunizationScreen from './components/Patients/ImmunizationScreen';
import ChronicIllnessScreen from './components/Patients/ChronicIllnessScreen';
import HealthScreeningScreen from './components/Patients/HealthScreeningScreen';
import PharmacyScreen from './components/Patients/PharmacyScreen';
import InsuranceScreen from './components/Patients/InsuranceScreen';
import Notifications from './components/Patients/Notifications';
import QuickLinks from './components/Patients/QuickLinks';
import LabResults from './components/Patients/LabResults';
import BloodGroup from './components/Patients/BloodGroup';
import ImagesDocuments from './components/Patients/ImagesDocuments';
import Vitals from './components/Patients/Vitals';
import LabHomeScreen from './components/Patients/LabHomeScreen';
import LabTestCatalogScreen from './components/Patients/LabTestCatalogScreen';
import LabBookingScreen from './components/Patients/LabBookingScreen';
import LabResultsScreen from './components/Patients/LabResultsScreen';
import LabSupportScreen from './components/Patients/LabSupportScreen';
import SettingsScreen from './components/Patients/SettingsScreen';
// Doctors Screens
import ConsultationHistoryScreen from './components/Doctors/ConsultationHistoryScreen';
import DoctorsDashboardScreen from './components/Doctors/DoctorDashboardScreen';
import ManageAppointmentsScreen from './components/Doctors/ManageAppointmentsScreen';
import DrMedicalRecords from './components/Doctors/DrMedicalRecordsScreen';
import DrNotificationsScreen from './components/Doctors/DrNotificationsScreen';
import PatientDetailsScreen from './components/Doctors/PatientDetailsScreen';
import PatientListScreen from './components/Doctors/PatientListScreen';
import ScheduleAppointmentScreen from './components/Doctors/ScheduleAppointmentScreen';
import SwitchRoleScreen from './components/Doctors/SwitchRoleScreen';
// Administrators Screens
import AdminDashboardScreen from './components/Administrators/AdminDashboardScreen';
import AdminSettingsScreen from './components/Administrators/AdminSettingsScreen';
import AnalyticsReportsScreen from './components/Administrators/AnalyticsReportsScreen';
import ConsultationManagementScreen from './components/Administrators/ConsultationManagementScreen';
import ContentManagementScreen from './components/Administrators/ContentManagementScreen';
import DoctorManagementScreen from './components/Administrators/DoctorManagementScreen';
import FinanceManagementScreen from './components/Administrators/FinanceManagementScreen';
import PatientManagementScreen from './components/Administrators/PatientManagementScreen';
import RoleManagementScreen from './components/Administrators/RoleManagementScreen';
import SupportManagementScreen from './components/Administrators/SupportManagementScreen';
import SystemLogsScreen from './components/Administrators/SystemLogsScreen';
import UserManagementScreen from './components/Administrators/UserManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Account':
              iconName = 'account-circle';
              break;
            default:
              iconName = 'home';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Account" component={AccountStackNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyHome" component={HomeScreen} />
      <Stack.Screen name="AppointmentScreen" component={AppointmentScreen} />
      <Stack.Screen name="VideoConsultationScreen" component={VideoConsultationScreen} />
      <Stack.Screen name="MedicalRecords" component={MedicalRecordsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
      <Stack.Screen name="EditAppointmentScreen" component={EditAppointmentScreen} />
      <Stack.Screen name="BookAppointmentScreen" component={BookAppointmentScreen} />
      <Stack.Screen name="RecentConsultations" component={RecentConsultationScreen} />
      <Stack.Screen name="FindSpecialist" component={FindSpecialist} />
      <Stack.Screen name="MyHealth" component={MyHealth} />
      <Stack.Screen name="Vaccination" component={VaccinationScreen} />
      <Stack.Screen name="Immunization" component={ImmunizationScreen} />
      <Stack.Screen name="ChronicIllness" component={ChronicIllnessScreen} />
      <Stack.Screen name="HealthScreening" component={HealthScreeningScreen} />
      <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
      <Stack.Screen name="Insurance" component={InsuranceScreen} />
      <Stack.Screen name="LabHome" component={LabHomeScreen} />
      <Stack.Screen name="LabTestCatalog" component={LabTestCatalogScreen} />
      <Stack.Screen name="LabBooking" component={LabBookingScreen} />
      <Stack.Screen name="LabResults" component={LabResultsScreen} />
      <Stack.Screen name="LabSupport" component={LabSupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
      <Stack.Screen name="QuickLinks" component={QuickLinks} options={{ title: 'Quick Links' }} />
      <Stack.Screen name="Lab_Results" component={LabResults} options={{ title: 'Lab Results' }} />
      <Stack.Screen name="BloodGroup" component={BloodGroup} options={{ title: 'Blood Group' }} />
      <Stack.Screen name="ImagesDocuments" component={ImagesDocuments} options={{ title: 'Images & Documents' }} />
      <Stack.Screen name="Vitals" component={Vitals} options={{ title: 'Vitals' }} />
    </Stack.Navigator>
  );
}

// Dashboard Stack Navigator
function DashboardStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyDashboard" component={Dashboard} />
      <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <Stack.Screen name="ProfileManagement" component={ProfileManagementScreen} />
    </Stack.Navigator>
  );
}

// Account Stack Navigator
function AccountStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyAccount" component={MyAccountScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    </Stack.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          {/* Add other screens as needed */}
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}