import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookings, updateBookingStatus, declineBooking } from '../services/api';
import CustomBottomTab from '../components/CustomBottomTab';
import { Alert, ScrollView as ScrollViewRN, Modal, Pressable, Platform } from 'react-native';

const STATUS_CONFIG = {
    Requested: { label: 'Requested', color: '#F59E0B', bg: '#FEF9C3', icon: 'time-outline' },
    Confirmed: { label: 'Confirmed', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
    Completed: { label: 'Completed', color: '#6366F1', bg: '#EEF2FF', icon: 'checkmark-done-circle-outline' },
    Cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
};



function BookingItem({ item, navigation, onAction }) {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.Requested;
    const dateStr = new Date(item.bookingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const customerName = item.customer?.name || item.guestName || item.client?.name || item.beneficiaryName || 'Customer';
    
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
                    <Text style={styles.bookingId}>ID: {item.id ? item.id.slice(0, 8).toUpperCase() : 'N/A'}</Text>
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


            {item.status === 'Requested' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.declineBtn]} 
                        onPress={() => onAction(item.id, 'decline')}
                    >
                        <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn]} 
                        onPress={() => onAction(item.id, 'accept')}
                    >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default function BookingListScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(null); // 'time' | 'status'

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

    const handleAction = async (bookingId, action) => {
        try {
            if (action === 'accept') {
                await updateBookingStatus(bookingId, 'Confirmed');
            } else {
                const partnerId = await AsyncStorage.getItem('partnerId');
                await declineBooking(bookingId, partnerId);
            }
            fetchBookings();
        } catch (err) {
            console.error(`Failed to ${action} booking:`, err);
            Alert.alert("Error", `Failed to ${action} booking.`);
        }
    };

    const handleTimeFilterPress = () => {
        setPickerType('time');
        setPickerVisible(true);
    };

    const handleStatusFilterPress = () => {
        setPickerType('status');
        setPickerVisible(true);
    };

    const handlePickerSelect = (value) => {
        if (pickerType === 'time') {
            setTimeFilter(value);
        } else {
            setStatusFilter(value);
        }
        setPickerVisible(false);
    };

    const filterByTime = (booking) => {
        if (timeFilter === 'All') return true;
        const bDate = new Date(booking.bookingDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (timeFilter === 'Today') {
            return bDate >= today;
        }
        if (timeFilter === 'This Week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return bDate >= startOfWeek;
        }
        if (timeFilter === 'This Month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            return bDate >= startOfMonth;
        }
        return true;
    };

    const displayedBookings = bookings.filter(b => {
        const matchesStatus = statusFilter === 'All' ? true : b.status === statusFilter;
        return matchesStatus && filterByTime(b);
    });

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

            {/* Ultra-Compact Filters - Twin Pills */}
            <View style={styles.filterSection}>
                <View style={styles.twinPillContainer}>
                    {/* Time Filter Pill */}
                    <TouchableOpacity 
                        style={[styles.timeFilterPill, timeFilter !== 'All' && styles.activeFilterPill]}
                        onPress={handleTimeFilterPress}
                    >
                        <Ionicons 
                            name="calendar-outline" 
                            size={16} 
                            color={timeFilter !== 'All' ? '#FFF' : '#64748B'} 
                        />
                        <Text style={[styles.timeFilterPillText, timeFilter !== 'All' && styles.activeFilterPillText]}>
                            {timeFilter === 'All' ? 'Period' : timeFilter}
                        </Text>
                        <Ionicons 
                            name="chevron-down" 
                            size={12} 
                            color={timeFilter !== 'All' ? '#FFF' : '#94A3B8'} 
                        />
                    </TouchableOpacity>

                    {/* Status Filter Pill */}
                    <TouchableOpacity 
                        style={[styles.timeFilterPill, statusFilter !== 'All' && styles.activeFilterPill]}
                        onPress={handleStatusFilterPress}
                    >
                        <Ionicons 
                            name="funnel-outline" 
                            size={16} 
                            color={statusFilter !== 'All' ? '#FFF' : '#64748B'} 
                        />
                        <Text style={[styles.timeFilterPillText, statusFilter !== 'All' && styles.activeFilterPillText]}>
                            {statusFilter === 'All' ? 'Status' : statusFilter}
                        </Text>
                        <Ionicons 
                            name="chevron-down" 
                            size={12} 
                            color={statusFilter !== 'All' ? '#FFF' : '#94A3B8'} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            ) : (
                <FlatList
                    data={displayedBookings}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <BookingItem item={item} navigation={navigation} onAction={handleAction} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No bookings found</Text>
                            <Text style={styles.emptySub}>Your bookings will appear here.</Text>
                        </View>
                    }
                />
            )}

            {/* Custom Filter Picker Modal */}
            <Modal
                visible={pickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setPickerVisible(false)}
                >
                    <View style={styles.sheetContainer}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>
                                {pickerType === 'time' ? 'Select Time Period' : 'Select Status'}
                            </Text>
                        </View>

                        <View style={styles.sheetContent}>
                            {(pickerType === 'time' 
                                ? ['All', 'Today', 'This Week', 'This Month']
                                : ['All', 'Requested', 'Confirmed', 'Completed', 'Cancelled']
                            ).map((item) => {
                                const isActive = (pickerType === 'time' ? timeFilter : statusFilter) === item;
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.sheetItem, isActive && styles.sheetItemActive]}
                                        onPress={() => handlePickerSelect(item)}
                                    >
                                        <Text style={[styles.sheetItemText, isActive && styles.sheetItemTextActive]}>
                                            {item === 'All' ? (pickerType === 'time' ? 'All Time' : 'All Status') : item}
                                        </Text>
                                        {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.sheetCancelBtn}
                            onPress={() => setPickerVisible(false)}
                        >
                            <Text style={styles.sheetCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

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
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

    filterSection: {
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 8
    },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    activeFilterChip: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A'
    },
    filterChipText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    activeFilterChipText: { color: '#FFF' },

    timeFilterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
        minWidth: 110,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activeFilterPill: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
    },
    timeFilterPillText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '700',
    },
    activeFilterPillText: {
        color: '#FFF',
    },
    twinPillContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        alignItems: 'center',
    },

    // Modal Sheet Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '60%',
    },
    sheetHeader: {
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 12,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    sheetContent: {
        padding: 12,
    },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    sheetItemActive: {
        backgroundColor: '#F8FAFC',
    },
    sheetItemText: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    sheetItemTextActive: {
        color: colors.secondary,
        fontWeight: '700',
    },
    sheetCancelBtn: {
        marginHorizontal: 20,
        marginTop: 8,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    sheetCancelText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '700',
    },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    actionBtn: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    declineBtn: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    declineBtnText: {
        color: '#991B1B',
        fontWeight: '700'
    },
    acceptBtn: {
        backgroundColor: '#0F172A'
    },
    acceptBtnText: {
        color: '#FFF',
        fontWeight: '700'
    }
});
