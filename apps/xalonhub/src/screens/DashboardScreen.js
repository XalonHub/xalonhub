import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, Switch, Platform, ActivityIndicator, Modal, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import CustomBottomTab from '../components/CustomBottomTab';
import { useOnboarding } from '../context/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartnerProfile, updatePartnerStatus, getBookings, getStylists, updateBookingStatus, declineBooking, getEarningsSummary, getBranding } from '../services/api';
import FreelancerDashboardScreen from './FreelancerDashboardScreen';
import NotificationBell from '../components/NotificationBell';
import ConsentModal from '../components/ConsentModal';
import { getUserPreferences, updateUserPreferences } from '../services/api';

export default function DashboardScreen({ navigation }) {
    const { formData, syncCloudDraftToLocal } = useOnboarding();
    const [logoUrl, setLogoUrl] = useState(null);

    useEffect(() => {
        const fetchBrandingData = async () => {
            try {
                const res = await getBranding();
                if (res.data && res.data.logoUrl) {
                    setLogoUrl(res.data.logoUrl);
                }
            } catch (e) {
                console.log('[DashboardScreen] Branding fetch failed', e.message);
            }
        };
        fetchBrandingData();
    }, []);
    const [kycStatus, setKycStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
    const [partnerType, setPartnerType] = useState(null);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isOnline, setIsOnline] = useState(true);
    const [loading, setLoading] = useState(true);
    const [requestedBookings, setRequestedBookings] = useState([]);
    const [confirmedBookings, setConfirmedBookings] = useState([]);
    const [stats, setStats] = useState({ booked: 0, inProgress: 0, completed: 0, earnings: 0, commission: 0, averageRating: 0, totalReviews: 0 });
    
    // Stylist Assignment State
    const [stylists, setStylists] = useState([]);
    const [stylistModalVisible, setStylistModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);

    // isFreelancer is ONLY derived from server data, not formData (to avoid stale state race)
    const isFreelancer = partnerType === 'Freelancer';

    // Pulsing animation for online status
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isOnline) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isOnline]);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            let partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId && formData.partnerId) {
                partnerId = formData.partnerId;
            }
            if (!partnerId) {
                setLoading(false);
                return;
            }
            const res = await getPartnerProfile(partnerId);
            const data = res?.data;
            if (data) {
                const docs = data.documents;
                const effectiveStatus = data.kycStatus || docs?.kycStatus;
                if (effectiveStatus) setKycStatus(effectiveStatus);
                // Set partnerType from server — this is the source of truth for role
                if (data.partnerType) setPartnerType(data.partnerType);
                if (data.isOnline !== undefined) setIsOnline(data.isOnline);
                await syncCloudDraftToLocal(data);

                // Fetch Bookings
                const [bookingRes, earningsRes] = await Promise.all([
                    getBookings({ partnerId }),
                    getEarningsSummary(partnerId)
                ]);

                const bookings = bookingRes?.data || [];
                const earningsData = earningsRes?.data?.data || { availableBalance: 0, totalOnlineEarnings: 0 };
                // Calculate stats
                const s = { 
                    booked: 0, inProgress: 0, completed: 0, cancelled: 0, 
                    earnings: 0, commission: 0, bookedAmount: 0, 
                    inProgressAmount: 0, cancelledAmount: 0,
                    todayEarnings: 0, todayBookings: 0
                };
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = (date) => {
                    if (!date) return false;
                    const d = new Date(date);
                    const today = new Date();
                    // Compare YYYY-MM-DD to avoid timezone hour shifts for "today" categorization
                    return d.toLocaleDateString() === today.toLocaleDateString();
                };

                bookings.forEach(b => {
                    const amt = b.partnerEarnings || 0;
                    
                    if (isToday(b.bookingDate)) {
                        s.todayBookings++;
                        if (b.status === 'Completed') {
                            s.todayEarnings += amt;
                        }
                    }
                    if (b.status === 'Requested' || b.status === 'Confirmed') {
                        s.booked++;
                        s.bookedAmount += amt;
                    }
                    if (b.status === 'InProgress') {
                        s.inProgress++;
                        s.inProgressAmount += amt;
                    }
                    if (b.status === 'Completed') {
                        s.completed++;
                        s.earnings += amt;

                        // Commission = (TotalAmount - PlatformFee) - PartnerEarnings
                        const subtotal = (b.totalAmount || 0) - (b.platformFee || 0);
                        const comm = subtotal - (b.partnerEarnings || subtotal);
                        s.commission += comm;
                    }
                    if (b.status === 'Cancelled') {
                        s.cancelled++;
                        s.cancelledAmount += amt;
                    }
                });
                s.averageRating = data.averageRating || 0;
                s.totalReviews = data.totalReviews || 0;
                s.availableBalance = earningsData.availableBalance || 0;
                s.totalEarnings = earningsData.totalEarnings || 0;
                s.totalCashEarnings = earningsData.totalCashEarnings || 0;
                setStats(s);


                // Filter bookings for freelancer/salon schedule
                const requested = bookings.filter(b => b.status === 'Requested');
                const confirmedPlus = bookings.filter(b => b.status === 'Confirmed' || b.status === 'InProgress');
                
                setRequestedBookings(requested);
                setConfirmedBookings(confirmedPlus);

                // Fetch Stylists for salons
                if (data.partnerType !== 'Freelancer') {
                    const stylRes = await getStylists(partnerId);
                    setStylists(stylRes.data || []);
                }

                // Check Preferences for one-time modal
                const prefRes = await getUserPreferences();
                if (prefRes.data && prefRes.data.success && !prefRes.data.preferences.hasSetPreferences) {
                    setShowConsentModal(true);
                }
            }
        } catch (e) {
            console.error("fetchDashboardData error:", e);
        } finally {
            setLoading(false);
        }
    };

    const salonServices = formData.salonServices || [];
    const activeServicesCount = salonServices.filter(s => !s.isCustom).length;
    const underReviewServicesCount = salonServices.filter(s => s.isCustom).length;

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [formData.partnerId])
    );

    const handleToggleStatus = async (val) => {
        setIsOnline(val);
        try {
            let partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId && formData.partnerId) partnerId = formData.partnerId;
            if (partnerId) {
                await updatePartnerStatus(partnerId, val);
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus, stylistId = undefined) => {
        try {
            if (newStatus === 'assign') {
                setSelectedBookingId(bookingId);
                setStylistModalVisible(true);
                return;
            }

            if (newStatus === 'Completed') {
                const booking = [...requestedBookings, ...confirmedBookings].find(b => b.id === bookingId);
                if (booking && (!booking.paymentMethod || booking.paymentMethod === 'Cash') && !booking.partnerConfirmedReceipt) {
                    Alert.alert(
                        "Confirm Payment",
                        `Did you collect ₹${booking.totalAmount || 0} in cash?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            { 
                                text: "Yes, Collected", 
                                onPress: async () => {
                                    setLoading(true);
                                    try {
                                        await updateBookingStatus(bookingId, 'Completed', undefined, true); // true for payment confirmed
                                        fetchDashboardData(true);
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

            await updateBookingStatus(bookingId, newStatus, stylistId);
            fetchDashboardData(true);
        } catch (err) {
            console.error("Failed to update status:", err);
            Alert.alert("Error", "Failed to update booking status.");
        }
    };

    const handleAssignStylist = async (stylist) => {
        setAssignmentLoading(true);
        await handleUpdateStatus(selectedBookingId, 'Confirmed', stylist.id);
        setStylistModalVisible(false); // Close modal after assignment
        setAssignmentLoading(false);
    };

    const handleDecline = async (bookingId) => {
        try {
            let partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId && formData.partnerId) partnerId = formData.partnerId;
            await declineBooking(bookingId, partnerId);
            fetchDashboardData(true);
        } catch (err) {
            console.error("Failed to decline booking:", err);
            Alert.alert("Error", "Failed to decline booking.");
        } finally {
            setLoading(false);
        }
    };

    const handleConsentAccept = async () => {
        setShowConsentModal(false);
        try {
            await updateUserPreferences({ whatsappTransactional: true, whatsappMarketing: true });
        } catch (e) {
            console.error("Failed to update consent:", e);
        }
    };

    const handleConsentDecline = async () => {
        setShowConsentModal(false);
        try {
            await updateUserPreferences({ whatsappTransactional: false, whatsappMarketing: false });
        } catch (e) {
            console.error("Failed to update consent:", e);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            </SafeAreaView>
        );
    }

    if (isFreelancer) {
        return (
            <FreelancerDashboardScreen
                navigation={navigation}
                kycStatus={kycStatus}
                isOnline={isOnline}
                onToggleStatus={handleToggleStatus}
                requestedBookings={requestedBookings}
                confirmedBookings={confirmedBookings}
                stats={stats}
                onRefresh={() => fetchDashboardData(true)}
            />
        );
    }

    const renderContent = () => {
        if (activeTab !== 'Dashboard') {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.placeholderText}>{activeTab} Features Coming Soon</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* KYC Pending Banner */}
                {kycStatus === 'pending' && (
                    <View style={styles.kycUnderReviewBanner}>
                        <View style={styles.kycBannerLeft}>
                            <Ionicons name="time" size={22} color="#92400E" />
                            <View style={styles.kycBannerText}>
                                <Text style={styles.kycBannerTitle}>KYC Under Review</Text>
                                <Text style={styles.kycBannerSub}>Our team is reviewing your documents.</Text>
                            </View>
                        </View>
                        <View style={styles.kycBannerBadge}>
                            <Text style={styles.kycBannerBadgeText}>Pending</Text>
                        </View>
                    </View>
                )}

                {/* KYC Rejected Banner */}
                {kycStatus === 'rejected' && (
                    <TouchableOpacity style={styles.kycRejectedBanner} onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}>
                        <View style={styles.kycBannerLeft}>
                            <Ionicons name="alert-circle" size={22} color="#991B1B" />
                            <View style={styles.kycBannerText}>
                                <Text style={[styles.kycBannerTitle, { color: '#991B1B' }]}>KYC Rejected</Text>
                                <Text style={[styles.kycBannerSub, { color: '#B91C1C' }]}>Tap to re-submit your documents.</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#991B1B" />
                    </TouchableOpacity>
                )}

                {/* Pending KYC prompt (not yet submitted) */}
                {!kycStatus && (
                    <View style={styles.verificationCard}>
                        <View style={styles.verificationRow}>
                            <Ionicons name="time" size={32} color={colors.secondary} />
                            <View style={styles.verificationTextContainer}>
                                <Text style={styles.verificationTitle}>Your Profile is</Text>
                                <Text style={styles.verificationBoldTitle}>Pending KYC</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.arrowCircle}
                                onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}
                            >
                                <Ionicons name="arrow-forward" size={20} color="#F97316" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.verificationSub}>Complete KYC to get verified.</Text>
                    </View>
                )}

                {/* Earnings & Commission */}
                <View style={styles.earningsSection}>
                    <View style={styles.heroStatsRow}>
                        <View style={styles.heroStatItem}>
                            <Text style={styles.heroStatValue}>₹{(stats.todayEarnings || 0).toLocaleString()}</Text>
                            <Text style={styles.heroStatLabel}>Today's Earnings</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStatItem}>
                            <Text style={styles.heroStatValue}>{stats.todayBookings || 0}</Text>
                            <Text style={styles.heroStatLabel}>Today's Jobs</Text>
                        </View>
                    </View>
                    
                    <View style={styles.walletInfoBar}>
                        <View>
                            <Text style={styles.walletBalanceLabel}>Available for Payout (Online)</Text>
                            <Text style={styles.walletBalanceValue}>₹{(stats.availableBalance || 0).toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate('Earnings')}>
                            <Text style={styles.withdrawBtnText}>Earnings</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.convenienceFeeRow}>
                        <Text style={styles.convenienceFeeText}>Total Commission Deducted</Text>
                        <View style={styles.convenienceFeeRight}>
                            <Text style={styles.convenienceFeeText}>₹{stats.commission}</Text>
                            <Ionicons name="information-circle" size={14} color="#64748B" />
                        </View>
                    </View>
                </View>

                {/* Bookings Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bookings</Text>
                    <View style={styles.bookingActions}>
                        <TouchableOpacity style={styles.addBookingBtn} onPress={() => navigation.navigate('AddBooking')}>
                            <View style={styles.addBookingIcon}>
                                <Ionicons name="add" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.addBookingText}>Add Booking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.viewAllBtn}
                            onPress={() => navigation.navigate('BookingList')}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Booking Status Summary */}
                <View style={styles.bookingStatusContainer}>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Booked</Text>
                        <Text style={styles.bookingStatusCount}>{stats.booked} Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ {stats.bookedAmount || 0}</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>In Progress</Text>
                        <Text style={styles.bookingStatusCount}>{stats.inProgress} Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ {stats.inProgressAmount || 0}</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Completed</Text>
                        <Text style={styles.bookingStatusCount}>{stats.completed} Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ {stats.earnings}</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Cancelled</Text>
                        <Text style={styles.bookingStatusCount}>{stats.cancelled} Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ {stats.cancelledAmount || 0}</Text>
                    </View>
                </View>

                {/* Today's Schedule - Consolidated Horizontal List */}
                <View style={{ marginBottom: 24 }}>
                    <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <Text style={{ fontSize: 13, color: '#64748B' }}>
                            {requestedBookings.length + confirmedBookings.length} Total
                        </Text>
                    </View>

                    {(requestedBookings.length + confirmedBookings.length) > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                            {[...requestedBookings, ...confirmedBookings].map(item => {
                                const isRequested = item.status === 'Requested';
                                const isConfirmed = item.status === 'Confirmed';
                                const isInProgress = item.status === 'InProgress';
                                const isCompleted = item.status === 'Completed';

                                return (
                                    <View key={item.id} style={[styles.activeBookingCard, { width: 300, marginTop: 0, marginBottom: 0 }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.activeBookingName, { marginBottom: 2 }]} numberOfLines={1}>
                                                    {item.customer?.name || item.guestName || item.client?.name || 'Customer'}
                                                </Text>
                                                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                                    <View style={[styles.statusChip, { backgroundColor: isRequested ? '#FEF3C7' : (isConfirmed || isInProgress) ? '#ECFDF5' : '#E0F2FE', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2 }]}>
                                                        <Text style={[styles.statusChipText, { color: isRequested ? '#92400E' : (isConfirmed || isInProgress) ? '#059669' : '#0B69A3', fontSize: 10 }]}>
                                                            {item.status}
                                                        </Text>
                                                    </View>
                                                    {(item.stylist || item.stylistNameAtBooking) ? (
                                                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                             <Ionicons name="person-circle" size={12} color={colors.secondary} />
                                                             <Text style={{ fontSize: 10, color: colors.secondary, fontWeight: '700' }}>
                                                                 {item.stylist?.name || item.stylistNameAtBooking}
                                                             </Text>
                                                         </View>
                                                     ) : (
                                                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                             <Ionicons name="person-outline" size={12} color="#94A3B8" />
                                                             <Text style={{ fontSize: 10, color: '#94A3B8' }}>Unassigned</Text>
                                                         </View>
                                                     )}
                                                </View>
                                            </View>
                                            <View style={[styles.walkinIconContainer, { backgroundColor: item.serviceMode === 'AtSalon' ? '#475569' : colors.primary }]}>
                                                 <Ionicons name={item.serviceMode === 'AtSalon' ? 'walk' : 'home'} size={12} color="#FFF" />
                                            </View>
                                        </View>
                                        
                                        <Text style={[styles.activeBookingLabel, { marginTop: 4 }]}>
                                            {item.timeSlot || 'Anytime'} • ID {item.id ? item.id.slice(0, 6).toUpperCase() : 'N/A'}
                                        </Text>
                                        
                                        <Text style={styles.activeBookingServiceType} numberOfLines={1}>
                                            {item.services?.[0]?.serviceName}{item.services?.length > 1 ? ` +${item.services.length - 1}` : ''}
                                        </Text>

                                        {(isConfirmed || isInProgress) && (item.stylist || item.stylistNameAtBooking) && (
                                             <Text style={[styles.activeBookingLabel, { color: colors.primary, fontWeight: '700', marginTop: 4 }]}>
                                                 Stylist: {item.stylist?.name || item.stylistNameAtBooking}
                                             </Text>
                                        )}
                                        
                                        <View style={{ marginVertical: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontWeight: '800', fontSize: 18, color: '#0F172A' }}>
                                                ₹{(item.totalAmount || 0) - (item.platformFee || 0)}
                                            </Text>
                                            <TouchableOpacity 
                                                onPress={() => handleUpdateStatus(item.id, 'assign')}
                                                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' }}
                                            >
                                                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>
                                                    {(item.stylist || item.stylistNameAtBooking) ? 'Re-assign' : '+ Assign Stylist'}
                                                </Text>
                                            </TouchableOpacity>
                                            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500' }}>
                                                {item.serviceMode === 'AtSalon' ? 'Salon' : 'Home'}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {isRequested ? (
                                                <>
                                                    <TouchableOpacity 
                                                        style={[styles.declineBtn, { flex: 1 }]}
                                                        onPress={() => handleDecline(item.id)}
                                                    >
                                                        <Text style={styles.declineBtnText}>Decline</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        style={[styles.acceptBtn, { flex: 1 }]}
                                                        onPress={() => handleUpdateStatus(item.id, 'Confirmed')}
                                                    >
                                                        <Text style={styles.acceptBtnText}>Accept</Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : item.status === 'Confirmed' ? (
                                                <TouchableOpacity 
                                                    style={[styles.startJobBtn, { flex: 1 }]}
                                                    onPress={() => handleUpdateStatus(item.id, 'InProgress')}
                                                >
                                                    <Text style={styles.startJobBtnText}>Start Job</Text>
                                                </TouchableOpacity>
                                            ) : item.status === 'InProgress' ? (
                                                <TouchableOpacity 
                                                    style={[styles.startJobBtn, { flex: 1, backgroundColor: colors.secondary }]}
                                                    onPress={() => handleUpdateStatus(item.id, 'Completed')}
                                                >
                                                    <Text style={styles.startJobBtnText}>Complete Job</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={{ flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#ECFDF5', borderRadius: 8 }}>
                                                    <Text style={{ color: '#059669', fontWeight: '700', fontSize: 12 }}>Completed</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={[styles.activeBookingCard, { alignItems: 'center', paddingVertical: 40, borderStyle: 'dashed' }]}>
                            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                            <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '500' }}>No bookings for today</Text>
                        </View>
                    )}
                </View>

                {/* Grid layout - 2-column grid */}
                <View style={styles.gridContainer}>
                    <TouchableOpacity 
                        style={styles.gridCardContainer}
                        onPress={() => {
                            Alert.alert("Coming Soon", "Deals & Offers management is currently under development.");
                        }}
                    >
                        <LinearGradient colors={colors.gradients.cardDeals} style={styles.gridCardGradient}>
                            <Text style={styles.gridCardTitle}>Deals & Offers <Ionicons name="chevron-forward" size={12} /></Text>
                            <Ionicons name="pricetag" size={60} color="#000" style={styles.cardWatermark} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.gridCardContainer}
                        onPress={() => navigation.navigate('SalonServiceSetup', { isEdit: true })}
                    >
                        <LinearGradient colors={colors.gradients.cardServices} style={styles.gridCardGradient}>
                            <Text style={styles.gridCardTitle}>Salon Services</Text>
                            <View style={styles.gridCardContent}>
                                <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Active</Text><Text style={styles.gridCardSubCount}>{activeServicesCount}</Text></View>
                                <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Under Review</Text><Text style={styles.gridCardSubCount}>{underReviewServicesCount}</Text></View>
                            </View>
                            <Ionicons name="cut" size={50} color="#000" style={styles.cardWatermark} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.gridCardContainer}
                        onPress={() => navigation.navigate('StylistManagement')}
                    >
                        <LinearGradient colors={colors.gradients.cardStaff} style={styles.gridCardGradient}>
                            <Text style={[styles.gridCardTitle, { marginTop: 6 }]}>Stylists</Text>
                            <View style={styles.gridCardContentBottom}>
                                <Text style={styles.gridCardSubText}>Total Stylists</Text>
                                <View style={styles.staffCountBadge}><Text style={styles.staffCountText}>{formData.stylists?.length || 0}</Text></View>
                            </View>
                            <Ionicons name="people" size={60} color="#000" style={styles.cardWatermark} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.gridCardContainer}
                        onPress={() => navigation.navigate('Earnings')}
                    >
                        <LinearGradient colors={colors.gradients.cardPerf} style={styles.gridCardGradient}>
                            <Text style={styles.gridCardTitle}>Performance</Text>
                            <View style={styles.gridCardContent}>
                                <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Available</Text><Text style={styles.gridCardSubCount}>₹{stats.availableBalance}</Text></View>
                                <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Completed</Text><Text style={styles.gridCardSubCount}>{stats.completed}</Text></View>
                            </View>
                            <Ionicons name="stats-chart" size={50} color="#000" style={styles.cardWatermark} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.gridCardContainer}
                        onPress={() => navigation.navigate('Feedback')}
                    >
                        <LinearGradient colors={colors.gradients.cardReviews} style={styles.gridCardGradient}>
                            <Text style={styles.gridCardTitle}>Reviews</Text>
                            <View style={styles.gridCardContentBottom}>
                                <Text style={styles.gridCardSubText}>Customer Feedback</Text>
                                <Ionicons name="star" size={16} color="#F59E0B" />
                            </View>
                            <Ionicons name="chatbubbles" size={60} color="#000" style={styles.cardWatermark} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brandContainer}>
                    {logoUrl ? (
                        <Image
                            source={{ uri: logoUrl }}
                            style={styles.logoFull}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.logoFull, { backgroundColor: '#f0f0f0', borderRadius: 4 }]} />
                    )}
                    <Text style={styles.hubText}>HUB</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.onlineToggle}>
                        <View style={styles.statusIndicatorContainer}>
                            {isOnline && (
                                <Animated.View 
                                    style={[
                                        styles.onlinePulse, 
                                        { transform: [{ scale: pulseAnim }], opacity: Animated.multiply(pulseAnim, 0.5) }
                                    ]} 
                                />
                            )}
                            <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.secondary : '#94A3B8' }]} />
                        </View>
                        <Switch
                            value={isOnline}
                            onValueChange={handleToggleStatus}
                            trackColor={{ false: '#E2E8F0', true: colors.secondary + '40' }}
                            thumbColor={isOnline ? colors.secondary : '#94A3B8'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <NotificationBell navigation={navigation} color="#000" />
                </View>
            </View>

            {/* Main Content Area */}
            {renderContent()}

            {/* Custom Bottom Tab Bar */}
            <CustomBottomTab
                activeTab={activeTab}
                onTabPress={(tabId, screen) => {
                    setActiveTab(tabId);
                    if (screen !== 'Dashboard') {
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
                        <ScrollView style={styles.sheetContent}>
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
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.sheetCancelBtn} 
                            onPress={() => setStylistModalVisible(false)}
                        >
                            <Text style={styles.sheetCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ConsentModal 
                visible={showConsentModal} 
                onAccept={handleConsentAccept}
                onDecline={handleConsentDecline}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10,
        backgroundColor: '#FFF'
    },
    logoFull: { width: 100, height: 32 },
    brandContainer: { flexDirection: 'row', alignItems: 'center' },
    hubText: { fontSize: 15, fontWeight: '800', color: colors.primary, marginLeft: 6, letterSpacing: 1.2, marginTop: 4 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusIndicatorContainer: { width: 14, height: 14, justifyContent: 'center', alignItems: 'center' },
    onlinePulse: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.secondary },
    onlineDot: { width: 8, height: 8, borderRadius: 4, zIndex: 1 },
    onlineText: { fontSize: 11, color: '#1E293B', fontWeight: '600' },
    notificationBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#1E293B'
    },
    notificationBadge: {
        position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary
    },

    // Content Area
    scrollArea: { flex: 1, backgroundColor: '#FFF' },
    scrollContent: { paddingHorizontal: 20, gap: 24, paddingBottom: 40, paddingTop: 10 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    placeholderText: { fontSize: 18, color: '#64748B', fontWeight: '500' },

    // KYC Under Review Banner
    kycUnderReviewBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    kycBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    kycBannerText: { flex: 1 },
    kycBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
    kycBannerSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
    kycBannerBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    kycBannerBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    kycRejectedBanner: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12, padding: 14,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#FECACA',
    },

    // Verification Card (pre-submission prompt)
    verificationCard: {
        backgroundColor: '#FFF5F7', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCE4ED'
    },
    verificationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    verificationTextContainer: { flex: 1, marginLeft: 12 },
    verificationTitle: { fontSize: 15, color: '#1E293B' },
    verificationBoldTitle: { fontSize: 16, fontWeight: 'bold', color: '#D6336C', textDecorationLine: 'underline' },
    arrowCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
    verificationSub: { fontSize: 14, color: '#1E293B', marginLeft: 44 },

    // Earnings Section
    earningsSection: {  },
    heroStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 10 },
    heroStatItem: { alignItems: 'center' },
    heroStatValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
    heroStatLabel: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    heroStatDivider: { width: 1, height: 32, backgroundColor: '#F1F5F9' },
    walletInfoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginTop: 10 },
    walletBalanceLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    walletBalanceValue: { fontSize: 18, fontWeight: '700', color: colors.black, marginTop: 2 },
    withdrawBtn: {
        backgroundColor: colors.secondary, paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4
    },
    withdrawBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    convenienceFeeRow: {
        flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8
    },
    convenienceFeeText: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    convenienceFeeRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    // Bookings Header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
    bookingActions: { flexDirection: 'row', gap: 12 },
    addBookingBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#000',
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8
    },
    addBookingIcon: { backgroundColor: colors.secondary, borderRadius: 8, padding: 2 },
    addBookingText: { fontSize: 14, fontWeight: '500' },
    viewAllBtn: { borderWidth: 1, borderColor: '#000', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
    viewAllText: { fontSize: 14, fontWeight: '500' },

    // Booking Status Summary
    bookingStatusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
    bookingStatusCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, width: '23%' },
    bookingStatusLabel: { fontSize: 10, color: '#64748B', marginBottom: 4 },
    bookingStatusCount: { fontSize: 12, color: '#1E293B', marginBottom: 4 },
    bookingStatusAmount: { fontSize: 11, color: '#64748B' },

    // Active Booking Card
    activeBookingCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 12, marginBottom: 12 },
    activeBookingName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
    activeBookingIdRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    activeBookingIdText: { fontSize: 14, color: '#64748B' },
    verticalDivider: { width: 1, height: 14, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
    walkinIconContainer: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#475569', justifyContent: 'center', alignItems: 'center' },
    activeBookingLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    activeBookingValue: { fontSize: 15, fontWeight: '500', color: '#1E293B', marginBottom: 16 },
    activeBookingServiceType: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    activeBookingTotalAmount: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
    startJobBtn: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    startJobBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    // Grid Layout
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    gridCardContainer: {
        width: '48%', height: 120, borderRadius: 16, overflow: 'hidden',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    gridCardGradient: { flex: 1, padding: 14, justifyContent: 'space-between' },
    gridCardTitle: { fontSize: 16, fontWeight: '800', color: colors.black },
    cardWatermark: { position: 'absolute', bottom: -15, right: -15, opacity: 0.08 },
    cardWatermarkCenter: { position: 'absolute', top: 20, alignSelf: 'center', opacity: 0.6 },
    gridCardContent: { marginTop: 'auto', gap: 6, zIndex: 1 },
    gridCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gridCardSubText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
    gridCardSubCount: { fontSize: 14, fontWeight: 'bold' },
    gridCardContentBottom: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 },
    staffCountBadge: { backgroundColor: '#C4C6E9', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    staffCountText: { fontSize: 12, fontWeight: 'bold' },

    // More Section
    moreSection: { marginTop: 10 },
    moreTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 12 },
    moreList: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, backgroundColor: '#FFF' },
    moreListItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    moreListText: { fontSize: 15, color: '#000', fontWeight: '500', flex: 1 },
    moreListArrow: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0056D2', justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 56 },


    tabLabelActive: { color: '#000', fontWeight: '700' },

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
