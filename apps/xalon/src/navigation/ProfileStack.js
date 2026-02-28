import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditAddressScreen from '../screens/profile/EditAddressScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="EditAddress" component={EditAddressScreen} />
            {/* Auth screens accessible from Profile */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
        </Stack.Navigator>
    );
}
