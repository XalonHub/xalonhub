import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookings } from '../services/api';
import CustomBottomTab from '../components/CustomBottomTab';

const STATUS_CONFIG = {
    Requested: { label: 'Requested', color: '#F59E0B', bg: '#FEF9C3', icon: 'time-outline' },
    Confirmed: { label: 'Confirmed', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
    Completed: { label: 'Completed', color: '#6366F1', bg: '#EEF2FF', icon: 'checkmark-done-circle-outline' },
    Cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

function BookingItem({ item, navigation }) {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.Requested;
    const dateStr = new Date(item.bookingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const customerName = item.customer?.name || item.guestName || item.client?.name || 'Customer';
    
    // Financial Breakdown
    const platformFee = item.platformFee || 0; // Fee paid by customer
    const totalAmount = item.totalAmount || 0; // Total customer paid (Subtotal + PlatformFee)
    const serviceValue = totalAmount - platformFee;
    const partnerEarnings = item.partnerEarnings ?? serviceValue;
    const commission = serviceValue - partnerEarnings;

    return (
        <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.bookingId}>ID: {item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{dateStr}</Text>
                    <View style={styles.verticalDivider} />
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{item.timeSlot || 'Anytime'}</Text>
                </View>

                <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Ionicons name="cut-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText} numberOfLines={1}>
                        {item.services?.[0]?.serviceName || 'Service'}
                        {item.services?.length > 1 ? ` +${item.services.length - 1} more` : ''}
                    </Text>
                </View>

                <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Ionicons name={item.serviceMode === 'AtSalon' ? 'walk-outline' : 'home-outline'} size={16} color="#64748B" />
                    <Text style={styles.detailText}>{item.serviceMode === 'AtSalon' ? 'At Salon' : 'At Home'}</Text>
                </View>
            </View>

            <View style={styles.financialBreakdown}>
                <View style={styles.financeRow}>
                    <Text style={styles.financeLabel}>Service Value</Text>
                    <Text style={styles.financeValue}>₹{serviceValue}</Text>
                </View>
                <View style={styles.financeRow}>
                    <Text style={styles.financeLabel}>Platform Commission</Text>
                    <Text style={[styles.financeValue, commission > 0 && { color: '#EF4444' }]}>
                        {commission > 0 ? `-₹${commission}` : '₹0'}
                    </Text>
                </View>
                <View style={[styles.financeRow, styles.earningsRow]}>
                    <Text style={styles.earningsLabel}>Your Earnings</Text>
                    <Text style={styles.earningsValue}>₹{partnerEarnings}</Text>
                </View>
            </View>
        </View>
    );
}

export default function BookingListScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past'
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId) {
                setLoading(false);
                return;
            }
            const res = await getBookings({ partnerId });
            setBookings(res?.data || []);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const upcomingBookings = bookings.filter(b => ['Requested', 'Confirmed'].includes(b.status));
    const pastBookings = bookings.filter(b => ['Completed', 'Cancelled'].includes(b.status));
    const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Bookings</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddBooking')}
                >
                    <Ionicons name="add" size={20} color="#FFF" />
                    <Text style={styles.addBtnText}>Add New</Text>
                </TouchableOpacity>
            </View>

            {/* Sub-tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming ({upcomingBookings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past ({pastBookings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            ) : (
                <FlatList
                    data={displayedBookings}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <BookingItem item={item} navigation={navigation} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No bookings found</Text>
                            <Text style={styles.emptySub}>Your {activeTab} bookings will appear here.</Text>
                        </View>
                    }
                />
            )}

            {/* Custom Bottom Tab Bar */}
            <CustomBottomTab
                activeTab="Booking"
                onTabPress={(tabId, screen) => {
                    if (screen !== 'BookingList') {
                        navigation.navigate(screen);
                    }
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4
    },
    addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: { borderBottomColor: colors.secondary },
    tabText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
    activeTabText: { color: colors.secondary, fontWeight: '700' },

    listContent: { padding: 20, paddingBottom: 100 },
    bookingCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    customerName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    bookingId: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4
    },
    statusText: { fontSize: 12, fontWeight: '700' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },

    cardDetails: { marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    verticalDivider: { width: 1, height: 14, backgroundColor: '#CBD5E1', marginHorizontal: 8 },

    financialBreakdown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 6
    },
    financeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    financeLabel: { fontSize: 13, color: '#64748B' },
    financeValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    earningsRow: {
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        borderStyle: 'dashed'
    },
    earningsLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    earningsValue: { fontSize: 18, fontWeight: '800', color: colors.secondary },

    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12
    },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center' }
});
