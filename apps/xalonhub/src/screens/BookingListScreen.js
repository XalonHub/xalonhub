import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, RefreshControl, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookings, updateBookingStatus, declineBooking, getBookingReview, addPartnerNote, getStylists, getPartnerProfile } from '../services/api';
import CustomBottomTab from '../components/CustomBottomTab';
import { Alert, ScrollView as ScrollViewRN } from 'react-native';

const STATUS_CONFIG = {
    Requested: { label: 'Requested', color: '#F59E0B', bg: '#FEF9C3', icon: 'time-outline' },
    Confirmed: { label: 'Confirmed', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
    Completed: { label: 'Completed', color: '#6366F1', bg: '#EEF2FF', icon: 'checkmark-done-circle-outline' },
    Cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
};



function BookingItem({ item, navigation, onAction, onAddNote, partnerType }) {
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

                {(item.stylist || item.stylistNameAtBooking) ? (
                    <View style={[styles.detailRow, { marginTop: 8 }]}>
                        <Ionicons name="person-outline" size={16} color={colors.secondary} />
                        <Text style={[styles.detailText, { color: colors.secondary, fontWeight: '700' }]}>
                            Stylist: {item.stylist?.name || item.stylistNameAtBooking}
                        </Text>
                    </View>
                ) : (
                    partnerType !== 'Freelancer' && item.status !== 'Cancelled' && (
                        <TouchableOpacity 
                            style={[styles.detailRow, { marginTop: 8 }]}
                            onPress={() => onAction(item.id, 'assign')}
                        >
                            <Ionicons name="person-add-outline" size={16} color="#F59E0B" />
                            <Text style={[styles.detailText, { color: '#F59E0B', fontWeight: '700' }]}>
                                + Assign Stylist
                            </Text>
                        </TouchableOpacity>
                    )
                )}
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

            {item.status === 'Confirmed' && (
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: '#10B981' }]} 
                        onPress={() => onAction(item.id, 'InProgress')}
                    >
                        <Text style={styles.acceptBtnText}>Start Job</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status === 'InProgress' && (
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.secondary }]} 
                        onPress={() => onAction(item.id, 'Completed')}
                    >
                        <Text style={styles.acceptBtnText}>Complete Job</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status === 'Completed' && (
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.noteBtn]}
                        onPress={() => onAddNote(item)}
                    >
                        <Ionicons name="document-text-outline" size={15} color={colors.secondary} />
                        <Text style={styles.noteBtnText}>
                            {item._partnerNote ? '📝 Edit Note' : '📝 Add Note'}
                        </Text>
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

    // Note sheet state
    const [noteSheetVisible, setNoteSheetVisible] = useState(false);
    const [noteBooking, setNoteBooking] = useState(null); // the booking being noted
    const [noteReviewId, setNoteReviewId] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [noteSaving, setNoteSaving] = useState(false);
    
    // Stylist Assignment State
    const [stylists, setStylists] = useState([]);
    const [stylistModalVisible, setStylistModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [partnerType, setPartnerType] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);

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
            fetchPartnerInfo();
        }, [])
    );

    const fetchPartnerInfo = async () => {
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (partnerId) {
                const res = await getPartnerProfile(partnerId);
                setPartnerType(res.data?.partnerType);
                
                const stylRes = await getStylists(partnerId);
                setStylists(stylRes.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch partner info:", error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handleAction = async (bookingId, action, stylistId = null) => {
        try {
            if (action === 'assign') {
                setSelectedBookingId(bookingId);
                setStylistModalVisible(true);
                return;
            }

            if (action === 'Completed') {
                const booking = bookings.find(b => b.id === bookingId);
                if (booking && booking.paymentMethod === 'Cash' && !booking.partnerConfirmedReceipt) {
                    Alert.alert(
                        "Confirm Payment",
                        `Did you collect ₹${(booking.totalAmount || 0) - (booking.platformFee || 0)} in cash?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            { 
                                text: "Yes, Collected", 
                                onPress: async () => {
                                    setLoading(true);
                                    try {
                                        await updateBookingStatus(bookingId, 'Completed', null, true); // true for payment confirmed
                                        fetchBookings();
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }
                        ]
                    );
                    return;
                }
            }

            if (action === 'accept' || action === 'Confirmed') {
                const booking = bookings.find(b => b.id === bookingId);
                
                // If it's a salon and no stylist is assigned (and we didn't just pick one)
                if (partnerType !== 'Freelancer' && !booking?.stylistId && !stylistId) {
                    setSelectedBookingId(bookingId);
                    setStylistModalVisible(true);
                    return;
                }

                await updateBookingStatus(bookingId, 'Confirmed', stylistId);
            } else if (action === 'InProgress' || action === 'Completed') {
                await updateBookingStatus(bookingId, action, stylistId);
            } else {
                const partnerId = await AsyncStorage.getItem('partnerId');
                await declineBooking(bookingId, partnerId);
            }
            setStylistModalVisible(false);
            fetchBookings();
        } catch (err) {
            console.error(`Failed to handle ${action} for booking:`, err);
            Alert.alert("Error", `Failed to update booking status.`);
        }
    };

    const handleAssignStylist = async (stylist) => {
        setAssignmentLoading(true);
        await handleAction(selectedBookingId, 'accept', stylist.id);
        setAssignmentLoading(false);
    };

    const handleAddNote = async (booking) => {
        setNoteBooking(booking);
        setNoteText(booking._partnerNote || '');
        setNoteReviewId(booking._reviewId || null);
        // Fetch existing review if we don't have the ID yet
        if (!booking._reviewId) {
            try {
                const res = await getBookingReview(booking.id);
                if (res?.data) {
                    setNoteReviewId(res.data.id);
                    setNoteText(res.data.partnerNote || '');
                    // Tag the booking in-state so the button label updates
                    setBookings(prev => prev.map(b =>
                        b.id === booking.id ? { ...b, _reviewId: res.data.id, _partnerNote: res.data.partnerNote } : b
                    ));
                }
            } catch (_) {
                // No review yet — note will create one via the endpoint
            }
        }
        setNoteSheetVisible(true);
    };

    const handleSaveNote = async () => {
        if (!noteReviewId) {
            Alert.alert('Note', 'A customer review must exist before you can add a note. Ask the customer to rate first.');
            return;
        }
        setNoteSaving(true);
        try {
            await addPartnerNote(noteReviewId, noteText);
            // Update local state
            setBookings(prev => prev.map(b =>
                b.id === noteBooking?.id ? { ...b, _partnerNote: noteText } : b
            ));
            setNoteSheetVisible(false);
        } catch (err) {
            console.error('Failed to save note:', err);
            Alert.alert('Error', 'Failed to save note.');
        } finally {
            setNoteSaving(false);
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
                    renderItem={({ item }) => <BookingItem item={item} navigation={navigation} onAction={handleAction} onAddNote={handleAddNote} />}
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

            {/* Client Note Sheet */}
            <Modal
                visible={noteSheetVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setNoteSheetVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setNoteSheetVisible(false)}>
                        <Pressable style={[styles.sheetContainer, { maxHeight: '75%' }]}>
                            <View style={styles.sheetHeader}>
                                <View style={styles.sheetHandle} />
                                <Text style={styles.sheetTitle}>Client Note</Text>
                            </View>

                            {/* Context banner */}
                            {noteBooking && (
                                <View style={styles.noteContextBanner}>
                                    <Ionicons name="person-circle-outline" size={18} color="#64748B" />
                                    <Text style={styles.noteContextText}>
                                        {noteBooking.customer?.name || noteBooking.guestName || noteBooking.client?.name || 'Customer'}
                                        {' · '}
                                        {new Date(noteBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </Text>
                                </View>
                            )}

                            <View style={{ padding: 16 }}>
                                <TextInput
                                    style={styles.noteInput}
                                    multiline
                                    value={noteText}
                                    onChangeText={(t) => setNoteText(t.slice(0, 500))}
                                    placeholder="Write a private professional note about this client…"
                                    placeholderTextColor="#94A3B8"
                                    textAlignVertical="top"
                                    autoFocus
                                />
                                <Text style={styles.noteCharCount}>{noteText.length}/500</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.noteSaveBtn,
                                        (!noteReviewId || noteSaving) && { opacity: 0.6 }
                                    ]}
                                    onPress={handleSaveNote}
                                    disabled={noteSaving || !noteReviewId}
                                >
                                    {noteSaving ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.noteSaveBtnText}>Save Note</Text>
                                    )}
                                </TouchableOpacity>

                                {!noteReviewId && (
                                    <Text style={styles.noteWarning}>
                                        ⚠ The customer hasn't submitted a review yet. Notes can be added once a review exists.
                                    </Text>
                                )}
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
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

            {/* Stylist Selection Modal (for Salons) */}
            <Modal visible={stylistModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.sheetContainer}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>Assign Stylist to Booking</Text>
                        </View>
                        <ScrollViewRN style={styles.sheetContent}>
                            {stylists.length === 0 ? (
                                <Text style={styles.emptyStylistText}>No active stylists found. Please add stylists first.</Text>
                            ) : (
                                stylists.filter(s => s.isActive).map(stylist => (
                                    <TouchableOpacity 
                                        key={stylist.id} 
                                        style={styles.sheetItem}
                                        onPress={() => handleAssignStylist(stylist)}
                                        disabled={assignmentLoading}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={styles.stylistAvatarSmall}>
                                                <Text style={styles.avatarTextSmall}>{stylist.name.charAt(0)}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.sheetItemText}>{stylist.name}</Text>
                                                <Text style={styles.stylistMetaSmall}>{stylist.experience || 'Professional'}</Text>
                                            </View>
                                        </View>
                                        {assignmentLoading && selectedBookingId === stylist.id ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollViewRN>
                        <TouchableOpacity 
                            style={styles.sheetCancelBtn} 
                            onPress={() => setStylistModalVisible(false)}
                        >
                            <Text style={styles.sheetCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    },
    noteBtn: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        flexDirection: 'row',
        gap: 6,
    },
    noteBtnText: {
        color: colors.secondary,
        fontWeight: '700',
        fontSize: 13,
    },
    // Note sheet specific
    noteContextBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    noteContextText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '600',
    },
    noteInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        minHeight: 130,
        fontSize: 14,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
    },
    noteCharCount: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
        marginBottom: 12,
    },
    noteSaveBtn: {
        backgroundColor: colors.secondary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    noteSaveBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    noteWarning: {
        marginTop: 10,
        fontSize: 12,
        color: '#92400E',
        textAlign: 'center',
        lineHeight: 18,
    },
    // Stylist Modal Specific
    emptyStylistText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 14,
        marginVertical: 30,
        paddingHorizontal: 40,
    },
    stylistAvatarSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    stylistMetaSmall: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
});
