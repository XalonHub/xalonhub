import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomBottomTab = ({ activeTab, onTabPress }) => {
    const tabs = [
        { id: 'Dashboard', label: 'Dashboard', icon: 'grid', screen: 'Dashboard' },
        { id: 'Marketing', label: 'Marketing', icon: 'megaphone', screen: 'Marketing' },
        { id: 'Booking', label: 'Booking', icon: 'calendar', screen: 'BookingList' },
        { id: 'Shop', label: 'Shop', icon: 'cart', screen: 'Shop' },
        { id: 'Profile', label: 'Profile', icon: 'person', screen: 'Profile' },
    ];

    return (
        <View style={styles.tabBar}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={styles.tabItem}
                    onPress={() => onTabPress(tab.id, tab.screen)}
                >
                    <Ionicons
                        name={tab.icon}
                        size={24}
                        color={activeTab === tab.id ? '#000' : '#94A3B8'}
                    />
                    <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#000',
        fontWeight: '700',
    },
});

export default CustomBottomTab;
