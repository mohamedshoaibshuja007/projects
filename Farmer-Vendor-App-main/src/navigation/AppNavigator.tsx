import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InitialSelection from '../screens/auth/InitialSelection';
import FarmerLogin from '../screens/farmer/Login';
import FarmerSignUp from '../screens/farmer/Signup';
import FarmerForgotPassword from '../screens/farmer/ForgotPassword';
import VendorLogin from '../screens/vendor/Login';
import VendorSignup from '../screens/vendor/Signup';
import VendorForgotPassword from '../screens/vendor/ForgotPassword';
import FarmerNavigator from './FarmerNavigator';
import VendorNavigator from './VendorNavigator';
import FarmerChat from '../screens/farmer/Chat';
import VendorChat from '../screens/vendor/Chat';

export type RootStackParamList = {
  InitialSelection: undefined;
  FarmerLogin: undefined;
  FarmerSignUp: undefined;
  FarmerForgotPassword: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  VendorForgotPassword: undefined;
  FarmerNavigator: undefined;
  VendorNavigator: undefined;
  FarmerChat: { vendorId: string; vendorName: string };
  VendorChat: { farmerId: string; farmerName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="InitialSelection"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="InitialSelection" component={InitialSelection} />
      <Stack.Screen 
        name="FarmerLogin" 
        component={FarmerLogin}
        options={{ 
          headerShown: true,
          title: 'Farmer Login',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="FarmerSignUp" 
        component={FarmerSignUp}
        options={{ 
          headerShown: true,
          title: 'Create Farmer Account',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="FarmerForgotPassword" 
        component={FarmerForgotPassword}
        options={{ 
          headerShown: true,
          title: 'Reset Password',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="VendorLogin" 
        component={VendorLogin}
        options={{ 
          headerShown: true,
          title: 'Vendor Login',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="VendorSignup" 
        component={VendorSignup}
        options={{ 
          headerShown: true,
          title: 'Create Vendor Account',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="VendorForgotPassword" 
        component={VendorForgotPassword}
        options={{ 
          headerShown: true,
          title: 'Reset Password',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="FarmerChat" 
        component={FarmerChat}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.vendorName || 'Chat',
          headerBackTitle: 'Back'
        })}
      />
      <Stack.Screen 
        name="VendorChat" 
        component={VendorChat}
        options={{ 
          headerShown: true,
          title: 'Chat',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen name="FarmerNavigator" component={FarmerNavigator} />
      <Stack.Screen name="VendorNavigator" component={VendorNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
