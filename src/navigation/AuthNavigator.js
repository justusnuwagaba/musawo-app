import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AUTH_ROUTES } from './routes';
import SplashScreen from '../screens/auth/SplashScreen';
import Login from '../screens/auth/Login';
import SignUp from '../screens/auth/SignUp';
import ForgotPassword from '../screens/auth/ForgotPassword';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName={AUTH_ROUTES.SPLASH} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_ROUTES.SPLASH} component={SplashScreen} />
      <Stack.Screen name={AUTH_ROUTES.LOGIN} component={Login} />
      <Stack.Screen name={AUTH_ROUTES.SIGNUP} component={SignUp} />
      <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
    </Stack.Navigator>
  );
}
