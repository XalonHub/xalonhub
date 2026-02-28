import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Stacks
import HomeStack from './HomeStack';
import BookingsStack from './BookingsStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: 'home',
    Bookings: 'calendar-today',
    Profile: 'person',
};

export default function BottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray,
                tabBarLabelStyle: styles.label,
                tabBarIcon: ({ color, focused }) => (
                    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                        <MaterialIcons name={TAB_ICONS[route.name]} size={24} color={color} />
                    </View>
                ),
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Bookings" component={BookingsStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.grayBorder,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    iconWrap: {
        width: 40,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapActive: {
        backgroundColor: colors.primaryLight,
    },
});
