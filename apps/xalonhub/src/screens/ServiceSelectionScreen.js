import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getCatalog } from '../services/api';
import { useOnboarding } from '../context/OnboardingContext';
import { CATEGORIES } from '../constants/servicesData';

function ServiceItem({ service, gender, activeCategory, isSelected, onToggle, onEdit }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSteps = service.steps && Array.isArray(service.steps) && service.steps.length > 0;
    const hasFaqs = service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0;
    const hasDetails = !!service.description || hasSteps || hasFaqs;

    return (
        <View style={styles.serviceCard}>
            <View style={{ flex: 1 }}>
                <View style={styles.serviceMainInfo}>
                    <View style={styles.serviceInfo}>
                        <View style={styles.serviceTypeBadge}>
                            <Text style={styles.serviceTypeText}>{service.gender || gender} • {service.category || activeCategory.name}</Text>
                        </View>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.serviceDetails}>
                            <Text style={styles.servicePrice}>₹ {service.price || service.defaultPrice}</Text>
                            <Text style={styles.serviceDuration}> • {service.duration} mins</Text>
                        </View>
                    </View>
                    <View style={styles.serviceActions}>
                        <TouchableOpacity
                            style={styles.editIconBtn}
                            onPress={onEdit}
                        >
                            <Ionicons name="create-outline" size={20} color={colors.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addBtn, isSelected && styles.addBtnActive]}
                            onPress={onToggle}
                        >
                            <Text style={[styles.addBtnText, isSelected && styles.addBtnTextActive]}>
                                {isSelected ? 'ADDED' : 'ADD'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* View Details Toggle */}
                {hasDetails && (
                    <TouchableOpacity 
                        style={styles.detailsToggle} 
                        onPress={() => setIsExpanded(!isExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.detailsToggleText}>
                            {isExpanded ? 'Hide Details' : 'View Details'}
                        </Text>
                        <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={14} 
                            color={colors.secondary} 
                        />
                    </TouchableOpacity>
                )}

                {/* Collapsible Content */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {!!service.description && (
                            <View style={styles.descBox}>
                                <Text style={styles.descLabel}>Description</Text>
                                <Text style={styles.descText}>{service.description}</Text>
                            </View>
                        )}
                        {hasSteps && (
                            <View style={styles.sectionBox}>
                                <Text style={styles.sectionLabel}>How it works</Text>
                                {service.steps.map((step, i) => (
                                    <View key={i} style={styles.stepItem}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{i + 1}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            {!!step.title && <Text style={styles.stepTitle}>{step.title}</Text>}
                                            {!!step.desc && <Text style={styles.stepDesc}>{step.desc}</Text>}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                        {hasFaqs && (
                            <View style={styles.sectionBox}>
                                <Text style={styles.sectionLabel}>FAQs</Text>
                                {service.faqs.map((faq, i) => (
                                    <View key={i} style={styles.faqItem}>
                                        <Text style={styles.faqQ}>Q: {faq.q || faq.question}</Text>
                                        <Text style={styles.faqA}>{faq.a || faq.answer}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

export default function ServiceSelectionScreen({ navigation, route }) {
    const { formData, updateFormData } = useOnboarding();
    // ... rest of the component

    // In Freelancer flow, genderPreference is saved in personalInfo. 
    // If it's undefined, default to 'Male' or whatever was previously set.
    const pref = formData.personalInfo?.genderPreference || 'Unisex';
    const isUnisex = pref === 'Everyone' || pref === 'Unisex';

    const initialGender = formData.onboardingGender || (pref === 'Females Only' ? 'Female' : 'Male');
    const [gender, setGender] = useState(initialGender);

    // Use passed categoryId or default to first
    const initialCategoryId = route.params?.categoryId;
    const initialCategory = CATEGORIES.find(c => c.id === initialCategoryId) || CATEGORIES[0];

    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Add Services');

    // Local selected services state, initially from formData
    const [selectedServices, setSelectedServices] = useState(
        formData.workPreference === 'freelancer'
            ? (formData.selectedServices || [])
            : (formData.salonServices || [])
    );

    // Sync with formData if it changes (e.g. hydration)
    useEffect(() => {
        const services = formData.workPreference === 'freelancer'
            ? (formData.selectedServices || [])
            : (formData.salonServices || []);
        if (services.length > 0 && selectedServices.length === 0) {
            setSelectedServices(services);
        }
    }, [formData]);

    const fetchServices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch everything for the category (no gender filter) for total count
            const res = await getCatalog(null, activeCategory.name); 
            setServices(res.data || []);
        } catch (err) {
            setError('Error fetching services: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [activeCategory]); // Removed gender from dependency to avoid double-fetching, as filter is local now

    const handleToggleService = (service) => {
        const exists = selectedServices.find(s => s.serviceId === service.id);
        if (exists) {
            setSelectedServices(prev => prev.filter(s => s.serviceId !== service.id));
        } else {
            setSelectedServices(prev => [
                ...prev,
                {
                    serviceId: service.id,
                    name: service.name,
                    price: service.defaultPrice,
                    duration: service.duration,
                    gender: service.gender,
                    category: service.category,
                    status: 'Approved' // Standard services are approved by default
                }
            ]);
        }
    };

    const handleEditService = (service, isSelected) => {
        if (isSelected) {
            // Find the service in selectedServices to get its current overrides
            const existing = selectedServices.find(s => s.serviceId === service.id);
            navigation.navigate('EditService', { service: existing || service, gender, isNew: false });
        } else {
            // Edit the catalog service directly (will be added as Approved if saved)
            navigation.navigate('EditService', { service, gender, isNew: false });
        }
    };

    const handleNext = async () => {
        if (selectedServices.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one service to continue.');
            return;
        }
        try {
            await updateFormData('salonServices', selectedServices);
            await updateFormData('lastScreen', 'WorkingHours');
            navigation.navigate('SalonWorkingHours');
        } catch (err) {
            Alert.alert('Error', 'Failed to save services. Please try again.');
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!s.gender || s.gender === gender)
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ServiceCategory')}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Selection</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {[
                    { label: 'Approved', count: selectedServices.filter(s => s.status === 'Approved').length },
                    { label: 'In-review', count: selectedServices.filter(s => s.status === 'In-review').length },
                    { label: 'Add Services', count: 0 } // Add Services label doesn't need a dynamic count here but we'll keep it consistent
                ].map((tab) => {
                    const isActive = activeTab === tab.label;
                    return (
                        <TouchableOpacity
                            key={tab.label}
                            style={[styles.tabItem, isActive && styles.activeTabItem]}
                            onPress={() => setActiveTab(tab.label)}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab.label}{tab.label !== 'Add Services' ? ` (${tab.count})` : ` (${selectedServices.length})`}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Gender Toggle */}
            <View style={styles.genderRow}>
                <TouchableOpacity
                    style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                    onPress={() => setGender('Male')}
                    disabled={!isUnisex && pref !== 'Males Only' && pref !== 'Unisex'}
                >
                    <View style={[styles.radioOuter, gender === 'Male' && styles.radioActive]}>
                        {gender === 'Male' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.genderBtnText, gender === 'Male' && styles.genderBtnTextActive]}>Male Service</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                    onPress={() => setGender('Female')}
                    disabled={!isUnisex && pref !== 'Females Only' && pref !== 'Unisex'}
                >
                    <View style={[styles.radioOuter, gender === 'Female' && styles.radioActive]}>
                        {gender === 'Female' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.genderBtnText, gender === 'Female' && styles.genderBtnTextActive]}>Female Service</Text>
                </TouchableOpacity>
            </View>

            {/* Search & Custom */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for service"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={styles.customServiceIcon}
                    onPress={() => navigation.navigate('EditService', { isNew: true, gender })}
                >
                    <Ionicons name="add-circle-outline" size={32} color={colors.secondary} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.categoryScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, activeCategory.id === cat.id && styles.categoryChipActive]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryChipText, activeCategory.id === cat.id && styles.categoryChipTextActive]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Service Count Header */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{activeCategory.name} <Text style={styles.listCount}>({filteredServices.length})</Text></Text>
            </View>

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
                <ScrollView style={styles.serviceList} showsVerticalScrollIndicator={false}>
                    {(activeTab === 'Add Services' 
                        ? filteredServices 
                        : selectedServices.filter(s => s.status === activeTab && (!s.gender || s.gender === gender))
                    ).map((service) => {
                        const isSelected = selectedServices.some(s => s.serviceId === (service.id || service.serviceId));
                        return (
                            <ServiceItem 
                                key={service.id || service.serviceId}
                                service={service}
                                gender={gender}
                                activeCategory={activeCategory}
                                isSelected={isSelected}
                                onToggle={() => handleToggleService(service)}
                                onEdit={() => handleEditService(service, isSelected)}
                            />
                        );
                    })}
                    {(activeTab === 'Add Services' ? filteredServices.length : selectedServices.filter(s => s.status === activeTab).length) === 0 && (
                        <Text style={styles.noServicesText}>No services found.</Text>
                    )}
                </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>Next Step</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 15
    },
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#000' },
    supportBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary,
        justifyContent: 'center', alignItems: 'center'
    },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTabItem: { borderBottomColor: colors.secondary },
    tabText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    activeTabText: { color: colors.secondary, fontWeight: '700' },

    genderRow: { flexDirection: 'row', padding: 16, gap: 12 },
    genderBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0'
    },
    genderBtnActive: { borderColor: colors.secondary, backgroundColor: '#FFF5F7' },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
    radioActive: { borderColor: colors.secondary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
    genderBtnText: { fontSize: 15, fontWeight: '500', color: '#64748B' },
    genderBtnTextActive: { color: colors.secondary },

    searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12, alignItems: 'center' },
    searchContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, height: 48
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B' },
    customServiceIcon: { padding: 4 },

    categoryScrollContainer: { marginBottom: 16 },
    categoryScroll: { paddingHorizontal: 20, gap: 10 },
    categoryChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    categoryChipActive: {
        backgroundColor: colors.secondary + '10',
        borderColor: colors.secondary,
    },
    categoryChipText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: colors.secondary,
    },


    listHeader: { paddingHorizontal: 20, marginBottom: 12 },
    listTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
    listCount: { color: '#94A3B8', fontWeight: '400' },

    serviceList: { flex: 1, paddingHorizontal: 20 },
    serviceCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    serviceMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceInfo: { flex: 1 },

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
        marginTop: 12,
    },
    detailsToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.secondary,
    },
    expandedContent: {
        marginTop: 12,
        paddingBottom: 4,
    },
    descBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.secondary },
    descLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    descText: { fontSize: 12, color: '#475569', lineHeight: 18 },

    sectionBox: { marginBottom: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

    stepItem: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
    stepNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    stepNumberText: { fontSize: 10, fontWeight: '800', color: colors.secondary },
    stepTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
    stepDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

    faqItem: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 8 },
    faqQ: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    faqA: { fontSize: 12, color: '#64748B', lineHeight: 18 },

    serviceTypeBadge: {
        backgroundColor: colors.secondary + '15',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 6,
    },
    serviceTypeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    serviceName: { fontSize: 16, color: '#1E293B', fontWeight: '500', marginBottom: 4 },
    serviceDetails: { flexDirection: 'row', alignItems: 'center' },
    servicePrice: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
    serviceDuration: { fontSize: 14, color: '#94A3B8' },

    serviceActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    editIconBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center'
    },

    addBtn: {
        backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
        minWidth: 80, alignItems: 'center'
    },
    addBtnActive: { backgroundColor: '#E2E8F0' },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    addBtnTextActive: { color: '#64748B' },

    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    nextBtn: { backgroundColor: '#1E293B', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16 },
    retryBtn: { padding: 12, backgroundColor: colors.secondary, borderRadius: 8 },
    retryText: { color: '#FFF', fontWeight: '600' },
    noServicesText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontSize: 15 }
});
