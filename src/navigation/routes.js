// Centralized route-name constants. Each role tree (Patient/Doctor/Admin) is
// its own isolated navigator component, so plain names are safe here — the
// old App.js prefixed every route with Pat_/Dr_/Adm_ only because all three
// tab navigators used to be siblings sharing one global route namespace.

export const AUTH_ROUTES = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  SIGNUP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',
};

export const PATIENT_ROUTES = {
  HOME_TAB: 'HomeTab',
  FIND_DOCTOR_TAB: 'FindDoctorTab',
  APPOINTMENTS_TAB: 'AppointmentsTab',
  CHATS_TAB: 'ChatsTab',
  ACCOUNT_TAB: 'AccountTab',

  HOME: 'PatientHome',

  FIND_DOCTOR: 'FindDoctor',
  DOCTOR_PROFILE: 'DoctorProfile',
  BOOK_APPOINTMENT: 'BookAppointment',
  VIDEO_CONSULTATION: 'VideoConsultation',

  MY_APPOINTMENTS: 'MyAppointments',
  EDIT_APPOINTMENT: 'EditAppointment',
  RATE_APPOINTMENT: 'RateAppointment',

  CHAT_LIST: 'ChatList',
  CHAT: 'Chat',

  ACCOUNT: 'MyAccount',
  FAVORITE_DOCTORS: 'FavoriteDoctors',
  DOCTOR_APPLICATION: 'DoctorApplication',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
  MY_HEALTH: 'MyHealth',
  MEDICAL_RECORDS: 'MedicalRecords',
  HEALTH_TIMELINE: 'HealthTimeline',
  LAB_RESULTS: 'LabResults',
  BLOOD_GROUP: 'BloodGroup',
  PAYMENT: 'Payment',
  ABOUT_US: 'AboutUs',
  CONTACT_US: 'ContactUs',
  CHRONIC_HOME: 'ChronicHome',
  INSURANCE_HOME: 'InsuranceHome',
  PHARMACY_HOME: 'PharmacyHome',
  SCREENING_HOME: 'ScreeningHome',
  VACCINATION_HOME: 'VaccinationHome',
  LAB_HOME: 'LabHome',
  SERVICE_BOOKING: 'ServiceBooking',
};

export const DOCTOR_ROUTES = {
  TABS: 'DoctorTabs',
  DASHBOARD_TAB: 'DashboardTab',
  APPOINTMENTS_TAB: 'AppointmentsTab',
  NOTIFICATIONS_TAB: 'NotificationsTab',
  CHATS_TAB: 'ChatsTab',
  ACCOUNT_TAB: 'AccountTab',

  PATIENT_LIST: 'PatientList',
  PATIENT_DETAILS: 'PatientDetails',
  VIDEO_CONSULTATION: 'DoctorVideoConsultation',
  SCHEDULE_APPOINTMENT: 'ScheduleAppointment',
  MEDICAL_RECORDS: 'MedicalRecords',
  CONSULTATION_HISTORY: 'ConsultationHistory',

  CHAT_LIST: 'ChatList',
  CHAT: 'Chat',
};

export const ADMIN_ROUTES = {
  HOME_TAB: 'HomeTab',
  APPOINTMENTS_TAB: 'AppointmentsTab',
  PANEL_TAB: 'PanelTab',
  ACCOUNT_TAB: 'AccountTab',
};

export const ROOT_ROUTES = {
  AUTH: 'Auth',
  PATIENT: 'PatientApp',
  DOCTOR: 'DoctorApp',
  DOCTOR_PENDING: 'DoctorPending',
  ADMIN: 'AdminApp',
};
