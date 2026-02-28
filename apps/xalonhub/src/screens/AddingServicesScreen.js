import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Dummy data for visual representation
const SERVICES_DATA = [
    { id: 1, name: 'Hair Cut', price: 500, hasQuantity: true },
    { id: 2, name: 'Shampoo/Conditioner', price: 200, hasQuantity: false },
    { id: 3, name: 'Full package service', price: 2200, originalPrice: 2500, hasQuantity: false },
];

export default function AddingServicesScreen({ navigation }) {
    // We maintain a local state of selected services and quantities to pass back
    const [selectedServices, setSelectedServices] = useState([
        { id: 1, name: 'Hair Cut', price: 500, quantity: 1 } // Pre-selecting the first one to match mockup
    ]);

    const handleBackWithData = () => {
        // Return to AddBooking with the selected services array
        navigation.navigate('AddBooking', { services: selectedServices });
    };

    const updateQuantity = (service, change) => {
        setSelectedServices(prev => {
            const existing = prev.find(s => s.id === service.id);
            if (!existing && change > 0) {
                // Add new
                return [...prev, { ...service, quantity: 1 }];
            } else if (existing) {
                // Update quantity
                const newQty = existing.quantity + change;
                if (newQty <= 0) {
                    return prev.filter(s => s.id !== service.id); // Remove if 0
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
                        <Text style={styles.filterChipTextActive}>Male Service</Text>
                    </TouchableOpacity>
                </View>

                {/* Sub-Category Chip */}
                <View style={styles.subCategoryRow}>
                    <TouchableOpacity style={styles.subCategoryChip}>
                        <Text style={styles.subCategoryText}>Hair Cut & Style</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Header */}
                <Text style={styles.categoryTitle}>Hair Cut & Style  (3)</Text>

                {/* Service List */}
                <View style={styles.serviceList}>
                    {SERVICES_DATA.map((service) => {
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
                                {service.hasQuantity && selectedItem ? (
                                    <View style={styles.quantityControl}>
                                        <Text style={styles.inlinePrice}>₹ {service.price}</Text>
                                        <View style={styles.qtyBox}>
                                            <TouchableOpacity onPress={() => updateQuantity(service, -1)} style={styles.qtyBtn}>
                                                <Ionicons name="remove" size={16} color="#000" />
                                            </TouchableOpacity>
                                            <Text style={styles.qtyText}>{selectedItem.quantity}</Text>
                                            <TouchableOpacity onPress={() => updateQuantity(service, 1)} style={styles.qtyBtn}>
                                                <Ionicons name="add" size={16} color="#000" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.addBtn, selectedItem && styles.addBtnActive]}
                                        onPress={() => toggleAddService(service)}
                                    >
                                        <Text style={[styles.addBtnText, selectedItem && styles.addBtnTextActive]}>
                                            {selectedItem ? 'ADDED' : 'ADD'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

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
    subCategoryRow: { flexDirection: 'row', marginBottom: 20 },
    subCategoryChip: { backgroundColor: colors.secondary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
    subCategoryText: { color: '#FFF', fontSize: 14, fontWeight: '500' },

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
