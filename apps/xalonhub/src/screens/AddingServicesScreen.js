import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getPartnerProfile, getCatalog } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddingServicesScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState(route.params?.services || route.params?.existingServices || []);
    const [selectedCustomer, setSelectedCustomer] = useState(route.params?.selectedCustomer || null);
    const [selectedStylist, setSelectedStylist] = useState(route.params?.selectedStylist || null);
    const [selectedTime, setSelectedTime] = useState(route.params?.selectedTime || null);
    const [skillset, setSkillset] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeGender, setActiveGender] = useState('Male'); // Default to Male
    const [partnerType, setPartnerType] = useState(null);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId) {
                setLoading(false);
                return;
            }

            const profileRes = await getPartnerProfile(partnerId);
            const profile = profileRes.data;
            setProfileData(profile);
            const userRole = profile.partnerType;
            setPartnerType(userRole);
            
            // Set initial gender based on preference
            const pref = profile.basicInfo?.genderPreference || profile.workPreferences?.genderPreference || 'Everyone';
            let initialGender = 'Male';
            if (pref === 'Females Only') {
                initialGender = 'Female';
            } else if (pref === 'Males Only') {
                initialGender = 'Male';
            }
            setActiveGender(initialGender);

            let skillList = [];
            if (profile) {
                const rawSkills = profile.categories || profile.skills;
                if (rawSkills) {
                    if (Array.isArray(rawSkills)) {
                        skillList = rawSkills;
                    } else if (typeof rawSkills === 'string') {
                        try {
                            skillList = JSON.parse(rawSkills);
                        } catch (e) {
                            skillList = rawSkills.split(',').map(s => s.trim()).filter(s => s !== "");
                        }
                    }
                }
            }
            
            setSkillset(skillList);

            if (skillList.length > 0) {
                const firstSkill = skillList[0];
                setActiveCategory(firstSkill);
                
                const catRes = await getCatalog(initialGender, firstSkill, userRole);
                let fetchedServices = catRes.data;

                // If Salon has custom services, filter and override prices
                const salonServices = profile.salonServices;
                if (salonServices && Array.isArray(salonServices)) {
                    console.log("[AddingServices] Filtering for salon services:", salonServices.length);
                    fetchedServices = fetchedServices
                        .filter(s => salonServices.some(ss => ss.serviceId === s.id && (ss.price !== undefined && ss.price !== null)))
                        .map(s => {
                            const custom = salonServices.find(ss => ss.serviceId === s.id);
                            const finalPrice = custom.price; // Strict: no fallback to global catalog
                            return { 
                                ...s, 
                                price: finalPrice,
                                effectivePrice: finalPrice
                            };
                        });
                }

                setServices(fetchedServices);
            } else {
                Alert.alert("No Skills", "Please add your skills in the profile section to see available services.");
            }
        } catch (error) {
            console.error("[AddingServices] Failed to fetch services:", error?.response?.data || error.message);
            Alert.alert("Error", "Failed to load services.");
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = async (skill) => {
        setActiveCategory(skill);
        await fetchFilteredCatalog(skill, activeGender);
    };

    const handleGenderChange = async (gender) => {
        setActiveGender(gender);
        await fetchFilteredCatalog(activeCategory, gender);
    };

    const fetchFilteredCatalog = async (category, gender) => {
        setLoading(true);
        try {
            const catRes = await getCatalog(gender, category, partnerType);
            let fetchedServices = catRes.data;

            // If Salon has custom services, filter and override prices
            const salonServices = profileData?.salonServices;
            if (salonServices && Array.isArray(salonServices)) {
                fetchedServices = fetchedServices
                    .filter(s => salonServices.some(ss => ss.serviceId === s.id && (ss.price !== undefined && ss.price !== null)))
                    .map(s => {
                        const custom = salonServices.find(ss => ss.serviceId === s.id);
                        const finalPrice = custom.price; // Strict: no fallback to global catalog
                        return { 
                            ...s, 
                            price: finalPrice,
                            effectivePrice: finalPrice
                        };
                    });
            }

            setServices(fetchedServices);
        } catch (error) {
            console.error("[AddingServices] Failed to fetch services:", error?.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackWithData = () => {
        navigation.navigate('AddBooking', { 
            services: selectedServices,
            selectedCustomer: selectedCustomer,
            selectedStylist: selectedStylist,
            selectedTime: selectedTime
        });
    };

    const updateQuantity = (service, change) => {
        setSelectedServices(prev => {
            const existing = prev.find(s => s.id === service.id);
            if (!existing && change > 0) {
                const displayPrice = service.effectiveSpecialPrice || service.effectivePrice || service.price;
                return [...prev, { ...service, price: displayPrice, quantity: 1 }];
            } else if (existing) {
                const newQty = (existing.quantity || 1) + change;
                if (newQty <= 0) {
                    return prev.filter(s => s.id !== service.id);
                }
                return prev.map(s => s.id === service.id ? { ...s, quantity: newQty } : s);
            }
            return prev;
        });
    };

    const toggleAddService = (service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            } else {
                const displayPrice = service.effectiveSpecialPrice || service.effectivePrice || service.price;
                return [...prev, { ...service, price: displayPrice, quantity: 1 }];
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Adding Services</Text>
                        <Text style={styles.stepIndicator}>Step 2: Select Services</Text>
                    </View>
                </View>
            </View>

            {/* Selected Customer Info Bar */}
            {selectedCustomer && (
                <View style={styles.customerContextBar}>
                    <View style={styles.customerInitials}>
                        <Text style={styles.initialsText}>{selectedCustomer.name?.charAt(0)}</Text>
                    </View>
                    <Text style={styles.contextText}>Booking for: <Text style={styles.contextName}>{selectedCustomer.name}</Text></Text>
                </View>
            )}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Filters */}
                <View style={styles.filterRow}>
                    <TouchableOpacity 
                        style={[styles.filterChip, activeGender === 'Male' && styles.filterChipActive]}
                        onPress={() => handleGenderChange('Male')}
                    >
                        {activeGender === 'Male' && (
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={12} color="#FFF" />
                            </View>
                        )}
                        <Text style={[styles.filterChipText, activeGender === 'Male' && styles.filterChipTextActive]}>Male</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterChip, activeGender === 'Female' && styles.filterChipActive]}
                        onPress={() => handleGenderChange('Female')}
                    >
                        {activeGender === 'Female' && (
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={12} color="#FFF" />
                            </View>
                        )}
                        <Text style={[styles.filterChipText, activeGender === 'Female' && styles.filterChipTextActive]}>Female</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', marginTop: 40 }}>
                        <ActivityIndicator size="large" color={colors.secondary} />
                    </View>
                ) : (
                    <>
                        {/* Skillset/Category Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCategoryRow}>
                            {skillset.map((skill) => (
                                <TouchableOpacity 
                                    key={skill} 
                                    style={[styles.subCategoryChip, activeCategory === skill && styles.subCategoryChipActive]}
                                    onPress={() => handleCategoryChange(skill)}
                                >
                                    <Text style={[styles.subCategoryText, activeCategory === skill && styles.subCategoryTextActive]}>{skill}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Category Header */}
                        <Text style={styles.categoryTitle}>{activeCategory} ({services.length})</Text>

                        {/* Service List */}
                        <View style={styles.serviceList}>
                            {services.map((service) => {
                                const selectedItem = selectedServices.find(s => s.id === service.id);
                                const hasSpecialPrice = service.effectiveSpecialPrice && service.effectiveSpecialPrice > 0;
                                const displayPrice = hasSpecialPrice ? service.effectiveSpecialPrice : (service.effectivePrice || service.price);
                                const originalPriceFormatted = hasSpecialPrice ? service.effectivePrice : null;

                                return (
                                    <View key={service.id} style={styles.serviceCard}>
                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceName}>{service.name}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.priceText}>Price: </Text>
                                                {originalPriceFormatted && (
                                                    <Text style={styles.originalPrice}>₹ {originalPriceFormatted}</Text>
                                                )}
                                                <Text style={styles.priceValue}>₹ {displayPrice}</Text>
                                            </View>
                                        </View>

                                        {/* Action Button / Quantity Control */}
                                        {selectedItem ? (
                                            <View style={styles.quantityControl}>
                                                <TouchableOpacity onPress={() => updateQuantity(service, -1)} style={styles.qtyBtn}>
                                                    <Ionicons name="remove" size={16} color="#000" />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{selectedItem.quantity || 1}</Text>
                                                <TouchableOpacity onPress={() => updateQuantity(service, 1)} style={styles.qtyBtn}>
                                                    <Ionicons name="add" size={16} color="#000" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.addBtn}
                                                onPress={() => toggleAddService(service)}
                                            >
                                                <Text style={styles.addBtnText}>ADD</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

            </ScrollView>

            {/* Sticky Summary Bar */}
            {selectedServices.length > 0 && (
                <View style={styles.bottomSummary}>
                    <View style={styles.summaryInfo}>
                        <Text style={styles.summaryLabel}>Total Services</Text>
                        <Text style={styles.summaryValue}>{selectedServices.length} Selected</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryInfo}>
                        <Text style={styles.summaryLabel}>Grand Total</Text>
                        <Text style={styles.summaryPrice}>₹ {selectedServices.reduce((acc, s) => acc + (s.price || 0) * (s.quantity || 1), 0)}</Text>
                    </View>
                    <TouchableOpacity style={styles.summaryDoneBtn} onPress={handleBackWithData}>
                        <Text style={styles.doneBtnText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
        backgroundColor: '#FFF'
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },
    stepIndicator: { fontSize: 12, color: colors.secondary, fontWeight: '500', marginTop: 2 },

    customerContextBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC', 
        marginHorizontal: 20, 
        padding: 10, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        marginBottom: 10
    },
    customerInitials: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    initialsText: { fontSize: 14, fontWeight: 'bold', color: colors.secondary },
    contextText: { fontSize: 14, color: '#64748B' },
    contextName: { color: '#0F172A', fontWeight: '600' },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

    // Filters
    filterRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    filterChipActive: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.secondary },
    checkCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
    filterChipText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    filterChipTextActive: { color: '#1E293B', fontWeight: '600' },

    // Sub Category
    subCategoryRow: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
    subCategoryChip: { backgroundColor: '#F1F5F9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, marginRight: 10 },
    subCategoryChipActive: { backgroundColor: colors.secondary },
    subCategoryText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    subCategoryTextActive: { color: '#FFF' },

    // Category Header
    categoryTitle: { fontSize: 18, color: '#1E293B', marginBottom: 12 },

    // Service Cards
    serviceList: { gap: 12 },
    serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8 },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, color: '#1E293B', marginBottom: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    priceText: { fontSize: 14, color: '#1E293B' },
    originalPrice: { fontSize: 14, color: '#64748B', textDecorationLine: 'line-through', marginRight: 6 },
    priceValue: { fontSize: 14, color: '#1E293B' },

    // Buttons & Controls
    addBtn: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 6 },
    addBtnActive: { backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    addBtnTextActive: { color: '#64748B' },

    quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    qtyBtn: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 14, fontWeight: '600', color: '#1E293B', paddingHorizontal: 8 },

    bottomSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    summaryInfo: { flex: 0.8 },
    summaryLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 },
    summaryValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    summaryPrice: { fontSize: 18, fontWeight: '700', color: colors.secondary },
    summaryDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
    summaryDoneBtn: { 
        backgroundColor: '#0F172A', 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 10,
        flex: 1,
        alignItems: 'center'
    },
    doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
