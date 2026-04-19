import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, TextInput, ScrollView, Alert, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getCatalog } from '../services/api';
import { useOnboarding } from '../context/OnboardingContext';
import { CATEGORIES } from '../constants/servicesData';

// ─── Price Set Modal ──────────────────────────────────────────────────────────
function SetPriceModal({ visible, service, onClose, onSave }) {
    const [price, setPrice] = useState(service?.price?.toString() || '');
    const [specialPrice, setSpecialPrice] = useState(service?.specialPrice?.toString() || '');

    useEffect(() => {
        if (service) {
            setPrice(service.price?.toString() || '');
            setSpecialPrice(service.specialPrice?.toString() || '');
        }
    }, [service]);

    const handleSave = () => {
        if (!price) { Alert.alert('Price Required', 'Please enter a price.'); return; }
        onSave({ ...service, price: parseFloat(price), specialPrice: specialPrice ? parseFloat(specialPrice) : null });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={pm.overlay}>
                <View style={pm.sheet}>
                    <View style={pm.handle} />
                    <Text style={pm.title}>Set Price – {service?.name}</Text>

                    <Text style={pm.label}>Price (₹) *</Text>
                    <TextInput style={pm.input} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="e.g. 299" />

                    <Text style={pm.label}>Special Price (₹)</Text>
                    <TextInput style={pm.input} value={specialPrice} onChangeText={setSpecialPrice} keyboardType="number-pad" placeholder="Optional" />

                    <View style={pm.actions}>
                        <TouchableOpacity style={pm.cancelBtn} onPress={onClose}>
                            <Text style={pm.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={pm.saveBtn} onPress={handleSave}>
                            <Text style={pm.saveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const pm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
    label: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#1E293B', marginBottom: 14,
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 10,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#1E293B', alignItems: 'center' },
    saveText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ service, onSetPrice, onEdit, onRemove, showRemove }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSpecialPrice = service.specialPrice && service.price && service.specialPrice < service.price;
    const hasSteps = service.steps && Array.isArray(service.steps) && service.steps.length > 0;
    const hasFaqs = service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0;
    const hasDetails = !!service.description || hasSteps || hasFaqs;

    return (
        <View style={sc.card}>
            {/* Header: name + remove */}
            <View style={sc.headerRow}>
                <Text style={sc.name}>{service.name}</Text>
                {showRemove && (
                    <TouchableOpacity onPress={onRemove} style={sc.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text style={sc.removeText}>Remove</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Meta row: Duration + Price */}
            <View style={sc.row}>
                <View style={sc.col}>
                    <Text style={sc.metaLabel}>Duration</Text>
                    <Text style={sc.metaValue}>{service.duration || 0} Min</Text>
                </View>
                <View style={sc.col}>
                    <Text style={sc.metaLabel}>Price</Text>
                    <View style={sc.priceMetaRow}>
                        {hasSpecialPrice && (
                            <Text style={sc.priceStrike}>₹{service.price}</Text>
                        )}
                        <Text style={[sc.metaValue, hasSpecialPrice && sc.specialPriceText]}>
                            {service.price ? `₹${hasSpecialPrice ? service.specialPrice : service.price}` : 'Not Set'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* View Details Toggle */}
            {hasDetails && (
                <TouchableOpacity 
                    style={sc.detailsToggle} 
                    onPress={() => setIsExpanded(!isExpanded)}
                    activeOpacity={0.7}
                >
                    <Text style={sc.detailsToggleText}>
                        {isExpanded ? 'Hide Details' : 'View Details'}
                    </Text>
                    <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={colors.secondary} 
                    />
                </TouchableOpacity>
            )}

            {/* Collapsible Info Section */}
            {isExpanded && (
                <View style={sc.expandedContent}>
                    {/* Description (conditional) */}
                    {!!service.description && (
                        <View style={sc.descBox}>
                            <Text style={sc.descLabel}>Description</Text>
                            <Text style={sc.descText}>{service.description}</Text>
                        </View>
                    )}

                    {/* Steps (conditional) */}
                    {hasSteps && (
                        <View style={sc.sectionBox}>
                            <Text style={sc.sectionLabel}>How it works</Text>
                            {service.steps.map((step, i) => (
                                <View key={i} style={sc.stepItem}>
                                <View style={sc.stepNumber}>
                                    <Text style={sc.stepNumberText}>{i + 1}</Text>
                                </View>
                                    <View style={{ flex: 1 }}>
                                        {!!step.title && <Text style={sc.stepTitle}>{step.title}</Text>}
                                        {!!step.desc && <Text style={sc.stepDesc}>{step.desc}</Text>}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* FAQs (conditional) */}
                    {hasFaqs && (
                        <View style={sc.sectionBox}>
                            <Text style={sc.sectionLabel}>FAQs</Text>
                            {service.faqs.map((faq, i) => (
                                <View key={i} style={sc.faqItem}>
                                    <Text style={sc.faqQ}>Q: {faq.q || faq.question}</Text>
                                    <Text style={sc.faqA}>{faq.a || faq.answer}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Actions: Set Price + Edit */}
            <View style={sc.actions}>
                <TouchableOpacity style={sc.priceBox} onPress={onSetPrice}>
                    <Text style={sc.priceSymbol}>₹</Text>
                    <Text style={[sc.priceValue, !service.price && { color: '#94A3B8' }]}>
                        {service.price ? service.price : 'Set Price'}
                    </Text>
                    {(service.price > 0) && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={sc.editBtn} onPress={onEdit}>
                    <Text style={sc.editBtnText}>Edit Service</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const sc = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    name: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
    removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
    removeText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
    row: { flexDirection: 'row', marginBottom: 10 },
    col: { flex: 1 },
    metaLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
    metaValue: { fontSize: 13, color: '#111827', fontWeight: '500' },
    priceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    priceStrike: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
    specialPriceText: { color: colors.secondary, fontWeight: '700' },

    detailsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        justifyContent: 'center',
        marginVertical: 4,
    },
    detailsToggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.secondary,
    },
    expandedContent: {
        marginTop: 12,
        paddingBottom: 4,
    },

    // Description
    descBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.secondary },
    descLabel: { fontSize: 11, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    descText: { fontSize: 13, color: '#475569', lineHeight: 20 },

    // Sections (Steps / FAQs shared wrapper)
    sectionBox: { marginBottom: 10 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

    // Steps
    stepItem: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
    stepNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    stepNumberText: { fontSize: 11, fontWeight: '800', color: colors.secondary },
    stepTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
    stepDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

    // FAQs
    faqItem: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 8 },
    faqQ: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    faqA: { fontSize: 12, color: '#64748B', lineHeight: 18 },

    // Actions
    actions: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
    priceBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
        paddingHorizontal: 12, height: 44, backgroundColor: '#FFF'
    },
    priceSymbol: { fontSize: 16, color: '#1E293B', marginRight: 4, fontWeight: '600' },
    priceValue: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '600' },
    editBtn: {
        flex: 1, backgroundColor: '#FFF', height: 44,
        borderRadius: 8, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#D1D5DB',
    },
    editBtnText: { color: '#111827', fontSize: 14, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonServiceSetupScreen({ navigation, route }) {
    const isEdit = route.params?.isEdit;
    const { formData, updateFormData } = useOnboarding();
    const [search, setSearch] = useState('');

    // In Salons, we don't explicitly set genderPreference in the basic info right now.
    // If it's missing, default to Unisex behavior (allow both).
    const pref = formData.workPreferences?.genderPreference || 'Unisex';
    const isUnisex = pref === 'Unisex';
    const [gender, setGender] = useState(pref === 'Unisex' ? 'Male' : pref);

    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [allCatalogServices, setAllCatalogServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [priceModal, setPriceModal] = useState(null);
    const [activeTab, setActiveTab] = useState('Available');

    const [selectedServices, setSelectedServices] = useState(formData.salonServices || []);

    // Sync LOCAL selectedServices whenever formData changes (e.g. after EditServiceScreen returns)
    // Sync LOCAL selectedServices whenever formData changes (e.g. after EditServiceScreen returns)
    useEffect(() => {
        if (formData.salonServices) {
            setSelectedServices(formData.salonServices);
        }
    }, [formData.salonServices]);

    // Sync gender if formData changes (e.g. from hydration)
    useEffect(() => {
        if (formData.workPreferences?.genderPreference) {
            const pref = formData.workPreferences.genderPreference;
            if (pref !== 'Unisex') {
                setGender(pref);
            }
        }
    }, [formData.workPreferences]);

    const fetchFullCatalog = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch everything (no gender filter) to calculate "Overall" counts for tabs
            const res = await getCatalog(); 
            setAllCatalogServices(res.data || []);
        } catch (err) {
            setError('Error fetching services: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFullCatalog();
    }, [gender]);

    const handlePriceSave = (updatedService) => {
        const newArr = [...selectedServices];
        const idx = newArr.findIndex(s => (s.serviceId === updatedService.serviceId) || (s.id === updatedService.id));

        if (idx >= 0) {
            newArr[idx] = updatedService;
        } else {
            newArr.push(updatedService);
        }

        setSelectedServices(newArr);
        updateFormData('salonServices', newArr);

        // After editing/saving a price, move it to Approved tab automatically
        if (!updatedService.isCustom) {
            setActiveTab('Approved');
        } else {
            setActiveTab('In-review');
        }
    };

    const handleRemoveService = (serviceToRemove) => {
        Alert.alert(
            'Remove Service',
            `Are you sure you want to remove ${serviceToRemove.name}? it will be moved back to Available services with default settings.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const newArr = selectedServices.filter(s =>
                            s.serviceId !== serviceToRemove.serviceId && s.id !== serviceToRemove.id
                        );
                        setSelectedServices(newArr);
                        updateFormData('salonServices', newArr);
                    }
                }
            ]
        );
    };

    const handleNext = async () => {
        try {
            await updateFormData('salonServices', selectedServices);
            if (isEdit) {
                navigation.goBack();
                return;
            }
            navigation.navigate('SalonCoverUpload');
        } catch (err) {
            Alert.alert('Error', 'Failed to save services.');
        }
    };

    // 1. Available: Services in Catalog NOT in selectedServices (Overall - All Genders)
    const availableServicesOverall = allCatalogServices.filter(catS =>
        !selectedServices.some(sel => sel.serviceId === catS.id)
    ).map(s => ({ ...s, serviceId: s.id }));

    // 2. Approved: Catalog services that ARE in selectedServices and NOT custom (Overall - All Genders)
    const approvedServicesOverall = selectedServices.filter(s => !s.isCustom);

    // 3. In-review: Custom services (Overall - All Genders)
    const inReviewServicesOverall = selectedServices.filter(s => s.isCustom);

    const getDisplayedServices = () => {
        let base;
        if (activeTab === 'Approved') {
            base = approvedServicesOverall.filter(s => !s.gender || s.gender === gender);
        } else if (activeTab === 'In-review') {
            base = inReviewServicesOverall.filter(s => !s.gender || s.gender === gender);
        } else {
            // Available tab: Filter by Category AND current Gender toggle
            base = availableServicesOverall.filter(s => 
                s.category === activeCategory.name && 
                (!s.gender || s.gender === gender)
            );
        }

        return base.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    };

    const displayedServices = getDisplayedServices();

    const tabsConfig = [
        { label: 'Available', count: availableServicesOverall.length },
        { label: 'Approved', count: approvedServicesOverall.length },
        { label: 'In-review', count: inReviewServicesOverall.length }
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (isEdit) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('BankDetails');
                        }
                    }}
                >
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{activeCategory.name}</Text>
                <TouchableOpacity
                    style={styles.addCustomBtn}
                    onPress={() => navigation.navigate('EditService', { isNew: true, gender })}
                >
                    <Ionicons name="add-circle-outline" size={22} color="#000" />
                    <Text style={styles.addCustomText}>Custom Service</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.accentLine} />

            {/* Sub Tabs */}
            <View style={styles.subTabs}>
                {tabsConfig.map((tab) => {
                    const isActive = activeTab === tab.label;
                    return (
                        <TouchableOpacity
                            key={tab.label}
                            style={[styles.subTab, isActive && styles.subTabActive]}
                            onPress={() => setActiveTab(tab.label)}
                        >
                            <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                                {tab.label} ({tab.count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services"
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Gender Preferences / Toggle for Unisex */}
            <View style={styles.genderRow}>
                <TouchableOpacity
                    style={styles.genderOption}
                    onPress={() => setGender('Male')}
                    disabled={!isUnisex && gender !== 'Male'} // Still disabled if they are strictly a Female salon
                >
                    <View style={[styles.radioOuter, gender === 'Male' && styles.radioActive]}>
                        {gender === 'Male' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.genderLabel, gender === 'Male' && styles.genderLabelActive]}>Male Services</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.genderOption}
                    onPress={() => setGender('Female')}
                    disabled={!isUnisex && gender !== 'Female'} // Still disabled if they are strictly a Male salon
                >
                    <View style={[styles.radioOuter, gender === 'Female' && styles.radioActive]}>
                        {gender === 'Female' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.genderLabel, gender === 'Female' && styles.genderLabelActive]}>Female Services</Text>
                </TouchableOpacity>


            </View>

            {/* Category Tabs (Only for Available tab) */}
            {activeTab === 'Available' && (
                <View style={styles.tabsScrollContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.tab, activeCategory.id === cat.id && styles.tabActive]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                <Text style={[styles.tabText, activeCategory.id === cat.id && styles.tabTextActive]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Header label for current list */}
            <View style={styles.categoryCountRow}>
                <Text style={styles.categoryCount}>
                    {activeTab === 'Available' ? activeCategory.name : activeTab}
                    <Text style={styles.categoryCountNum}> ({displayedServices.length})</Text>
                </Text>
            </View>

            {/* Services List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchServices} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {displayedServices.map(service => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onSetPrice={() => setPriceModal(service)}
                            onEdit={() => navigation.navigate('EditService', { service, gender })}
                            onRemove={() => handleRemoveService(service)}
                            showRemove={activeTab === 'Approved'}
                        />
                    ))}
                    {displayedServices.length === 0 && (
                        <Text style={styles.noServicesText}>No services found in {activeTab}.</Text>
                    )}
                </ScrollView>
            )}

            {/* Continue */}
            <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleNext}
            >
                <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>

            {/* Price Modal */}
            <SetPriceModal
                visible={!!priceModal}
                service={priceModal}
                onClose={() => setPriceModal(null)}
                onSave={handlePriceSave}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 14, gap: 8,
    },
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1E293B' },
    addCustomBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addCustomText: { fontSize: 13, color: '#000', fontWeight: '500' },
    accentLine: { height: 2.5, backgroundColor: colors.secondary },

    // Sub Tabs
    subTabs: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    subTab: { paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    subTabActive: { borderBottomColor: colors.secondary },
    subTabText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    subTabTextActive: { color: colors.secondary, fontWeight: '700' },

    // Search
    searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F3F4F6', borderRadius: 12,
        paddingHorizontal: 12, height: 48, gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },

    // Gender & Add
    genderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 24, marginBottom: 16 },
    genderOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radioOuter: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
    },
    radioActive: { borderColor: colors.secondary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
    genderLabel: { fontSize: 15, color: '#64748B', fontWeight: '500' },
    genderLabelActive: { color: colors.secondary, fontWeight: '600' },

    // Tabs
    tabsScrollContainer: { marginBottom: 12 },
    tabsContent: { paddingHorizontal: 16, gap: 10 },
    tab: {
        paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 20, backgroundColor: '#F3F4F6',
    },
    tabActive: { backgroundColor: colors.secondary },
    tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    tabTextActive: { color: '#FFF', fontWeight: '700' },

    // Category count
    categoryCountRow: { paddingHorizontal: 16, paddingVertical: 10 },
    categoryCount: { fontSize: 18, fontWeight: '700', color: colors.secondary },
    categoryCountNum: { color: colors.secondary, fontWeight: '700' },

    // List
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },

    // Continue
    continueBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { padding: 12, backgroundColor: colors.secondary, borderRadius: 8 },
    retryText: { color: '#FFF', fontWeight: '600' },
    noServicesText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontSize: 15 }
});
