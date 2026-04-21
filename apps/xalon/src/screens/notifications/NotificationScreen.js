import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { colors } from '../../theme/colors';

const NotificationScreen = ({ navigation }) => {
    const { notifications, loading, fetchNotifications, markAsRead, clearAll } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
            onPress={() => {
                if (!item.isRead) markAsRead(item.id);
                // Navigate based on metadata if applicable
                const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                if (metadata?.bookingId) {
                    navigation.navigate('MyBookings'); // Or a specific booking detail screen
                }
            }}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={getIconName(item.type)}
                    size={24}
                    color={!item.isRead ? colors.primary : '#888'}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    const getIconName = (type) => {
        switch (type) {
            case 'Booking': return 'event-available';
            case 'Reminder': return 'notifications-active';
            case 'ReviewRequest': return 'rate-review';
            case 'Promo': return 'local-offer';
            default: return 'notifications';
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={clearAll}>
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && notifications.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="notifications-none" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    clearBtn: {
        color: colors.primary,
        fontWeight: '600',
    },
    list: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: '#f0f7ff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000',
    },
    body: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 12,
        color: '#999',
        fontSize: 16,
    },
});

export default NotificationScreen;
