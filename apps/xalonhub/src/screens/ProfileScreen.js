import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, ScrollView, Alert, Modal, Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { sendVerificationEmail, getPartnerProfile } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREELANCER_SECTIONS, SALON_SECTIONS } from '../config/profileMenuConfig';
import CustomBottomTab from '../components/CustomBottomTab';
import * as Linking from 'expo-linking';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const FREELANCER_DATA = {
    name: 'Sindhu',
    email: 'hero.iyyapa@gmail.com',
    emailVerified: false,
    avatarInitial: 'S',
    subscriptionActive: false,
};

const SALON_DATA = {
    name: 'Sudhan Salon',
    email: 'salonxpressryr025@gmail.com',
    emailVerified: false,
    rating: 0,
    reviews: 0,
};

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

function PlainRow({ icon, label, onPress, disabled }) {
    return (
        <TouchableOpacity
            style={[styles.settingsItem, disabled && { opacity: 0.5 }]}
            onPress={disabled ? null : onPress}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <View style={styles.settingsItemLeft}>
                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={20} color={disabled ? "#94A3B8" : "#1E293B"} />
                </View>
                <Text style={[styles.itemLabel, disabled && { color: "#94A3B8" }]}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </TouchableOpacity>
    );
}

function ToggleRow({ icon, label, value, onToggle }) {
    return (
        <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={20} color="#1E293B" />
                </View>
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#E2E8F0', true: colors.primary + '80' }}
                thumbColor={value ? colors.primary : '#FFF'}
            />
        </View>
    );
}

