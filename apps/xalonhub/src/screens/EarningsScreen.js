import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEarningsSummary, initiatePayout, getPayoutHistory, getBookings } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useOnboarding } from '../context/OnboardingContext';

export default function EarningsScreen({ navigation }) {
    const { formData } = useOnboarding();
    const [loading, setLoading] = useState(true);
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [summary, setSummary] = useState({
        totalEarnings: 0,
        totalOnlineEarnings: 0,
        totalCashEarnings: 0,
        totalPlatformFees: 0,
        totalSettled: 0,
        pendingAmount: 0,
        availableBalance: 0
    });
    const [history, setHistory] = useState([]);
    const [filterPeriod, setFilterPeriod] = useState('lifetime'); // 'lifetime' | 'this_month' | 'today'
    const [refreshing, setRefreshing] = useState(false);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawType, setWithdrawType] = useState('UPI'); // 'UPI' | 'Bank'
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const fetchData = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setRefreshing(true);

            // Prioritize formData.partnerId as it's the verified profile ID
            let partnerId = formData.partnerId || await AsyncStorage.getItem('partnerId') || await AsyncStorage.getItem('userId');
            
            console.log('Frontend: Fetching earnings for Partner ID:', partnerId);

            if (!partnerId) {
                console.warn('Frontend: No Partner ID found in storage or context');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            let startDate, endDate;
            const now = new Date();

            if (filterPeriod === 'today') {
                startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
            } else if (filterPeriod === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            }

            const [summaryRes, historyRes, bookingsRes] = await Promise.all([
                getEarningsSummary(partnerId, { startDate, endDate }),
                getPayoutHistory(partnerId),
                getBookings({ partnerId })
            ]);

            if (summaryRes.data.success) {
                setSummary(summaryRes.data.data);
            }

            let combinedHistory = [];
            
            // Add Payouts
            if (historyRes.data.success && historyRes.data.history) {
                combinedHistory = [...historyRes.data.history];
            }

            // Filter Completed Bookings as Service Earnings based on dates if not lifetime
            if (bookingsRes.data) {
                let completedBookings = bookingsRes.data.filter(b => b.status === 'Completed');
                
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    completedBookings = completedBookings.filter(b => {
                        const bDate = new Date(b.bookingDate || b.createdAt);
                        return bDate >= start && bDate <= end;
                    });
                }
                combinedHistory = [...combinedHistory, ...completedBookings];
            }

            // --- LOCAL CALCULATION FALLBACK ---
            // If the server summary is 0 but we have bookings in the history list,
            // we calculate the totals here to ensure the UI is consistent.
            let computedSummary = summaryRes.data.success ? { ...summaryRes.data.data } : { ...summary };
            
            if ((!computedSummary.totalEarnings || computedSummary.totalEarnings === 0) && combinedHistory.length > 0) {
                console.log('Frontend: Server summary is 0, calculating from history list...');
                let total = 0, online = 0, cash = 0, fees = 0;
                
                combinedHistory.forEach(item => {
                    const isPayout = !!item.paytmOrderId;
                    if (!isPayout) {
                        const amt = Number(item.partnerEarnings || 0);
                        const fee = Number(item.platformFee || 10); // Default 10 if missing
                        total += amt;
                        fees += fee;
                        if (item.paymentMethod && item.paymentMethod.toLowerCase() === 'online') {
                            online += amt;
                        } else {
                            cash += amt;
                        }
                    }
                });

                computedSummary = {
                    ...computedSummary,
                    totalEarnings: total,
                    totalOnlineEarnings: online,
                    totalCashEarnings: cash,
                    totalPlatformFees: fees
                };
            }

            setSummary(computedSummary);

            // Sort by date descending
            combinedHistory.sort((a, b) => {
                const dateA = new Date(a.requestedAt || a.bookingDate || a.createdAt);
                const dateB = new Date(b.requestedAt || b.bookingDate || b.createdAt);
                return dateB - dateA;
            });

            setHistory(combinedHistory);
        } catch (error) {
            console.error('Fetch Earnings Error:', error);
            Alert.alert('Error', 'Failed to load financial data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterPeriod]);

    useFocusEffect(
        useCallback(() => {
            fetchData(true);
        }, [])
    );

    const handleWithdraw = async () => {
        const amt = parseFloat(withdrawAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
            return;
        }

        if (amt > summary.availableBalance) {
            Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance.');
            return;
        }

        try {
            setPayoutLoading(true);
            const partnerId = await AsyncStorage.getItem('partnerId');
            const res = await initiatePayout(partnerId, amt, withdrawType);

            if (res.data.success) {
                Alert.alert(
                    amt > 5000 ? 'Request Submitted' : 'Success',
                    amt > 5000 
                        ? 'Your request for ₹' + amt + ' has been submitted for admin approval.'
                        : 'Your payout of ₹' + amt + ' has been processed successfully.'
                );
                setWithdrawModalVisible(false);
                setWithdrawAmount('');
                fetchData();
            }
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to process payout. Please try again.';
            Alert.alert('Payout Error', msg);
        } finally {
            setPayoutLoading(false);
        }
    };

    const renderHistoryItem = (item) => {
        const isPayout = !!item.paytmOrderId;
        return (
            <View key={item.id} style={styles.historyCard}>
                <View style={[styles.historyIcon, { backgroundColor: isPayout ? '#FEE2E2' : '#ECFDF5' }]}>
                    <Ionicons 
                        name={isPayout ? "arrow-up-outline" : "arrow-down-outline"} 
                        size={20} 
                        color={isPayout ? "#EF4444" : "#10B981"} 
                    />
                </View>
                <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{isPayout ? 'Payout Request' : 'Service Earning'}</Text>
                    <Text style={styles.historyDate}>
                        {new Date(item.requestedAt || item.bookingDate || item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                    {isPayout && (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.historyAmount, { color: isPayout ? colors.black : colors.secondary }]}>
                    {isPayout ? '-' : '+'} ₹{item.amount || item.partnerEarnings || 0}
                </Text>
            </View>
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return '#10B981';
            case 'Processing': return '#F59E0B';
            case 'Pending': return '#3B82F6';
            case 'Failed': return '#EF4444';
            default: return '#64748B';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings & Payouts</Text>
                <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Filter Period Chips */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {[
                        { id: 'lifetime', label: 'Lifetime' },
                        { id: 'this_month', label: 'This Month' },
                        { id: 'today', label: 'Today' }
                    ].map(item => (
                        <TouchableOpacity 
                            key={item.id}
                            style={[styles.filterChip, filterPeriod === item.id && styles.filterChipActive]}
                            onPress={() => setFilterPeriod(item.id)}
                        >
                            <Text style={[styles.filterChipText, filterPeriod === item.id && styles.filterChipTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Wallet Card */}
                <LinearGradient 
                    colors={colors.gradients.slate}
                    style={styles.walletCard}
                >
                    <View style={styles.walletHeader}>
                        <View>
                            <Text style={styles.walletLabel}>Available for Payout</Text>
                            <Text style={styles.walletBalance}>₹{summary.availableBalance.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.walletBadge}>
                            <Ionicons name="checkmark-seal" size={16} color="#10B981" />
                            <Text style={styles.walletBadgeText}>Verified</Text>
                        </View>
                    </View>
                    
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.actionBtnPrimary} 
                            onPress={() => {
                                setWithdrawType('UPI');
                                setWithdrawModalVisible(true);
                            }}
                        >
                            <Ionicons name="flash" size={18} color="#FFF" />
                            <Text style={styles.actionBtnText}>UPI Withdrawal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.actionBtnGlass}
                            onPress={() => {
                                setWithdrawType('Bank');
                                setWithdrawModalVisible(true);
                            }}
                        >
                            <Ionicons name="business" size={18} color="#FFF" />
                            <Text style={styles.actionBtnText}>Bank Transfer</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Lifetime Total</Text>
                        <Text style={styles.statValue}>₹{(summary.totalEarnings || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Cash Collected</Text>
                        <Text style={[styles.statValue, { color: '#059669' }]}>₹{(summary.totalCashEarnings || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Online (via HUB)</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>₹{(summary.totalOnlineEarnings || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Paid Out</Text>
                        <Text style={[styles.statValue, { color: colors.secondary }]}>₹{summary.totalSettled.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Platform Fees</Text>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>₹{summary.totalPlatformFees.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>In Processing</Text>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>₹{summary.pendingAmount.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    <Text style={styles.sectionHeaderTitle}>Transaction History</Text>

                    <View style={styles.historyList}>
                        {history.length > 0 ? (
                            history.map(renderHistoryItem)
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No transaction history found</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Withdraw Modal */}
            <Modal visible={withdrawModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Withdraw Funds</Text>
                            <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.black} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Amount to Withdraw (Max ₹{summary.availableBalance})</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.currencyPrefix}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    keyboardType="number-pad"
                                    value={withdrawAmount}
                                    onChangeText={setWithdrawAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.payoutModeBox}>
                                <Ionicons 
                                    name={withdrawType === 'UPI' ? "flash" : "business"} 
                                    size={20} 
                                    color={colors.primary} 
                                />
                                <Text style={styles.payoutModeText}>
                                    Transferring to registered {withdrawType === 'UPI' ? 'UPI ID' : 'Bank Account'}
                                </Text>
                            </View>

                            {parseFloat(withdrawAmount) > 5000 && (
                                <View style={styles.noticeBox}>
                                    <Ionicons name="information-circle" size={18} color="#3B82F6" />
                                    <Text style={styles.noticeText}>
                                        Amounts above ₹5,000 require manual admin review and may take 2-4 hours.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity 
                            style={[styles.confirmBtn, payoutLoading && { opacity: 0.7 }]}
                            onPress={handleWithdraw}
                            disabled={payoutLoading}
                        >
                            {payoutLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.confirmBtnText}>Confirm Payout →</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF'
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
    refreshBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

    filterContainer: { marginTop: 10, marginBottom: 8 },
    filterScroll: { paddingHorizontal: 15 },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20, 
        backgroundColor: '#F1F5F9', 
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    filterChipActive: { 
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    filterChipTextActive: { color: '#FFF' },

    walletCard: {
        margin: 20, padding: 24, borderRadius: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    walletLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    walletBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    walletBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    walletBalance: { color: '#FFF', fontSize: 38, fontWeight: '800' },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    actionBtnPrimary: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 16
    },
    actionBtnGlass: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
    },
    actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 10 },
    statBox: { 
        width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    statLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
    statValue: { fontSize: 16, fontWeight: '700', color: colors.black },

    contentArea: { marginTop: 24, flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#FFF', padding: 24 },
    sectionHeaderTitle: { fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: 20 },
    historyList: { gap: 16 },
    historyCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    historyIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    historyInfo: { flex: 1, gap: 2 },
    historyTitle: { fontSize: 16, fontWeight: '600', color: colors.black },
    historyDate: { fontSize: 12, color: '#94A3B8' },
    historyAmount: { fontSize: 16, fontWeight: '700' },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    statusText: { fontSize: 10, fontWeight: '700' },

    emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.black },
    modalBody: { gap: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
    currencyPrefix: { fontSize: 32, fontWeight: '800', color: colors.black, marginRight: 8 },
    amountInput: { flex: 1, fontSize: 32, fontWeight: '800', color: colors.black },
    payoutModeBox: { 
        flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F3FF', 
        padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DDD6FE' 
    },
    payoutModeText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '600' },
    noticeBox: { flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12 },
    noticeText: { flex: 1, fontSize: 12, color: '#3B82F6', lineHeight: 18 },
    confirmBtn: {  backgroundColor: colors.black, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
