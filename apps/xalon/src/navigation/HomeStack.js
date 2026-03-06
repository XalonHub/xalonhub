import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ServiceListScreen from '../screens/booking/ServiceListScreen';
import SalonListScreen from '../screens/salons/SalonListScreen';
import SalonDetailsScreen from '../screens/salons/SalonDetailsScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="ServiceList" component={ServiceListScreen} />
            <Stack.Screen name="SalonList" component={SalonListScreen} />
            <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
        </Stack.Navigator>
    );
}
