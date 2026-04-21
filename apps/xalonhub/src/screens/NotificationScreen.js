import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/colors';

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
                // Navigate based on metadata
                const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                if (metadata?.bookingId) {
                    navigation.navigate('BookingList');
                }
            }}
        >
            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: !item.isRead ? colors.primary + '15' : '#f5f5f5' }]}>
                    <MaterialIcons
                        name={getIconName(item.type)}
                        size={22}
                        color={!item.isRead ? colors.primary : '#888'}
                    />
                </View>
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    const getIconName = (type) => {
        switch (type) {
            case 'Booking': return 'event-note';
            case 'Reminder': return 'alarm';
            case 'ReviewRequest': return 'star-outline';
            case 'System': return 'settings-suggest';
            default: return 'notifications-none';
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Updates & Alerts</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={clearAll}>
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && notifications.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Fetching updates...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <MaterialIcons name="notifications-off" size={48} color="#e0e0e0" />
                            </View>
                            <Text style={styles.emptyTitle}>You're all caught up!</Text>
                            <Text style={styles.emptySub}>New notifications will appear here.</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
        flex: 1,
    },
    clearBtn: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    list: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
    },
    unreadItem: {
        backgroundColor: colors.primary + '03',
    },
    iconContainer: {
        marginRight: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        flex: 1,
    },
    unreadText: {
        color: '#000',
        fontWeight: '800',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    body: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#bbb',
        marginTop: 8,
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 120,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default NotificationScreen;