function AccountCard({ item, onPress }) {
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.accountCard, { backgroundColor: item.cardColor }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardIconBox}>
                        <Ionicons name={item.icon} size={28} color={item.textColor} />
                    </View>
                    <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                            <Text style={[styles.cardTitle, { color: item.textColor }]}>{item.label}</Text>
                            {item.badge && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.badge}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.cardSubtitle, { color: item.textColor + 'E6' }]}>{item.subtext}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={item.textColor} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, route }) {
    const { formData, updateFormData, syncCloudDraftToLocal } = useOnboarding();
    const userType = route?.params?.userType || formData.workPreference || 'freelancer';
    const isSalon = userType === 'salon';
    const SECTIONS = isSalon ? SALON_SECTIONS : FREELANCER_SECTIONS;
    const kycStatus = formData.kycStatus; // kept as fallback
    const [liveKycStatus, setLiveKycStatus] = useState(null);
    const effectiveKycStatus = liveKycStatus || kycStatus;

    useFocusEffect(
        useCallback(() => {
            const fetchKycStatus = async () => {
                try {
                    let partnerId = await AsyncStorage.getItem('partnerId');
                    if (!partnerId && formData.partnerId) {
                        partnerId = formData.partnerId;
                    }
                    if (!partnerId) return;
                    const res = await getPartnerProfile(partnerId);
                    const docs = res?.data?.documents;
                    const effectiveStatus = res?.data?.kycStatus || docs?.kycStatus;
                    if (effectiveStatus) setLiveKycStatus(effectiveStatus);
                    if (res?.data) {
                        await syncCloudDraftToLocal(res.data);
                    }
                } catch (e) { /* silently fail */ }
            };
            fetchKycStatus();
        }, [syncCloudDraftToLocal])
    );

    const [verifying, setVerifying] = useState(false);
    const [maskBank, setMaskBank] = useState(true);
    const [logoutModal, setLogoutModal] = useState(false);


    const bankData = formData.kyc?.bank || {
        bankName: 'Not Provided',
        accName: 'Not Provided',
        accNum: '',
        ifsc: 'Not Provided'
    };

    const socialLinks = formData.professional || {
        facebook: '',
        instagram: '',
        youtube: ''
    };

    // A link is "active" only if the user entered a real URL (not empty, not a generic placeholder)
    const GENERIC_PLACEHOLDERS = [
        'https://facebook.com/', 'https://facebook.com',
        'https://instagram.com/', 'https://instagram.com',
        'https://youtube.com/', 'https://youtube.com', 'https://youtube.com/c/',
    ];
    const isValidSocialLink = (url) => {
        if (!url || url.trim() === '') return false;
        if (GENERIC_PLACEHOLDERS.includes(url.trim())) return false;
        return true;
    };
    const openSocialLink = (url) => {
        if (!isValidSocialLink(url)) return;
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        Linking.openURL(finalUrl);
    };

    // Prepare profile display data
    const profileData = isSalon ? {
        name: formData.salonInfo?.name || '',
        email: formData.salonInfo?.email || '',
        emailVerified: formData.emailVerified,
        rating: 0,
        reviews: 0
    } : {
        name: formData.personalInfo?.name || '',
        email: formData.personalInfo?.email || '',
        emailVerified: formData.emailVerified,
        avatarInitial: (formData.personalInfo?.name || 'U').charAt(0).toUpperCase(),
        profileImg: formData.personalInfo?.profileImg || null,
        subscriptionActive: formData.isOnboarded
    };

    const handleVerifyEmail = async () => {
        if (!profileData.email) {
            Alert.alert('Error', 'No email address found to verify.');
            return;
        }
        setVerifying(true);
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            if (!currentUser || !currentUser.id) throw new Error('User details not found');

            await sendVerificationEmail(profileData.email, currentUser.id);
            Alert.alert('Success', 'Verification email sent! Please check your inbox (and spam folder).');
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not send verification email.');
        } finally {
            setVerifying(false);
        }
    };

    const handleNav = (screen) => {
        if (!screen) return;
        const valid = navigation.getState().routeNames.includes(screen);
        if (valid) {
            navigation.navigate(screen, { isEdit: true });
        } else {
            Alert.alert('Coming Soon', 'This feature is coming soon!');
        }
    };

    const renderItem = (item, index, length) => {
        if (item.type === 'card') {
            return (
                <View key={item.id} style={{ marginBottom: 16 }}>
                    <AccountCard item={item} onPress={() => handleNav(item.screen)} />
                </View>
            );
        }

        const isLast = index === length - 1;
        const isSocialLink = item.id === 'f_social' || item.id === 's_social';
        const isProfileMissing = isSalon ? !formData.salonInfo?.name : !formData.personalInfo?.name;
        const isDisabled = isSocialLink && isProfileMissing;

        const content = item.type === 'toggle'
            ? null // No toggles currently defined in config
            : <PlainRow
                icon={item.icon}
                label={item.label}
                disabled={isDisabled}
                onPress={() => {
                    if (item.action === 'rate') Alert.alert('Rate Us', 'Opening app store...');
                    else if (item.action === 'openUrl' && item.url) Linking.openURL(item.url);
                    else handleNav(item.screen);
                }}
            />;

        return (
            <View key={item.id}>
                {content}
                {!isLast && <View style={styles.divider} />}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            {!isSalon && (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                </View>
            )}

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Hero: Salon ────────────────────────────────────────────── */}
                {isSalon && (
                    <View style={styles.salonHero}>
                        <View style={styles.coverPhotoContainer}>
                            {formData.salonCover?.banner || formData.salonCover?.outside?.[0] || formData.salonCover?.inside?.[0] || formData.documents?.shopFrontImg ? (
                                <Image
                                    source={{ uri: formData.salonCover?.banner || formData.salonCover?.outside?.[0] || formData.salonCover?.inside?.[0] || formData.documents?.shopFrontImg }}
                                    style={styles.coverPhoto}
                                />
                            ) : (
                                <View style={styles.coverPlaceholder} />
                            )}
                            <TouchableOpacity style={styles.addCoverBtn} onPress={() => navigation.navigate('SalonCoverUpload', { isEdit: true })}>
                                <Text style={styles.addCoverText}>
                                    {formData.salonCover?.banner || formData.salonCover?.outside?.[0] || formData.salonCover?.inside?.[0] || formData.documents?.shopFrontImg ? 'Change Gallery' : 'Add Gallery'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.logoCircleContainer}>
                                <TouchableOpacity
                                    style={styles.logoCircle}
                                    onPress={() => navigation.navigate('SalonCoverUpload', { isEdit: true })}
                                >
                                    {formData.salonCover?.logo || formData.documents?.shopBanner ? (
                                        <Image source={{ uri: formData.salonCover?.logo || formData.documents?.shopBanner }} style={styles.logoImg} />
                                    ) : (
                                        <>
                                            <Ionicons name="camera" size={24} color="#64748B" />
                                            <Text style={styles.logoText}>Add logo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.salonInfoBox}>
                            <Text style={styles.profileName}>{profileData.name}</Text>
                            <View style={styles.emailRow}>
                                <Text style={styles.profileEmail}>{profileData.email}</Text>
                                {profileData.emailVerified ? (
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                        <Text style={styles.verifiedText}>Verified</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity onPress={handleVerifyEmail} disabled={verifying}>
                                        <Text style={styles.verifyLink}>  Verify Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* KYC Status Badge */}
                            <View style={styles.kycBadgeRow}>
                                {!effectiveKycStatus && (
                                    <TouchableOpacity
                                        style={[styles.kycBadge, styles.kycBadgePending]}
                                        onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}
                                    >
                                        <Ionicons name="document-text-outline" size={14} color="#92400E" />
                                        <Text style={[styles.kycBadgeText, { color: '#92400E' }]}>Complete KYC</Text>
                                    </TouchableOpacity>
                                )}
                                {effectiveKycStatus === 'pending' && (
                                    <View style={[styles.kycBadge, styles.kycBadgeAmber]}>
                                        <Ionicons name="time" size={14} color="#92400E" />
                                        <Text style={[styles.kycBadgeText, { color: '#92400E' }]}>Under Review</Text>
                                    </View>
                                )}
                                {effectiveKycStatus === 'approved' && (
                                    <View style={[styles.kycBadge, styles.kycBadgeGreen]}>
                                        <Ionicons name="checkmark-circle" size={14} color="#065F46" />
                                        <Text style={[styles.kycBadgeText, { color: '#065F46' }]}>KYC Verified</Text>
                                    </View>
                                )}
                                {effectiveKycStatus === 'rejected' && (
                                    <TouchableOpacity
                                        style={[styles.kycBadge, styles.kycBadgeRed]}
                                        onPress={() => navigation.navigate('DocumentUpload', { isEdit: true })}
                                    >
                                        <Ionicons name="close-circle" size={14} color="#991B1B" />
                                        <Text style={[styles.kycBadgeText, { color: '#991B1B' }]}>Rejected – Retry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Social Links Row */}
                            <View style={styles.socialIconsRow}>
                                <TouchableOpacity
                                    style={[styles.socialIcon, !isValidSocialLink(socialLinks.instagram) && styles.disabledIcon]}
                                    disabled={!isValidSocialLink(socialLinks.instagram)}
                                    activeOpacity={0.7}
                                    onPress={() => openSocialLink(socialLinks.instagram)}
                                >
                                    <Ionicons name="logo-instagram" size={20} color={isValidSocialLink(socialLinks.instagram) ? '#E1306C' : '#94A3B8'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.socialIcon, !isValidSocialLink(socialLinks.facebook) && styles.disabledIcon]}
                                    disabled={!isValidSocialLink(socialLinks.facebook)}
                                    activeOpacity={0.7}
                                    onPress={() => openSocialLink(socialLinks.facebook)}
                                >
                                    <Ionicons name="logo-facebook" size={20} color={isValidSocialLink(socialLinks.facebook) ? '#4267B2' : '#94A3B8'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.socialIcon, !isValidSocialLink(socialLinks.youtube) && styles.disabledIcon]}
                                    disabled={!isValidSocialLink(socialLinks.youtube)}
                                    activeOpacity={0.7}
                                    onPress={() => openSocialLink(socialLinks.youtube)}
                                >
                                    <Ionicons name="logo-youtube" size={20} color={isValidSocialLink(socialLinks.youtube) ? '#FF0000' : '#94A3B8'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Hero: Freelancer ───────────────────────────────────────── */}
                {!isSalon && (
                    <View style={styles.freelancerHero}>
                        <View style={styles.avatar}>
                            {profileData.profileImg ? (
                                <Image source={{ uri: profileData.profileImg }} style={{ width: 76, height: 76, borderRadius: 38 }} />
                            ) : (
                                <Text style={styles.avatarInitial}>{profileData.avatarInitial}</Text>
                            )}
                        </View>
                        <Text style={styles.profileName}>{profileData.name}</Text>
                        <View style={styles.emailRow}>
                            <Text style={styles.profileEmail}>{profileData.email}</Text>
                            {profileData.emailVerified ? (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={handleVerifyEmail} disabled={verifying}>
                                    <Text style={styles.verifyLink}>  Verify Now</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Social Links Row */}
                        <View style={styles.socialIconsRow}>
                            <TouchableOpacity
                                style={[styles.socialIcon, !isValidSocialLink(socialLinks.instagram) && styles.disabledIcon]}
                                disabled={!isValidSocialLink(socialLinks.instagram)}
                                activeOpacity={0.7}
                                onPress={() => openSocialLink(socialLinks.instagram)}
                            >
                                <Ionicons name="logo-instagram" size={20} color={isValidSocialLink(socialLinks.instagram) ? '#E1306C' : '#94A3B8'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, !isValidSocialLink(socialLinks.facebook) && styles.disabledIcon]}
                                disabled={!isValidSocialLink(socialLinks.facebook)}
                                activeOpacity={0.7}
                                onPress={() => openSocialLink(socialLinks.facebook)}
                            >
                                <Ionicons name="logo-facebook" size={20} color={isValidSocialLink(socialLinks.facebook) ? '#4267B2' : '#94A3B8'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, !isValidSocialLink(socialLinks.youtube) && styles.disabledIcon]}
                                disabled={!isValidSocialLink(socialLinks.youtube)}
                                activeOpacity={0.7}
                                onPress={() => openSocialLink(socialLinks.youtube)}
                            >
                                <Ionicons name="logo-youtube" size={20} color={isValidSocialLink(socialLinks.youtube) ? '#FF0000' : '#94A3B8'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── Banner: Freelancer Subscription ────────────────────────── */}
                {!isSalon && !profileData.subscriptionActive && (
                    <View style={styles.subscriptionBanner}>
                        <View>
                            <Text style={styles.subLabel}>At Home Subscription</Text>
                        </View>
                        <TouchableOpacity style={styles.payNowBtn} onPress={() => handleNav('SubscriptionPayment')}>
                            <Text style={styles.payNowText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Dynamic Config Sections ────────────────────────────────── */}
                {SECTIONS.map((section) => (
                    <View key={section.id} style={styles.sectionContainer}>
                        {section.title && <SectionHeader title={section.title} subtitle={section.subtitle} />}

                        {section.type === 'accountInfo' ? (
                            // Account Info special card layout
                            <View style={styles.accountInfoWrapper}>
                                {(section.items || []).map((item, idx) => renderItem(item, idx, section.items.length))}
                            </View>
                        ) : (
                            // Standard white card layout
                            <View style={styles.settingsCard}>
                                {(section.items || []).map((item, idx) => renderItem(item, idx, section.items.length))}
                            </View>
                        )}
                    </View>
                ))}


                {/* ── Logout ─────────────────────────────────────────────────── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModal(true)} activeOpacity={0.85}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 80 }} />
            </ScrollView>

            <CustomBottomTab
                activeTab="Profile"
                onTabPress={(tabId, screen) => {
                    if (screen === 'Profile') return;
                    navigation.navigate(screen);
                }}
            />

            {/* Logout Modal */}
            <Modal visible={logoutModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Logout?</Text>
                        <Text style={styles.modalDesc}>Are you sure you want to log out of your account?</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLogoutModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalLogoutBtn} onPress={() => { setLogoutModal(false); navigation.navigate('Login'); }}>
                                <Text style={styles.modalLogoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    notifBtn: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
    },
    salonNotifBtn: { position: 'absolute', top: 10, right: 16, zIndex: 10, backgroundColor: '#FFF' },
    notifIcon: { fontSize: 18 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },

    // Salon Hero
    salonHero: { marginBottom: 20, alignItems: 'center' },
    coverPhotoContainer: {
        width: '100%', height: 160, backgroundColor: '#F1F5F9',
        borderRadius: 16, marginBottom: 50, position: 'relative'
    },
    coverPlaceholder: { flex: 1, borderRadius: 16 },
    addCoverBtn: {
        position: 'absolute', top: 12, left: 12, backgroundColor: '#000',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    },
    addCoverText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    logoCircleContainer: {
        position: 'absolute', bottom: -45, left: '50%',
        marginLeft: -45, width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#EAEAEA', borderWidth: 4, borderColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
    },
    logoCircle: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 45, overflow: 'hidden' },
    coverPhoto: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
    logoImg: { width: '100%', height: '100%', borderRadius: 45, resizeMode: 'cover' },
    logoIcon: { fontSize: 24, color: '#64748B' },
    logoText: { fontSize: 10, color: '#333', marginTop: 4, fontWeight: '500' },
    salonInfoBox: { alignItems: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    starIcon: { color: colors.primary, fontSize: 16, marginRight: 4 },
    ratingText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
    reviewLink: { color: '#1E293B', fontSize: 14, textDecorationLine: 'underline', marginLeft: 4, fontWeight: '500' },

    // Freelancer Hero
    freelancerHero: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#FFF', borderWidth: 2, borderColor: '#ECC94B',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
    },
    avatarInitial: { fontSize: 32, fontWeight: '700', color: colors.primary },

    profileName: { fontSize: 22, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
    emailRow: { flexDirection: 'row', alignItems: 'center' },
    profileEmail: { fontSize: 13, color: '#475569' },
    verifyLink: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    verifiedText: { fontSize: 12, color: '#10B981', fontWeight: '700', marginLeft: 2 },

    // Subscription Banner
    subscriptionBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    subLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    payNowBtn: { backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
    payNowText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    // Sections
    sectionContainer: { marginBottom: 24 },
    sectionHeader: { marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
    sectionSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },

    // Standard card list
    settingsCard: {
        backgroundColor: '#F8FAFC', borderRadius: 12,
        paddingVertical: 4,
    },
    settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
    settingsItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    iconBox: { width: 24, alignItems: 'center' },
    itemIcon: { fontSize: 20, color: '#1E293B' },
    itemLabel: { fontSize: 15, color: '#1E293B', fontWeight: '500', flex: 1 },
    chevron: { fontSize: 22, color: '#94A3B8', fontWeight: '300' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

    // Account Info Cards (Salon)
    accountInfoWrapper: { gap: 12 },
    accountCard: { borderRadius: 12, padding: 16, paddingVertical: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    cardIconBox: { marginRight: 14 },
    cardIcon: { fontSize: 28 },
    cardInfo: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginRight: 8 },
    badge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    cardSubtitle: { fontSize: 14, lineHeight: 20 },

    // Logout
    logoutBtn: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0E7FF' },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: '100%' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    modalDesc: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    modalLogoutBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
    modalLogoutText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

    // Social Links
    socialIconsRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
    socialIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0'
    },
    disabledIcon: { opacity: 0.4 },

    // KYC Badge
    kycBadgeRow: { flexDirection: 'row', marginTop: 14 },
    kycBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    kycBadgePending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
    kycBadgeAmber: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
    kycBadgeGreen: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
    kycBadgeRed: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
    kycBadgeText: { fontSize: 13, fontWeight: '700' },

    // Bank Card (kept for potential future use in BankDetailsScreen)
    bankCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    bankLabel: { fontSize: 13, color: '#64748B' },
    bankValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    maskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    maskBtn: { padding: 4 }
});
