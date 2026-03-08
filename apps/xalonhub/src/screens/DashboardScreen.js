import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, Switch, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import CustomBottomTab from '../components/CustomBottomTab';
import { useOnboarding } from '../context/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartnerProfile } from '../services/api';
import FreelancerDashboardScreen from './FreelancerDashboardScreen';

export default function DashboardScreen({ navigation }) {
    const { formData, syncCloudDraftToLocal } = useOnboarding();
    const [kycStatus, setKycStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
    const [partnerType, setPartnerType] = useState(null);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isOnline, setIsOnline] = useState(true);
    const [loading, setLoading] = useState(true);

    // isFreelancer is ONLY derived from server data, not formData (to avoid stale state race)
    const isFreelancer = partnerType === 'Freelancer';

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
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
                        await syncCloudDraftToLocal(data);
                    }
                } catch (e) {
                    // Fallback to formData if server fails
                    const fallbackType = formData.workPreference === 'freelancer' ? 'Freelancer' : 'Salon';
                    setPartnerType(fallbackType);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [syncCloudDraftToLocal, formData.partnerId, formData.workPreference])
    );

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

                {/* Earnings & Convenience Fee */}
                <View style={styles.earningsSection}>
                    <View style={styles.earningsRow}>
                        <Text style={styles.earningsAmount}>₹ <Text style={{ fontSize: 28 }}>0</Text></Text>
                        <TouchableOpacity style={styles.withdrawBtn}>
                            <Text style={styles.withdrawBtnText}>Withdraw</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.convenienceFeeRow}>
                        <Text style={styles.convenienceFeeText}>Pending Convenience Fee</Text>
                        <View style={styles.convenienceFeeRight}>
                            <Text style={styles.convenienceFeeText}>₹</Text>
                            <Ionicons name="chevron-forward" size={14} color="#000" />
                        </View>
                    </TouchableOpacity>
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
                        <TouchableOpacity style={styles.viewAllBtn}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Booking Status Summary */}
                <View style={styles.bookingStatusContainer}>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Booked</Text>
                        <Text style={styles.bookingStatusCount}>2 Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ 700</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>In Progress</Text>
                        <Text style={styles.bookingStatusCount}>0 Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ 0</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Completed</Text>
                        <Text style={styles.bookingStatusCount}>0 Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ 0</Text>
                    </View>
                    <View style={styles.bookingStatusCard}>
                        <Text style={styles.bookingStatusLabel}>Cancelled</Text>
                        <Text style={styles.bookingStatusCount}>0 Jobs</Text>
                        <Text style={styles.bookingStatusAmount}>₹ 0</Text>
                    </View>
                </View>

                {/* Active Booking Card */}
                <View style={styles.activeBookingCard}>
                    <Text style={styles.activeBookingName}>Xutdutdud</Text>

                    <View style={styles.activeBookingIdRow}>
                        <Text style={styles.activeBookingIdText}>Booking ID ESHF902-10003</Text>
                        <View style={styles.verticalDivider} />
                        <View style={styles.walkinIconContainer}>
                            <Ionicons name="walk" size={12} color="#FFF" />
                        </View>
                    </View>

                    <Text style={styles.activeBookingLabel}>Booking Date & Time</Text>
                    <Text style={styles.activeBookingValue}>22 Feb 2026, 05:00 pm</Text>

                    <Text style={styles.activeBookingServiceType}>
                        <Text style={{ color: '#0056D2', fontWeight: 'bold' }}>Male </Text>
                        Service Name
                    </Text>
                    <Text style={styles.activeBookingValue}>Hair Cut</Text>

                    <Text style={styles.activeBookingLabel}>Total Bill Amount</Text>
                    <Text style={styles.activeBookingTotalAmount}>₹ 500</Text>

                    <TouchableOpacity style={styles.startJobBtn}>
                        <Text style={styles.startJobBtnText}>Start Job</Text>
                    </TouchableOpacity>
                </View>

                {/* Grid layout */}
                <View style={styles.gridContainer}>
                    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#E4F4C1' }]}>
                        <Text style={styles.gridCardTitle}>Deals & Offers <Ionicons name="chevron-forward" size={12} /></Text>
                        <Ionicons name="pricetag" size={60} color="#D1EA99" style={styles.cardWatermark} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#FCE4ED' }]}>
                        <Text style={styles.gridCardTitle}>Salon Services</Text>
                        <View style={styles.gridCardContent}>
                            <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Active</Text><Text style={styles.gridCardSubCount}>2</Text></View>
                            <View style={styles.gridCardRow}><Text style={styles.gridCardSubText}>Under Review</Text><Text style={styles.gridCardSubCount}>1</Text></View>
                        </View>
                        <Ionicons name="cut" size={50} color="#F3C8D7" style={styles.cardWatermark} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#DADBFA' }]}>
                        <Text style={[styles.gridCardTitle, { marginTop: 6 }]}>Staff</Text>
                        <View style={styles.gridCardContentBottom}>
                            <Text style={styles.gridCardSubText}>Total Staff</Text>
                            <View style={styles.staffCountBadge}><Text style={styles.staffCountText}>1</Text></View>
                        </View>
                        <Ionicons name="people" size={60} color="#C4C6E9" style={styles.cardWatermark} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#F3DBFB', justifyContent: 'center' }]}>
                        <Text style={[styles.gridCardTitle, { textAlign: 'center' }]}>Portfolio <Ionicons name="chevron-forward" size={14} /></Text>
                        <Ionicons name="play-circle" size={80} color="#E8C3F5" style={styles.cardWatermarkCenter} />
                    </TouchableOpacity>
                </View>

                {/* More from billu */}
                <View style={styles.moreSection}>
                    <Text style={styles.moreTitle}>More from XalonHub</Text>
                    <View style={styles.moreList}>
                        <TouchableOpacity style={styles.moreListItem}>
                            <Ionicons name="stats-chart" size={24} color="#000" />
                            <Text style={styles.moreListText}>Performance Summary</Text>
                            <View style={styles.moreListArrow}><Ionicons name="arrow-forward" size={18} color="#0056D2" /></View>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.moreListItem}>
                            <Ionicons name="card" size={20} color="#000" />
                            <Text style={styles.moreListText}>Convenience Fee</Text>
                            <View style={styles.moreListArrow}><Ionicons name="arrow-forward" size={18} color="#0056D2" /></View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Social Media Template Library */}
                <View style={styles.socialHeader}>
                    <Text style={styles.socialTitle}>Social Media Template Library</Text>
                    <TouchableOpacity style={styles.exploreBtn}>
                        <Text style={styles.exploreBtnText}>Explore <Ionicons name="chevron-forward" size={10} color="#FFF" /></Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialScroll}>
                    <View style={styles.socialCard}>
                        {/* Placeholder for social media template image */}
                        <View style={styles.socialImagePlaceholder}>
                            <Ionicons name="person-circle" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                            <Text style={styles.socialSalonName}>Sundhan Beauty Parlour</Text>
                            <Text style={styles.socialTagline}>It's not just a Haircut,</Text>
                            <Text style={styles.socialTaglineBold}>It's an Experience.</Text>
                        </View>
                    </View>
                    <View style={styles.socialCard}>
                        <View style={[styles.socialImagePlaceholder, { borderColor: colors.secondary }]}>
                            <Ionicons name="person-circle" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                            <Text style={styles.socialSalonName}>Sundhan Beauty Parlour</Text>
                            <Text style={styles.socialTagline}>Book an</Text>
                            <Text style={styles.socialTaglineBold}>Appointment</Text>
                        </View>
                    </View>
                </ScrollView>

            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brandContainer}>
                    <Image
                        source={require('../assets/brand/logo_full.png')}
                        style={styles.logoFull}
                        resizeMode="contain"
                    />
                    <Text style={styles.hubText}>HUB</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.onlineToggle}>
                        <Switch
                            value={isOnline}
                            onValueChange={setIsOnline}
                            trackColor={{ false: '#E2E8F0', true: colors.secondary }}
                            thumbColor="#FFF"
                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                        />
                        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons name="notifications" size={20} color="#000" />
                        {/* Notification badge dot */}
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
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
    onlineToggle: { alignItems: 'center', justifyContent: 'center' },
    onlineText: { fontSize: 11, color: '#1E293B', fontWeight: '500', marginTop: -2 },
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
    earningsSection: { gap: 12 },
    earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    earningsAmount: { fontSize: 24, fontWeight: 'bold', color: '#000', lineHeight: 32 },
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
    gridCard: {
        width: '48%', height: 120, borderRadius: 12, padding: 14, overflow: 'hidden'
    },
    gridCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    cardWatermark: { position: 'absolute', bottom: -10, right: -10, opacity: 0.15 },
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

    // Social Media Templates
    socialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    socialTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
    exploreBtn: { backgroundColor: '#1E293B', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    exploreBtnText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
    socialScroll: { paddingVertical: 12, gap: 16 },
    socialCard: { width: 220, height: 280, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
    socialImagePlaceholder: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 10, borderColor: '#000', padding: 10 },
    socialSalonName: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 10, textAlign: 'center' },
    socialTagline: { fontSize: 16, color: '#64748B', fontStyle: 'italic', textAlign: 'center' },
    socialTaglineBold: { fontSize: 18, fontWeight: 'bold', color: '#D6336C', textAlign: 'center', marginTop: 4 },

    tabLabelActive: { color: '#000', fontWeight: '700' }
});
