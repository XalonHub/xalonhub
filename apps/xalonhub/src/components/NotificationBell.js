import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/colors';

const NotificationBell = ({ navigation, color = '#000' }) => {
    const { unreadCount } = useNotifications();

    return (
        <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            style={styles.container}
            activeOpacity={0.7}
        >
            <View style={styles.iconCircle}>
                <MaterialIcons name="notifications-none" size={24} color={color} />
            </View>
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 5,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        right: 4,
        top: 4,
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
});

export default NotificationBell;
