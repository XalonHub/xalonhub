import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { CATEGORIES, SERVICES_BY_CATEGORY } from '../constants/servicesData';

export default function ServiceCategoryScreen({ navigation }) {
    const { formData, updateFormData } = useOnboarding();

    const isFreelancer = formData.workPreference === 'freelancer';

    // ── Freelancer state ───────────────────────────────────────────────────────
    const selectedCategories = formData.categories || []; // string[] of category names

    const isFreelancerCategorySelected = (catName) =>
        selectedCategories.includes(catName);

    const toggleFreelancerCategory = async (catName) => {
        const updated = isFreelancerCategorySelected(catName)
            ? selectedCategories.filter(c => c !== catName)
            : [...selectedCategories, catName];
        await updateFormData('categories', updated);
    };

    // ── Salon state ────────────────────────────────────────────────────────────
    const gender = formData.onboardingGender || 'Male';
    const selectedServices = formData.salonServices || [];

    const toggleGender = (g) => {
        updateFormData('onboardingGender', g);
    };

    const isSalonCategorySelected = (catName) =>
        selectedServices.some(s => s.category === catName && s.gender === gender);

    const countSelectedInCategory = (catName) =>
        selectedServices.filter(s => s.category === catName && s.gender === gender).length;

    const hasServicesInCategory = (categoryId) => {
        const services = SERVICES_BY_CATEGORY[gender]?.[categoryId] || [];
        return services.length > 0;
    };

    // ── Freelancer Next handler ────────────────────────────────────────────────
    const handleFreelancerNext = async () => {
        // Categories already saved reactively via updateFormData above.
        // Navigate to professional details first
        await updateFormData('lastScreen', 'ProfessionalDetails');
        navigation.navigate('ProfessionalDetails');
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>
                        {isFreelancer ? 'Select Your Skills' : 'Services'}
                    </Text>
                    {isFreelancer && (
                        <Text style={styles.headerSubtitle}>
                            Choose the categories you can provide
                        </Text>
                    )}
                </View>
                <View style={{ width: 32 }} />
            </View>

            <View style={styles.indigoLine} />

            {/* Gender Toggle — Salon only */}
            {!isFreelancer && (
                <View style={styles.genderRow}>
                    {['Male', 'Female'].map(g => (
                        <TouchableOpacity
                            key={g}
                            style={styles.genderOption}
                            onPress={() => toggleGender(g)}
                        >
                            <View style={[styles.radioOuter, gender === g && styles.radioActive]}>
                                {gender === g && <View style={styles.radioInner} />}
                            </View>
                            <Text style={styles.genderLabel}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Freelancer info banner */}
            {isFreelancer && (
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
                    <Text style={styles.infoBannerText}>
                        Services, pricing &amp; availability will be managed by XalonHub admin.
                    </Text>
                </View>
            )}

            <ScrollView style={styles.content} contentContainerStyle={styles.listContainer}>
                {CATEGORIES.map(category => {
                    const isSelected = isFreelancer
                        ? isFreelancerCategorySelected(category.name)
                        : isSalonCategorySelected(category.name);

                    const count = isFreelancer ? null : countSelectedInCategory(category.name);
                    const hasServices = isFreelancer ? true : hasServicesInCategory(category.id);

                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.catListItem,
                                isSelected && styles.catListItemActive,
                                !hasServices && styles.catListItemDisabled
                            ]}
                            onPress={() => {
                                if (!hasServices) return;
                                if (isFreelancer) {
                                    toggleFreelancerCategory(category.name);
                                } else {
                                    navigation.navigate('ServiceSelection', { categoryId: category.id });
                                }
                            }}
                            activeOpacity={hasServices ? 0.7 : 1}
                        >
                            {/* Left: Thumbnail */}
                            <View style={[styles.listThumbnailContainer, !hasServices && { opacity: 0.5 }]}>
                                <Image source={{ uri: category.thumbnail }} style={styles.listThumbnail} />
                                {isSelected && (
                                    <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark" size={12} color="#FFF" />
                                    </View>
                                )}
                            </View>

                            {/* Center: Info */}
                            <View style={styles.listInfo}>
                                <Text style={[styles.catName, !hasServices && styles.catNameDisabled]}>{category.name}</Text>
                                <View style={styles.statusRow}>
                                    {!hasServices ? (
                                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                                    ) : isFreelancer ? (
                                        isSelected ? (
                                            <View style={styles.statusItem}>
                                                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                                <Text style={styles.statusText}>Added as capability</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.noSelectionText}>Tap to add capability</Text>
                                        )
                                    ) : (
                                        isSelected ? (
                                            <>
                                                <View style={styles.statusItem}>
                                                    <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                                    <Text style={styles.statusText}>{count} Selected</Text>
                                                </View>
                                                <View style={styles.statusItem}>
                                                    <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                                                    <Text style={styles.statusText}>In Review</Text>
                                                </View>
                                            </>
                                        ) : (
                                            <Text style={styles.noSelectionText}>No services selected</Text>
                                        )
                                    )}
                                </View>
                            </View>

                            {/* Right: icon */}
                            <View style={styles.chevronContainer}>
                                {isFreelancer ? (
                                    <View style={[
                                        styles.toggleCircle,
                                        isSelected && styles.toggleCircleActive
                                    ]}>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={16} color="#FFF" />
                                        )}
                                    </View>
                                ) : (
                                    hasServices && <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                {isFreelancer ? (
                    <TouchableOpacity
                        style={[styles.nextBtn, selectedCategories.length === 0 && styles.btnDisabled]}
                        onPress={handleFreelancerNext}
                        disabled={selectedCategories.length === 0}
                    >
                        <Text style={styles.nextBtnText}>
                            Next Step → ({selectedCategories.length} selected)
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.nextBtn, selectedServices.length === 0 && styles.btnDisabled]}
                        onPress={async () => {
                            await updateFormData('lastScreen', 'WorkingHours');
                            navigation.navigate('WorkingHours');
                        }}
                        disabled={selectedServices.length === 0}
                    >
                        <Text style={styles.nextBtnText}>Next Step →</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitleGroup: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    headerSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    supportBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    indigoLine: { height: 3, backgroundColor: colors.primary },

    genderRow: {
        flexDirection: 'row', padding: 20, gap: 24,
        borderBottomWidth: 1, borderBottomColor: colors.grayBorder
    },
    genderOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radioOuter: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.grayBorder,
        justifyContent: 'center', alignItems: 'center'
    },
    radioActive: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    genderLabel: { fontSize: 15, fontWeight: '600', color: colors.text },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.secondary + '10',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: colors.secondary,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: colors.secondary,
        fontWeight: '500',
        lineHeight: 18,
    },

    content: { flex: 1 },
    listContainer: { padding: 16, gap: 12 },

    catListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    catListItemActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    catListItemDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        opacity: 0.6,
    },
    listThumbnailContainer: {
        width: 80, height: 80, borderRadius: 16,
        overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative',
    },
    listThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
    checkBadge: {
        position: 'absolute', bottom: -4, right: -4,
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colors.success,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    listInfo: { flex: 1, marginLeft: 20, justifyContent: 'center' },
    catName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    catNameDisabled: { color: '#94A3B8' },
    statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    noSelectionText: { fontSize: 13, color: '#94A3B8', fontWeight: '400' },
    comingSoonText: { fontSize: 13, color: colors.secondary, fontWeight: '700', letterSpacing: 0.5 },
    chevronContainer: { marginLeft: 12, justifyContent: 'center', alignItems: 'center' },

    toggleCircle: {
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 2, borderColor: colors.grayBorder,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    toggleCircleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    footer: {
        padding: 20, backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: colors.grayBorder,
    },
    nextBtn: {
        backgroundColor: colors.black,
        borderRadius: 14, paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    btnDisabled: { backgroundColor: colors.grayLight, opacity: 0.6 },
});
