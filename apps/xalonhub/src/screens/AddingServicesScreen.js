import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getPartnerProfile, getCatalog } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddingServicesScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState(route.params?.services || []);
    const [skillset, setSkillset] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log("[AddingServices] Fetching partnerId...");
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId) {
                console.error("[AddingServices] No partnerId found in AsyncStorage");
                setLoading(false);
                return;
            }

            console.log("[AddingServices] Fetching profile for partnerId:", partnerId);
            const profileRes = await getPartnerProfile(partnerId);
            const profile = profileRes.data;
            console.log("[AddingServices] Profile fetched:", profile);
            
            // Assuming skills is a JSON array or comma-separated string
            let skills = [];
            if (profile && profile.skills) {
                if (Array.isArray(profile.skills)) {
                    skills = profile.skills;
                } else if (typeof profile.skills === 'string') {
                    try {
                        // Try parsing if it's a JSON string
                        skills = JSON.parse(profile.skills);
                    } catch (e) {
                        // Otherwise split by comma
                        skills = profile.skills.split(',').map(s => s.trim()).filter(s => s !== "");
                    }
                }
            }
            
            console.log("[AddingServices] Parsed skills:", skills);
            setSkillset(skills);

            if (skills.length > 0) {
                const firstSkill = skills[0];
                setActiveCategory(firstSkill);
                console.log("[AddingServices] Fetching catalog for category:", firstSkill);
                const gender = profile.genderPreference || 'Both';
                const catRes = await getCatalog(gender, firstSkill);
                console.log("[AddingServices] Catalog fetched:", catRes.data);
                setServices(catRes.data);
            } else {
                console.warn("[AddingServices] No skills found for this partner account");
                Alert.alert("No Skills", "Please add your skills in the profile section to see available services.");
            }
        } catch (error) {
            console.error("[AddingServices] Failed to fetch services:", error?.response?.data || error.message);
            Alert.alert("Error", "Failed to load services. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = async (category) => {
        setLoading(true);
        setActiveCategory(category);
        console.log("[AddingServices] Switching category to:", category);
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            const profileRes = await getPartnerProfile(partnerId);
            const gender = profileRes.data?.genderPreference || 'Both';
            console.log("[AddingServices] Fetching catalog for gender:", gender, "category:", category);
            const catRes = await getCatalog(gender, category);
            console.log("[AddingServices] Category catalog fetched:", catRes.data);
            setServices(catRes.data);
        } catch (error) {
            console.error("[AddingServices] Failed to fetch category services:", error?.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackWithData = () => {
        navigation.navigate('AddBooking', { services: selectedServices });
    };

    const updateQuantity = (service, change) => {
        setSelectedServices(prev => {
            const existing = prev.find(s => s.id === service.id);
            if (!existing && change > 0) {
                return [...prev, { ...service, quantity: 1 }];
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
                return [...prev, { ...service, quantity: 1 }];
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Adding Services</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Filters */}
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.filterChipActive}>
                        <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>
                        <Text style={styles.filterChipTextActive}>Available Services</Text>
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

                                return (
                                    <View key={service.id} style={styles.serviceCard}>
                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceName}>{service.name}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.priceText}>Price : </Text>
                                                {service.originalPrice && (
                                                    <Text style={styles.originalPrice}>₹ {service.originalPrice}</Text>
                                                )}
                                                <Text style={styles.priceValue}>₹ {service.price}</Text>
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

            {/* Bottom Footer */}
            <View style={styles.bottomFooter}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleBackWithData}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>

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
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#000' },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    // Filters
    filterRow: { flexDirection: 'row', marginBottom: 20 },
    filterChipActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
    checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    filterChipTextActive: { fontSize: 16, color: '#1E293B', fontWeight: '500' },

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
    inlinePrice: { fontSize: 14, color: '#1E293B' },
    qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, backgroundColor: '#FFF' },
    qtyBtn: { padding: 6, paddingHorizontal: 10 },
    qtyText: { fontSize: 14, fontWeight: '600', color: '#1E293B', paddingHorizontal: 8 },

    // Footer
    bottomFooter: { padding: 20, backgroundColor: '#FFF' },
    continueBtn: { backgroundColor: '#33353A', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' }
});
