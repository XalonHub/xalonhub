import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = ({ navigation, color = '#000' }) => {
    const { unreadCount } = useNotifications();

    return (
        <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            style={styles.container}
        >
            <MaterialIcons name="notifications-none" size={28} color={color} />
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
        padding: 4,
        marginRight: 8,
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default NotificationBell;
