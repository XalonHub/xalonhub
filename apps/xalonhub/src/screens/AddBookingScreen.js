import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AddBookingScreen({ navigation, route }) {
    // In a real app, these would come from state/context after returning from AddNewClient/AddingServices
    const customerName = route.params?.customerName || "";
    const services = route.params?.services || [];
    const totalAmount = services.reduce((sum, service) => sum + service.price, 0);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Booking</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Customer Selection */}
                {customerName ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>Customer Name</Text>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputText}>{customerName}</Text>
                            <TouchableOpacity>
                                <Ionicons name="create-outline" size={16} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.label}>Select Customer</Text>
                        <TouchableOpacity style={styles.dropdownBox}>
                            <Text style={styles.placeholderText}>Select from Customer list</Text>
                            <Ionicons name="chevron-down" size={24} color="#94A3B8" />
                        </TouchableOpacity>

                        <Text style={styles.orText}>OR</Text>

                        <TouchableOpacity
                            style={styles.blackBtnRow}
                            onPress={() => navigation.navigate('AddNewClient')}
                        >
                            <Text style={styles.blackBtnText}>Add New Customer</Text>
                            <View style={styles.plusCircle}>
                                <Ionicons name="add" size={16} color="#000" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.blackBtnRow, { marginTop: 12 }]}>
                            <Text style={styles.blackBtnText}>Guest User</Text>
                            <View style={styles.iconCircle}>
                                <Ionicons name="person-add-outline" size={12} color="#000" />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Date and Time */}
                {customerName ? (
                    <View style={styles.dateTimeFilledRow}>
                        <Ionicons name="time-outline" size={24} color={colors.secondary} />
                        <View style={styles.dateTimeTextContainer}>
                            <Text style={styles.dateTimeLabel}>Booking Date & Time</Text>
                            <Text style={styles.dateTimeValue}>Sunday, 22 February 2026, 05:00 pm</Text>
                        </View>
                        <TouchableOpacity style={styles.editCircle}>
                            <Ionicons name="create-outline" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.dateTimeRow}>
                        <View style={styles.dateBox}>
                            <Text style={styles.floatingLabel}>Choose Date</Text>
                            <Text style={styles.inputText}>2026-02-22</Text>
                        </View>
                        <View style={styles.timeBox}>
                            <Text style={styles.placeholderText}>Choose Slot Time</Text>
                        </View>
                    </View>
                )}

                {/* Services Section */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={customerName ? styles.sectionTitle : styles.label}>
                        {customerName ? "Service List" : "Choose the type of services you're looking for"}
                    </Text>

                    {services.length > 0 ? (
                        <View style={styles.serviceListContainer}>
                            {services.map((service, index) => (
                                <View key={index} style={styles.serviceItem}>
                                    <View style={styles.serviceItemLeft}>
                                        <View style={styles.blueBar} />
                                        <View>
                                            <Text style={styles.serviceItemName}>{service.name}</Text>
                                            <Text style={styles.serviceItemPrice}>₹ {service.price}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.quantityControl}>
                                        <View style={styles.qtyBtn}><Ionicons name="remove" size={16} color="#FFF" /></View>
                                        <Text style={styles.qtyText}>1</Text>
                                        <View style={styles.qtyBtn}><Ionicons name="add" size={16} color="#FFF" /></View>
                                    </View>
                                    <Text style={styles.serviceItemTotal}>₹ {service.price}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addServicesArea}
                            onPress={() => navigation.navigate('AddingServices')}
                        >
                            <Text style={styles.addServicesText}>Add Services</Text>
                            <View style={styles.plusCircle}>
                                <Ionicons name="add" size={16} color="#000" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Additional Action Grid (Only if customer selected) */}
                {customerName ? (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={styles.actionGridItem} onPress={() => navigation.navigate('AddingServices')}>
                            <Ionicons name="mic-outline" size={16} color="#000" />
                            <Text style={styles.actionGridText}>Add Services</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionGridItem}>
                            <Ionicons name="pricetag-outline" size={16} color="#000" style={{ borderWidth: 1, padding: 2, borderRadius: 4 }} />
                            <Text style={styles.actionGridText}>Add Coupon</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionGridItem}>
                            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>%</Text>
                            <Text style={styles.actionGridText}>Add Discounts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionGridItem}>
                            <Ionicons name="document-text-outline" size={16} color="#000" />
                            <Text style={styles.actionGridText}>Add Note</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Bill Detail (Only if services added) */}
                {services.length > 0 ? (
                    <View style={[styles.section, { marginTop: 24 }]}>
                        <Text style={styles.sectionTitle}>Bill Detail</Text>
                        <View style={styles.billBox}>
                            <Text style={styles.billText}>Grand Total (Round Off)</Text>
                            <Text style={styles.billAmount}>₹ {totalAmount}</Text>
                        </View>
                    </View>
                ) : null}

            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomFooter}>
                <TouchableOpacity style={styles.confirmBtn}>
                    <Text style={styles.confirmBtnText}>Confirm & Book Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.discardBtnText}>Discard</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
        backgroundColor: '#FFF'
    },
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#000' },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    section: { marginBottom: 16 },

    // Inputs & Labels
    label: { fontSize: 14, color: '#1E293B', marginBottom: 8 },
    sectionTitle: { fontSize: 18, color: '#000', marginBottom: 16 },
    inputBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, backgroundColor: '#FAFAFA'
    },
    dropdownBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 8, padding: 14, backgroundColor: '#F8FAFC'
    },
    inputText: { fontSize: 15, color: '#1E293B' },
    placeholderText: { fontSize: 15, color: '#94A3B8' },

    // Or divider
    orText: { textAlign: 'center', marginVertical: 16, fontSize: 14, color: '#000' },

    // Black Buttons
    blackBtnRow: {
        backgroundColor: '#000', borderRadius: 8, padding: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    blackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    plusCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    iconCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    // Date & Time
    dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dateBox: {
        flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14,
        backgroundColor: '#FFF', paddingTop: 18
    },
    timeBox: {
        flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14,
        backgroundColor: '#FFF', justifyContent: 'center'
    },
    floatingLabel: { position: 'absolute', top: -8, left: 12, backgroundColor: '#FAFAFA', paddingHorizontal: 4, fontSize: 12, color: '#64748B' },

    // Filled Date Time (when customer selected)
    dateTimeFilledRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingRight: 10 },
    dateTimeTextContainer: { flex: 1, marginLeft: 16 },
    dateTimeLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    dateTimeValue: { fontSize: 15, color: '#000', fontWeight: '500' },
    editCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },

    // Add Services
    addServicesArea: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 8, padding: 16, backgroundColor: '#F8FAFC'
    },
    addServicesText: { fontSize: 16, color: '#000', fontWeight: '500' },

    // Service Item List
    serviceListContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16 },
    serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    blueBar: { width: 3, height: 40, backgroundColor: '#38BDF8', marginRight: 12 },
    serviceItemName: { fontSize: 16, color: '#1E293B', marginBottom: 8 },
    serviceItemPrice: { fontSize: 13, color: '#64748B' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 24 },
    qtyBtn: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 16, fontWeight: '500', color: '#000' },
    serviceItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#000' },

    // Action Grid
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
    actionGridItem: {
        width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#E2E8F0', padding: 14, borderRadius: 8
    },
    actionGridText: { fontSize: 14, color: '#000', fontWeight: '500' },

    // Bill Details
    billBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8 },
    billText: { fontSize: 15, color: '#1E293B' },
    billAmount: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },

    // Footer
    bottomFooter: { padding: 20, backgroundColor: '#FAFAFA', gap: 12 },
    confirmBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    discardBtn: { backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    discardBtnText: { color: '#000', fontSize: 16, fontWeight: '500' }
});
