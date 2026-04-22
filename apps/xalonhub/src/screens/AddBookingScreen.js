import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking, getPartnerCustomers, getStylists, getPartnerProfile, getGlobalSettings, lookupCustomerByPhone, createClient } from '../services/api';

export default function AddBookingScreen({ navigation, route }) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [stylists, setStylists] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedStylist, setSelectedStylist] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [role, setRole] = useState(null);
    const [settings, setSettings] = useState(null);
    
    // Lookup & Search
    const [searchPhone, setSearchPhone] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    // Modals
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [stylistModalVisible, setStylistModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    
    const services = route.params?.services || [];
    const subtotal = services.reduce((sum, service) => sum + service.price, 0);

    let platformFee = 0;
    let commissionRate = 0;
    if (settings) {
        platformFee = settings.platformFeeManual || 0;
        const isFreelancer = role === 'Freelancer';
        commissionRate = isFreelancer ? (settings.freelancerCommMan || 0) : (settings.salonCommMan || 0);
    }
    const commissionAmount = Math.round(subtotal * (commissionRate / 100));
    const grandTotal = subtotal + platformFee;
    const partnerEarnings = subtotal - commissionAmount;

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (route.params?.selectedCustomer) {
            setSelectedCustomer(route.params.selectedCustomer);
            setSearchPhone(route.params.selectedCustomer.phone || '');
        }
        if (route.params?.selectedStylist) {
            setSelectedStylist(route.params.selectedStylist);
        }
        if (route.params?.selectedTime) {
            setSelectedTime(route.params.selectedTime);
        }
    }, [route.params?.selectedCustomer, route.params?.selectedStylist, route.params?.selectedTime]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (partnerId) {
                const [custRes, stylRes, profRes] = await Promise.all([
                    getPartnerCustomers(partnerId),
                    getStylists(partnerId),
                    getPartnerProfile(partnerId)
                ]);
                setCustomers(custRes.data);
                setStylists(stylRes.data);
                
                const userRole = profRes.data?.partnerType;
                setRole(userRole);

                try {
                    const setRes = await getGlobalSettings();
                    setSettings(setRes.data);
                } catch (sErr) {
                    console.error("Failed to fetch global settings:", sErr);
                }
                
                if (userRole === 'Freelancer' && stylRes.data.length > 0) {
                    setSelectedStylist(stylRes.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = async (text) => {
        setSearchPhone(text);
        if (text.length === 10) {
            performLookup(text);
        } else {
            setIsNewCustomer(false);
            if (!selectedCustomer || selectedCustomer.phone !== text) {
                // Keep it if it matches selected, otherwise reset
                // But for now let's just reset lookup states
            }
        }
    };

    const performLookup = async (phone) => {
        setLookupLoading(true);
        setIsNewCustomer(false);
        try {
            const res = await lookupCustomerByPhone(phone);
            setSelectedCustomer(res.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setIsNewCustomer(true);
                setSelectedCustomer(null);
            } else {
                console.error("Lookup error:", err);
            }
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCreateAndSelect = async () => {
        if (!newCustomerName.trim()) {
            Alert.alert("Error", "Please enter customer name");
            return;
        }
        setLoading(true);
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            const res = await createClient({
                partnerId,
                name: newCustomerName,
                phone: searchPhone
            });
            const created = res.data;
            setSelectedCustomer({
                id: created.id,
                name: created.name,
                phone: created.phone,
                type: 'Walk-in'
            });
            setIsNewCustomer(false);
            setNewCustomerName('');
        } catch (err) {
            Alert.alert("Error", "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedCustomer || !selectedCustomer.name?.trim() || services.length === 0) {
            Alert.alert("Error", "Please select a customer and at least one service.");
            return;
        }

        if (!selectedTime) {
            Alert.alert("Error", "Please select a booking time.");
            return;
        }

        if (role !== 'Freelancer' && !selectedStylist) {
            Alert.alert("Error", "Please assign a stylist for this booking.");
            return;
        }

        setLoading(true);
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            const bookingData = {
                partnerId,
                bookingDate: new Date().toISOString(),
                timeSlot: selectedTime,
                services: services.map(s => ({
                    catalogId: s.id,
                    serviceName: s.name,
                    quantity: s.quantity || 1,
                    priceAtBooking: s.price
                })),
                totalAmount: subtotal,
                notes: "",
                stylistId: selectedStylist?.id || null,
                status: 'Confirmed',
                serviceMode: role === 'Freelancer' ? 'AtHome' : 'AtSalon'
            };

            if (selectedCustomer.type === 'Member') {
                bookingData.customerId = selectedCustomer.id;
            } else {
                bookingData.clientId = selectedCustomer.id;
            }

            await createBooking(bookingData);
            Alert.alert("Success", "Booking created successfully!");
            navigation.navigate('BookingList');
        } catch (error) {
            console.error("Failed to create booking:", error);
            Alert.alert("Error", "Failed to create booking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={26} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Add New Booking</Text>
                        <Text style={styles.stepIndicator}>Step 1: Select Customer & Details</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Unified Customer Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Search Customer (Mobile Number)</Text>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter 10-digit mobile number"
                            value={searchPhone}
                            onChangeText={handlePhoneChange}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        {lookupLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.lookupSpinner} />}
                        {!lookupLoading && searchPhone.length === 10 && !selectedCustomer && !isNewCustomer && (
                             <TouchableOpacity onPress={() => performLookup(searchPhone)}>
                                <Ionicons name="search" size={20} color={colors.primary} />
                             </TouchableOpacity>
                        )}
                    </View>

                    {selectedCustomer ? (
                        <View style={styles.selectedCustomerCard}>
                            <View style={styles.customerAvatar}>
                                <Text style={styles.avatarText}>{selectedCustomer.name?.charAt(0) || '?'}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                                <Text style={styles.customerPhone}>{selectedCustomer.phone || searchPhone}</Text>
                            </View>
                            <View style={[styles.typeBadge, { backgroundColor: selectedCustomer.type === 'Member' ? '#E0F2FE' : '#F1F5F9' }]}>
                                <Text style={[styles.typeBadgeText, { color: selectedCustomer.type === 'Member' ? '#0369A1' : '#475569' }]}>
                                    {selectedCustomer.type}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedCustomer(null); setSearchPhone(''); }} style={{ marginLeft: 8 }}>
                                <Ionicons name="close-circle" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    ) : isNewCustomer ? (
                        <View style={styles.newCustomerBox}>
                            <Text style={styles.newCustomerTitle}>No record found. Add as new customer?</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Full Name"
                                value={newCustomerName}
                                onChangeText={setNewCustomerName}
                            />
                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAndSelect}>
                                <Text style={styles.saveBtnText}>Add & Select</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.listLink} onPress={() => setCustomerModalVisible(true)}>
                            <Text style={styles.listLinkText}>Or select from customer list</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Servicer (Stylist) Selection */}
                {role && role !== 'Freelancer' && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Assign Servicer (Stylist)</Text>
                        <TouchableOpacity style={styles.dropdownBox} onPress={() => setStylistModalVisible(true)}>
                            <Text style={selectedStylist ? styles.inputText : styles.placeholderText}>
                                {selectedStylist ? selectedStylist.name : "Select Stylist"}
                            </Text>
                            <Ionicons name="chevron-down" size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Date and Time */}
                <View style={styles.dateTimeRow}>
                    <TouchableOpacity style={styles.dateBox}>
                        <Text style={styles.floatingLabel}>Choose Date</Text>
                        <Text style={styles.inputText}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (Today)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeBox} onPress={() => setTimeModalVisible(true)}>
                        <Text style={styles.floatingLabel}>Choose Time</Text>
                        <Text style={selectedTime ? styles.inputText : styles.placeholderText}>{selectedTime || "Select Time"}</Text>
                        <Ionicons name="chevron-down" size={20} color="#94A3B8" style={{ position: 'absolute', right: 12 }} />
                    </TouchableOpacity>
                </View>

                {/* Services Section */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Service List</Text>
                        {services.length > 0 && (
                             <TouchableOpacity onPress={() => navigation.navigate('AddingServices', { 
                                 services: services,
                                 selectedCustomer,
                                 selectedStylist,
                                 selectedTime
                             })}>
                                <Text style={{ color: colors.primary, fontWeight: '500' }}>+ Add More</Text>
                             </TouchableOpacity>
                        )}
                    </View>

                    {services.length > 0 ? (
                        <View style={styles.serviceListContainer}>
                            {services.map((service, index) => (
                                <View key={index} style={[styles.serviceItem, index > 0 && { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 }]}>
                                    <View style={styles.serviceItemLeft}>
                                        <View style={styles.blueBar} />
                                        <View>
                                            <Text style={styles.serviceItemName}>{service.name}</Text>
                                            <Text style={styles.serviceItemPrice}>₹ {service.price}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity 
                                            onPress={() => {
                                                const updated = services.filter((_, i) => i !== index);
                                                navigation.setParams({ services: updated });
                                            }}
                                            style={styles.removeItemBtn}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                        <Text style={styles.serviceItemTotal}>₹ {service.price}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addServicesArea}
                            onPress={() => {
                                if (!selectedCustomer) {
                                    Alert.alert("Required", "Please select a customer first.");
                                    return;
                                }
                                navigation.navigate('AddingServices', { 
                                    selectedCustomer, 
                                    selectedStylist, 
                                    selectedTime,
                                    services // pass existing if any
                                });
                            }}
                        >
                            <Text style={styles.addServicesText}>Add Services</Text>
                            <View style={styles.plusCircle}>
                                <Ionicons name="add" size={16} color="#000" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bill Detail */}
                {services.length > 0 ? (
                    <View style={[styles.section, { marginTop: 24 }]}>
                        <Text style={styles.sectionTitle}>Bill Detail</Text>
                        <View style={styles.billBoxWrapper}>
                            <View style={styles.billRow}>
                                <Text style={styles.billRowLabel}>Item Subtotal</Text>
                                <Text style={styles.billRowValue}>₹ {subtotal}</Text>
                            </View>
                            {platformFee > 0 && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billRowLabel}>Platform Fee (Customer Pay)</Text>
                                    <Text style={styles.billRowValue}>₹ {platformFee}</Text>
                                </View>
                            )}
                            <View style={styles.billRow}>
                                <Text style={styles.billRowLabel}>Commission ({commissionRate}%)</Text>
                                <Text style={[styles.billRowValue, { color: '#EF4444' }]}>- ₹ {commissionAmount}</Text>
                            </View>
                            <View style={[styles.billRow, styles.billRowTotal]}>
                                <Text style={styles.billTotalLabel}>Grand Total (Customer Pays)</Text>
                                <Text style={styles.billTotalValue}>₹ {grandTotal}</Text>
                            </View>
                            <View style={[styles.billRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }]}>
                                <Text style={styles.earningsLabel}>Your Estimated Earnings</Text>
                                <Text style={styles.earningsValue}>₹ {partnerEarnings}</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

            </ScrollView>

            {/* Modals */}
            <Modal visible={customerModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentLarge}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Customer</Text>
                            <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={customers}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.customerListItem}
                                    onPress={() => {
                                        setSelectedCustomer(item);
                                        setSearchPhone(item.phone || '');
                                        setCustomerModalVisible(false);
                                    }}
                                >
                                    <View style={styles.customerAvatarSmall}>
                                        <Text style={styles.avatarTextSmall}>{item.name?.charAt(0) || '?'}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.customerNameSmall}>{item.name}</Text>
                                        <Text style={styles.customerPhoneSmall}>{item.phone}</Text>
                                    </View>
                                    <View style={[styles.typeBadge, { backgroundColor: item.type === 'Member' ? '#E0F2FE' : '#F1F5F9' }]}>
                                        <Text style={[styles.typeBadgeText, { color: item.type === 'Member' ? '#0369A1' : '#475569' }]}>
                                            {item.type}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={timeModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentLarge}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Time Slot</Text>
                            <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={styles.slotGrid}>
                                {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'].map(time => (
                                    <TouchableOpacity 
                                        key={time} 
                                        style={[styles.slotItem, selectedTime === time && styles.slotItemActive]}
                                        onPress={() => {
                                            setSelectedTime(time);
                                            setTimeModalVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.slotText, selectedTime === time && styles.slotTextActive]}>{time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={stylistModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Stylist</Text>
                            <TouchableOpacity onPress={() => setStylistModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        {stylists.map(item => (
                            <TouchableOpacity 
                                key={item.id}
                                style={styles.stylistItem}
                                onPress={() => {
                                    setSelectedStylist(item);
                                    setStylistModalVisible(false);
                                }}
                            >
                                <Ionicons name="person-circle-outline" size={32} color="#64748B" />
                                <Text style={styles.stylistName}>{item.name}</Text>
                                {selectedStylist?.id === item.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomFooter}>
                <TouchableOpacity 
                    style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleConfirmBooking}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Confirm & Book Now</Text>}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.discardBtn} 
                    onPress={() => {
                        Alert.alert(
                            "Discard Booking",
                            "Are you sure you want to discard this booking? All selected details will be lost.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Yes, Discard", style: "destructive", onPress: () => navigation.goBack() }
                            ]
                        );
                    }}
                >
                    <Text style={styles.discardBtnText}>Discard</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#FFF' },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#000' },
    stepIndicator: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 2 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    section: { marginBottom: 16 },
    label: { fontSize: 14, color: '#1E293B', marginBottom: 8 },
    sectionTitle: { fontSize: 18, color: '#000', marginBottom: 16 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 56
    },
    searchInput: { flex: 1, fontSize: 16, color: '#1E293B' },
    lookupSpinner: { marginLeft: 8 },
    selectedCustomerCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 12,
        backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.primary
    },
    customerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#64748B' },
    customerName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    customerPhone: { fontSize: 13, color: '#64748B', marginTop: 2 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeBadgeText: { fontSize: 11, fontWeight: '600' },
    newCustomerBox: {
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12
    },
    newCustomerTitle: { fontSize: 14, color: '#64748B', marginBottom: 12 },
    listLink: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start' },
    listLinkText: { fontSize: 14, color: colors.primary, marginRight: 4 },
    dropdownBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, padding: 14, backgroundColor: '#F8FAFC'
    },
    inputText: { fontSize: 15, color: '#1E293B' },
    placeholderText: { fontSize: 15, color: '#94A3B8' },
    dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dateBox: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FFF', paddingTop: 18 },
    timeBox: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FFF', justifyContent: 'center' },
    floatingLabel: { position: 'absolute', top: -8, left: 12, backgroundColor: '#FAFAFA', paddingHorizontal: 4, fontSize: 12, color: '#64748B' },
    addServicesArea: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, padding: 16, backgroundColor: '#F8FAFC'
    },
    addServicesText: { fontSize: 16, color: '#000', fontWeight: '500' },
    plusCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    serviceListContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16 },
    serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    blueBar: { width: 3, height: 40, backgroundColor: '#38BDF8', marginRight: 12 },
    serviceItemName: { fontSize: 16, color: '#1E293B', marginBottom: 4 },
    serviceItemPrice: { fontSize: 13, color: '#64748B' },
    serviceItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#000' },
    removeItemBtn: { padding: 8, borderRadius: 8, backgroundColor: '#FEF2F2' },
    billBoxWrapper: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    billRowLabel: { fontSize: 13, color: '#64748B' },
    billRowValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    billRowTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    billTotalLabel: { fontSize: 15, fontWeight: '700', color: '#000' },
    billTotalValue: { fontSize: 16, fontWeight: '800', color: '#000' },
    earningsLabel: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    earningsValue: { fontSize: 15, color: colors.primary, fontWeight: '700' },
    bottomFooter: { padding: 20, backgroundColor: '#FAFAFA', gap: 12 },
    confirmBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    discardBtn: { backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    discardBtnText: { color: '#000', fontSize: 16, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, paddingBottom: 40 },
    modalContentLarge: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    modalInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
    saveBtn: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontWeight: 'bold' },
    customerListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    customerAvatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    avatarTextSmall: { fontSize: 16, fontWeight: 'bold', color: '#64748B' },
    customerNameSmall: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
    customerPhoneSmall: { fontSize: 13, color: '#64748B' },
    stylistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
    stylistName: { flex: 1, fontSize: 16, color: '#1E293B' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
    slotItem: { width: '30%', paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', backgroundColor: '#FFF' },
    slotItemActive: { backgroundColor: '#000', borderColor: '#000' },
    slotText: { fontSize: 13, color: '#1E293B' },
    slotTextActive: { color: '#FFF', fontWeight: 'bold' }
});
