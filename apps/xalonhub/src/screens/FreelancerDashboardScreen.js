import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    ScrollView, Switch, Image, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import CustomBottomTab from '../components/CustomBottomTab';
import { useOnboarding } from '../context/OnboardingContext';
import { updateBookingStatus, declineBooking } from '../services/api';
import { haversineKm, formatDistance, openMaps } from '../utils/bookingUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XALONHUB_LOGO = require('../assets/brand/logo_full.png');

// ─── Tiny reusable star row ────────────────────────────────────────────────
function Stars({ rating = 0, max = 5, size = 14, color = '#F59E0B' }) {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: max }, (_, i) => {
                const filled = i < Math.floor(rating);
                const half = !filled && i < rating;
                return (
                    <Ionicons
                        key={i}
                        name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                        size={size}
                        color={color}
                    />
                );
            })}
        </View>
    );
}

export default function FreelancerDashboardScreen({ navigation, kycStatus, isOnline, onToggleStatus, requestedBookings = [], confirmedBookings = [], stats }) {
    const { formData } = useOnboarding();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [updating, setUpdating] = useState(false);

    const handleUpdateStatus = async (bookingId, newStatus) => {
        if (newStatus === 'Completed') {
            const booking = [...requestedBookings, ...confirmedBookings].find(b => b.id === bookingId);
            if (booking && (!booking.paymentMethod || booking.paymentMethod === 'Cash') && !booking.partnerConfirmedReceipt) {
                Alert.alert(
                    "Confirm Payment",
                    `Did you collect ₹${(booking.totalAmount || 0) - (booking.platformFee || 0)} in cash?`,
                    [
                        { text: "Cancel", style: "cancel" },
                        { 
                            text: "Yes, Collected", 
                            onPress: async () => {
                                setUpdating(true);
                                try {
                                    await updateBookingStatus(bookingId, 'Completed', null, true); // true for payment confirmed
                                    navigation.replace('Dashboard');
                                } catch (err) {
                                    console.error(err);
                                } finally {
                                    setUpdating(false);
                                }
                            }
                        }
                    ]
                );
                return;
            }
        }

        setUpdating(true);
        try {
            await updateBookingStatus(bookingId, newStatus);
            navigation.replace('Dashboard');
        } catch (err) {
            console.error("Failed to update booking status:", err);
            Alert.alert("Error", "Failed to update booking status. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    const handleDecline = async (bookingId) => {
        setUpdating(true);
        try {
            const partnerId = await AsyncStorage.getItem('partnerId') || formData.partnerId;
            await declineBooking(bookingId, partnerId);
            navigation.replace('Dashboard');
        } catch (err) {
            console.error("Failed to decline booking:", err);
            Alert.alert("Error", "Failed to decline booking. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    // Derive display name
    const partnerName = formData.personalInfo?.name || formData.salonInfo?.name || formData.name || '';
    const firstName = partnerName.split(' ')[0] || 'Partner';
    const lastName = partnerName.split(' ').slice(1).join(' ') || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Partner';

    // Skill categories from onboarding
    const skillCategories = formData.categories || [];

    // real stats from dashboard
    const avgRating = stats?.averageRating || 0;
    const totalReviews = stats?.totalReviews || 0;
    const totalResolved = (stats?.completed || 0) + (stats?.cancelled || 0);
    const completionRate = totalResolved > 0 ? Math.round(((stats?.completed || 0) / totalResolved) * 100) : 100;

    const monthlyEarnings = stats?.earnings || 0;
    const pendingPayout = 0;

    // placeholder services counts
    const activeServices = formData.selectedServices?.filter(s => s.status === 'Approved')?.length ?? 0;
    const underReviewServices = formData.selectedServices?.filter(s => s.status !== 'Approved')?.length ?? 0;

    if (activeTab !== 'Dashboard') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
                <View style={styles.centerContent}>
                    <Text style={styles.placeholderText}>{activeTab} Coming Soon</Text>
                </View>
                <CustomBottomTab
                    activeTab={activeTab}
                    onTabPress={(tabId, screen) => {
                        setActiveTab(tabId);
                        if (screen !== 'Dashboard') navigation.navigate(screen);
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* ─── SECTION 1: Hero Header ────────────────────────────── */}
                <View>
                    <LinearGradient
                        colors={['#0F172A', '#1E293B']}
                        style={styles.heroHeader}
                    >
                        {/* Top row: Logo + Controls */}
                        <View style={styles.heroTopRow}>
                            <View style={styles.brandRow}>
                                <Image source={XALONHUB_LOGO} style={styles.brandLogo} resizeMode="contain" />
                                <Text style={styles.hubText}>HUB</Text>
                            </View>
                            <View style={styles.heroControls}>
                                {/* Online Toggle */}
                                <View style={styles.onlinePill}>
                                    <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
                                    <Text style={[styles.onlineLabel, { color: isOnline ? '#10B981' : '#94A3B8' }]}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </Text>
                                    <Switch
                                        value={isOnline}
                                        onValueChange={onToggleStatus}
                                        trackColor={{ false: '#334155', true: '#064E3B' }}
                                        thumbColor={isOnline ? '#10B981' : '#94A3B8'}
                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                    />
                                </View>
                                {/* Notification */}
                                <TouchableOpacity style={styles.notifBtn}>
                                    <Ionicons name="notifications-outline" size={20} color="#CBD5E1" />
                                    <View style={styles.notifBadge} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Greeting + Rating */}
                        <View style={styles.heroGreetRow}>
                            <View>
                                <Text style={styles.heroGreet}>Welcome back 👋</Text>
                                <Text style={styles.heroName}>{fullName}</Text>
                            </View>
                            <View style={styles.ratingPill}>
                                <Ionicons name="star" size={13} color="#F59E0B" />
                                <Text style={styles.ratingPillText}>{avgRating}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* ─── SECTION 2: KYC Banner ────────────────────────────── */}
                {
                    kycStatus === 'pending' && (
                        <View style={styles.kycPendingBanner}>
                            <Ionicons name="time" size={20} color="#92400E" />
                            <View style={styles.kycBannerBody}>
                                <Text style={styles.kycBannerTitle}>KYC Under Review</Text>
                                <Text style={styles.kycBannerSub}>Our team is reviewing your documents.</Text>
                            </View>
                            <View style={styles.kycBadge}>
                                <Text style={styles.kycBadgeText}>Pending</Text>
                            </View>
                        </View>
                    )
                }
                {
                    kycStatus === 'rejected' && (
                        <TouchableOpacity
                            style={styles.kycRejectedBanner}
                            onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}
                        >
                            <Ionicons name="alert-circle" size={20} color="#991B1B" />
                            <View style={styles.kycBannerBody}>
                                <Text style={[styles.kycBannerTitle, { color: '#991B1B' }]}>KYC Rejected</Text>
                                <Text style={[styles.kycBannerSub, { color: '#B91C1C' }]}>Tap to re-submit your documents.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#991B1B" />
                        </TouchableOpacity>
                    )
                }
                {
                    !kycStatus && (
                        <TouchableOpacity
                            style={styles.kycMissingBanner}
                            onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}
                        >
                            <Ionicons name="document-text-outline" size={20} color="#D97706" />
                            <View style={styles.kycBannerBody}>
                                <Text style={[styles.kycBannerTitle, { color: '#92400E' }]}>Complete Your KYC</Text>
                                <Text style={[styles.kycBannerSub, { color: '#B45309' }]}>Submit documents to start receiving bookings.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#D97706" />
                        </TouchableOpacity>
                    )
                }

                {/* ─── SECTION 3: Today's Snapshot ──────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Overview</Text>
                    <View style={styles.snapshotRow}>
                        <View style={[styles.snapshotCard, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="cash-outline" size={22} color="#10B981" />
                            <Text style={[styles.snapshotValue, { color: '#065F46' }]}>₹{stats?.todayEarnings || 0}</Text>
                            <Text style={styles.snapshotLabel}>Earnings</Text>
                        </View>
                        <View style={[styles.snapshotCard, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
                            <Text style={[styles.snapshotValue, { color: '#1E40AF' }]}>{stats?.todayBookings || 0}</Text>
                            <Text style={styles.snapshotLabel}>Bookings</Text>
                        </View>
                        <View style={[styles.snapshotCard, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="star-outline" size={22} color="#F59E0B" />
                            <Text style={[styles.snapshotValue, { color: '#92400E' }]}>{avgRating}</Text>
                            <Text style={styles.snapshotLabel}>Avg Rating</Text>
                        </View>
                        <View style={[styles.snapshotCard, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#7C3AED" />
                            <Text style={[styles.snapshotValue, { color: '#4C1D95' }]}>{completionRate}%</Text>
                            <Text style={styles.snapshotLabel}>Completion</Text>
                        </View>
                    </View>
                </View>

                {/* ─── SECTION 4: Earnings Overview ─────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Earnings</Text>
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.earningsCard}
                    >
                        <View style={styles.earningsTopRow}>
                            <View>
                                <Text style={styles.earningsLabel}>This Month</Text>
                                <Text style={styles.earningsAmount}>₹{monthlyEarnings.toLocaleString('en-IN')}</Text>
                            </View>
                            <TouchableOpacity style={styles.withdrawBtn}>
                                <Text style={styles.withdrawBtnText}>Withdraw</Text>
                                <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.earningsDivider} />

                        <View style={styles.earningsBottomRow}>
                            <View style={styles.earningsStat}>
                                <Text style={styles.earningsStatLabel}>Pending Payout</Text>
                                <Text style={styles.earningsStatValue}>₹{pendingPayout}</Text>
                            </View>
                            <View style={[styles.earningsStat, { alignItems: 'flex-end' }]}>
                                <Text style={styles.earningsStatLabel}>Commission Deducted</Text>
                                <View style={styles.feeLinkRow}>
                                    <Text style={styles.earningsStatValue}>₹{stats?.commission || 0}</Text>
                                    <Ionicons name="information-circle" size={13} color="#C4B5FD" />
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Today's Schedule - Consolidated Horizontal List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AddBooking')}>
                            <Text style={styles.addBookingLink}>+ Add Booking</Text>
                        </TouchableOpacity>
                    </View>

                    {(requestedBookings.length + confirmedBookings.length) > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                            {[...requestedBookings, ...confirmedBookings].map(item => {
                                const isRequested = item.status === 'Requested';
                                const isConfirmed = item.status === 'Confirmed';
                                
                                const dist = haversineKm(
                                    formData.location?.lat, formData.location?.lng,
                                    item.bookingLat, item.bookingLng
                                );
                                const distStr = formatDistance(dist);

                                return (
                                    <View key={item.id} style={[styles.bookingCard, { width: 300 }]}>
                                        <View style={styles.bookingCardTop}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.bookingClientName, { marginBottom: 2 }]} numberOfLines={1}>
                                                    {item.customer?.name || item.guestName || item.client?.name || 'Customer'}
                                                </Text>
                                                <View style={[styles.statusChip, { backgroundColor: isRequested ? '#FEF3C7' : '#ECFDF5', alignSelf: 'flex-start' }]}>
                                                    <Text style={[styles.statusChipText, { color: isRequested ? '#92400E' : '#059669', fontSize: 10 }]}>
                                                        {item.status}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.timelineTime}>{item.timeSlot || 'Anytime'}</Text>
                                        </View>

                                        {distStr && (
                                            <View style={styles.distanceRow}>
                                                <MaterialIcons name="near-me" size={14} color={colors.primary} />
                                                <Text style={styles.distanceText}>{distStr} away</Text>
                                            </View>
                                        )}

                                        <View style={styles.bookingServicesList}>
                                            {(item.services || []).slice(0, 2).map((s, idx) => (
                                                <View key={idx} style={styles.bookingServiceItem}>
                                                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                                                    <Text style={styles.bookingServiceText} numberOfLines={1}>
                                                        {s.serviceName} {s.quantity > 1 ? `x${s.quantity}` : ''}
                                                    </Text>
                                                </View>
                                            ))}
                                            {item.services?.length > 2 && (
                                                <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                                                    +{item.services.length - 2} more
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.jobValueRow}>
                                            <Text style={styles.jobValueLabel}>Earnings</Text>
                                            <Text style={styles.jobValueAmount}>₹{(item.totalAmount || 0) - (item.platformFee || 0)}</Text>
                                        </View>

                                        <View style={styles.actionRow}>
                                            {isRequested ? (
                                                <>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.declineBtn]}
                                                        onPress={() => handleDecline(item.id)}
                                                        disabled={updating}
                                                    >
                                                        <Text style={styles.declineBtnText}>Decline</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.acceptBtn]}
                                                        onPress={() => handleUpdateStatus(item.id, 'Confirmed')}
                                                        disabled={updating}
                                                    >
                                                        <Text style={styles.acceptBtnText}>Accept</Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : item.status === 'Confirmed' ? (
                                                <>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.directionBtn]}
                                                        onPress={() => openMaps(item.bookingLat, item.bookingLng, item.customer?.name || 'Customer')}
                                                    >
                                                        <MaterialIcons name="directions" size={18} color={colors.primary} />
                                                        <Text style={styles.directionBtnText}>Directions</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.startBtn]}
                                                        onPress={() => handleUpdateStatus(item.id, 'InProgress')}
                                                        disabled={updating}
                                                    >
                                                        <Text style={styles.startBtnText}>Start Job</Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : item.status === 'InProgress' ? (
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]} // Indigo for completion
                                                    onPress={() => handleUpdateStatus(item.id, 'Completed')}
                                                    disabled={updating}
                                                >
                                                    <Ionicons name="checkmark-done" size={18} color="#FFF" />
                                                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Complete Job</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.completedBanner}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                                                    <Text style={styles.completedText}>Completed</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyScheduleCard}>
                            <Ionicons name="calendar-clear-outline" size={40} color="#CBD5E1" />
                            <Text style={styles.emptyScheduleTitle}>No bookings for today</Text>
                            <Text style={styles.emptyScheduleSub}>When you get booked, it will appear here.</Text>
                        </View>
                    )}
                </View>

                {/* ─── SECTION 6: Ratings & Reviews ─────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Feedback')}>
                            <Text style={styles.addBookingLink}>View All →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.ratingsCard}>
                        <View style={styles.ratingsLeft}>
                            <Text style={styles.ratingsBigNumber}>{avgRating}</Text>
                            <Stars rating={avgRating} size={16} />
                            <Text style={styles.ratingsCount}>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</Text>
                        </View>
                        <View style={styles.ratingsDivider} />
                        <View style={styles.ratingsRight}>
                            {[5, 4, 3, 2, 1].map(star => (
                                <View key={star} style={styles.ratingBarRow}>
                                    <Text style={styles.ratingBarLabel}>{star}</Text>
                                    <View style={styles.ratingBarBg}>
                                        <View style={[styles.ratingBarFill, { width: '0%' }]} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.reviewEmptyState}>
                        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#CBD5E1" />
                        <Text style={styles.reviewEmptyText}>No reviews yet. Complete your first job!</Text>
                    </View>
                </View>

                {/* ─── SECTION 7: Performance Insights ──────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Insights</Text>
                    <View style={styles.insightsGrid}>
                        <View style={styles.insightCard}>
                            <View style={styles.insightTop}>
                                <Ionicons name="trending-up" size={20} color="#10B981" />
                                <Text style={styles.insightDelta}>0 this week</Text>
                            </View>
                            <Text style={styles.insightValue}>0</Text>
                            <Text style={styles.insightLabel}>Bookings vs last week</Text>
                        </View>

                        <View style={styles.insightCard}>
                            <View style={styles.insightTop}>
                                <Ionicons name="ribbon-outline" size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.insightValue}>—</Text>
                            <Text style={styles.insightLabel}>Top Service</Text>
                        </View>

                        <View style={styles.insightCard}>
                            <View style={styles.insightTop}>
                                <Ionicons name="eye-outline" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.insightValue}>0</Text>
                            <Text style={styles.insightLabel}>Profile Views</Text>
                        </View>

                        <View style={styles.insightCard}>
                            <View style={styles.insightTop}>
                                <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
                            </View>
                            <Text style={styles.insightValue}>₹0</Text>
                            <Text style={styles.insightLabel}>Avg Job Value</Text>
                        </View>
                    </View>
                </View>

                {/* ─── SECTION 8: My Services (Read-Only) ───────────────── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>My Services</Text>
                    <View style={styles.servicesCard}>
                        {/* Skill categories */}
                        <Text style={styles.servicesSubLabel}>My Skills</Text>
                        <View style={styles.categoryChipsRow}>
                            {skillCategories.length > 0 ? skillCategories.map((cat, idx) => (
                                <View key={idx} style={styles.categoryChip}>
                                    <Text style={styles.categoryChipText}>{cat}</Text>
                                </View>
                            )) : (
                                <Text style={styles.noSkillsText}>No skills added yet</Text>
                            )}
                        </View>

                        <View style={styles.servicesDivider} />

                        {/* Active / Under Review counts */}
                        <View style={styles.servicesCountRow}>
                            <View style={styles.servicesCountItem}>
                                <View style={[styles.servicesCountDot, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.servicesCountLabel}>Active Services</Text>
                                <Text style={styles.servicesCountValue}>{activeServices}</Text>
                            </View>
                            <View style={styles.servicesCountItem}>
                                <View style={[styles.servicesCountDot, { backgroundColor: '#F59E0B' }]} />
                                <Text style={styles.servicesCountLabel}>Under Review</Text>
                                <Text style={styles.servicesCountValue}>{underReviewServices}</Text>
                            </View>
                        </View>

                        <View style={styles.servicesReadOnlyNote}>
                            <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                            <Text style={styles.servicesReadOnlyText}>
                                Services are managed by XalonHub admin
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView >

            {/* Custom Bottom Tab Bar */}
            < CustomBottomTab
                activeTab={activeTab}
                onTabPress={(tabId, screen) => {
                    setActiveTab(tabId);
                    if (screen !== 'Dashboard') navigation.navigate(screen);
                }
                }
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 16, color: '#64748B' },

    // ── Hero Header ──────────────────────────────────────────────────────────
    heroHeader: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 16 : 12,
        paddingBottom: 24,
        gap: 20,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandLogo: {
        width: 110,
        height: 36,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    hubText: { fontSize: 16, fontWeight: '800', color: colors.white, marginLeft: 6, letterSpacing: 1.5, marginTop: 4 },
    heroControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    onlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    onlineDot: { width: 7, height: 7, borderRadius: 4 },
    onlineLabel: { fontSize: 12, fontWeight: '600' },
    notifBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    heroGreetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    heroGreet: { fontSize: 13, color: '#94A3B8', marginBottom: 2 },
    heroName: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245,158,11,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
    },
    ratingPillText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    // ── KYC Banners ──────────────────────────────────────────────────────────
    kycPendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FEF3C7',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    kycRejectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FEE2E2',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    kycMissingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFBEB',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    kycBannerBody: { flex: 1 },
    kycBannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
    kycBannerSub: { fontSize: 11, color: '#B45309', marginTop: 2 },
    kycBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    kycBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    // ── Shared Section ────────────────────────────────────────────────────────
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    addBookingLink: { fontSize: 13, fontWeight: '600', color: colors.primary },

    // ── Snapshot Cards ────────────────────────────────────────────────────────
    snapshotRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
    snapshotCard: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    snapshotValue: { fontSize: 16, fontWeight: '800' },
    snapshotLabel: { fontSize: 10, color: '#64748B', fontWeight: '500', textAlign: 'center' },

    // ── Earnings Card ─────────────────────────────────────────────────────────
    earningsCard: {
        borderRadius: 20,
        padding: 20,
        gap: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    earningsTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    earningsLabel: { fontSize: 12, color: '#C4B5FD', marginBottom: 4, fontWeight: '500' },
    earningsAmount: { fontSize: 32, fontWeight: '800', color: '#FFF' },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    withdrawBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
    earningsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
    earningsBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
    earningsStat: {},
    earningsStatLabel: { fontSize: 11, color: '#C4B5FD', marginBottom: 4 },
    earningsStatValue: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    feeLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },

    // ── Schedule ──────────────────────────────────────────────────────────────
    emptyScheduleCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    emptyScheduleTitle: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    emptyScheduleSub: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
    bookingTimelineItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    timelineLeft: { alignItems: 'center', width: 50 },
    timelineTime: { fontSize: 11, color: '#64748B', fontWeight: '600', textAlign: 'center' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 6 },
    bookingCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    bookingCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookingClientName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    statusChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusChipText: { fontSize: 11, color: '#3B82F6', fontWeight: '600' },
    bookingService: { fontSize: 13, color: '#64748B' },
    startJobBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    distanceText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    bookingServicesList: { marginTop: 12, gap: 6 },
    bookingServiceItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
    bookingServiceText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    jobValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    jobValueLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    jobValueAmount: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    actionBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
    declineBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
    declineBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 14 },
    acceptBtn: { backgroundColor: '#0F172A' },
    acceptBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    directionBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    directionBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
    startBtn: { backgroundColor: '#10B981' },
    startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    completedBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ECFDF5', height: 44, borderRadius: 10 },
    completedText: { color: '#059669', fontWeight: '700', fontSize: 14 },

    // ── Ratings ───────────────────────────────────────────────────────────────
    ratingsCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    ratingsLeft: { alignItems: 'center', justifyContent: 'center', gap: 6, width: 80 },
    ratingsBigNumber: { fontSize: 40, fontWeight: '800', color: '#0F172A' },
    ratingsCount: { fontSize: 11, color: '#94A3B8' },
    ratingsDivider: { width: 1, backgroundColor: '#F1F5F9' },
    ratingsRight: { flex: 1, gap: 6, justifyContent: 'center' },
    ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ratingBarLabel: { fontSize: 11, color: '#64748B', width: 10 },
    ratingBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    ratingBarFill: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 3,
    },
    reviewEmptyState: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
    },
    reviewEmptyText: { fontSize: 13, color: '#94A3B8', flex: 1 },

    // ── Performance Insights ──────────────────────────────────────────────────
    insightsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    insightCard: {
        width: '47%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    insightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    insightDelta: { fontSize: 10, color: '#10B981', fontWeight: '600' },
    insightValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
    insightLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

    // ── My Services ───────────────────────────────────────────────────────────
    servicesCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 18,
        gap: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    servicesSubLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
    categoryChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
        backgroundColor: colors.primaryLight,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    categoryChipText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    noSkillsText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
    servicesDivider: { height: 1, backgroundColor: '#F1F5F9' },
    servicesCountRow: { flexDirection: 'row', gap: 20 },
    servicesCountItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    servicesCountDot: { width: 10, height: 10, borderRadius: 5 },
    servicesCountLabel: { fontSize: 13, color: '#64748B', flex: 1 },
    servicesCountValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    servicesReadOnlyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
    },
    servicesReadOnlyText: { fontSize: 11, color: '#94A3B8', flex: 1 },
});
