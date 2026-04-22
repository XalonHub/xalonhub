import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';

// Auth screens
import SplashScreen from '../screens/SplashScreen';
import LanguageScreen from '../screens/LanguageScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';

// Main tabs
import BottomTabNavigator from './BottomTabNavigator';

// Profile screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyGuestsScreen from '../screens/profile/MyGuestsScreen';
import AddEditGuestScreen from '../screens/profile/AddEditGuestScreen';

// Booking flow (modal stack on top of tabs)
import BookingDateTimeScreen from '../screens/booking/BookingDateTimeScreen';
import BookingConfirmScreen from '../screens/booking/BookingConfirmScreen';
import ProviderAssignedScreen from '../screens/booking/ProviderAssignedScreen';
import BookingSuccessScreen from '../screens/booking/BookingSuccessScreen';
import CompleteProfileScreen from '../screens/booking/CompleteProfileScreen';
import AddressListScreen from '../screens/profile/AddressListScreen';
import EditAddressScreen from '../screens/profile/EditAddressScreen';
import PaytmPage from '../screens/booking/PaytmPage';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Always-visible entry screens */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />

            {/* Main app — accessible to all (guest & logged-in) */}
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

            {/* Auth screens — navigated to from Profile or booking flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />

            {/* Profile screens */}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MyGuests" component={MyGuestsScreen} />
            <Stack.Screen name="AddEditGuest" component={AddEditGuestScreen} />

            {/* Booking flow modals */}
            <Stack.Screen
                name="BookingDateTime"
                component={BookingDateTimeScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="BookingConfirm"
                component={BookingConfirmScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="ProviderAssigned"
                component={ProviderAssignedScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="BookingSuccess"
                component={BookingSuccessScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="CompleteProfile"
                component={CompleteProfileScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="EditAddress"
                component={EditAddressScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="AddressList"
                component={AddressListScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="PaytmPage"
                component={PaytmPage}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        </Stack.Navigator>
    );
}
