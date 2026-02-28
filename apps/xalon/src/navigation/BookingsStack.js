import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookingsScreen from '../screens/bookings/BookingsScreen';

const Stack = createNativeStackNavigator();

export default function BookingsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BookingsMain" component={BookingsScreen} />
        </Stack.Navigator>
    );
}
