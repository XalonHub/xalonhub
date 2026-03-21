import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, StatusBar, ActivityIndicator, Alert, Image, Modal, FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { haversineKm, formatDistance } from '../../utils/bookingUtils';

// Removing old inline LoginGate as we now use late-stage redirection

// ── Main confirm screen ─────────────────────────────────────────────────────

export default function BookingConfirmScreen() {
    const navigation = useNavigation();
    const { draft, updateDraft, subtotal, convenienceFee, totalPrice, resetDraft } = useBooking();
    const { auth } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [loading, setLoading] = useState(false);
    const [isSomeoneElse, setIsSomeoneElse] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [selectedGuestId, setSelectedGuestId] = useState(null);
    const [guests, setGuests] = useState([]);
    // AtSalon: stylist preference
    const [stylistPreference, setStylistPreference] = useState('Any'); // 'Any' | 'Specific'
    const [selectedStylistId, setSelectedStylistId] = useState(null);
    const [stylists, setStylists] = useState([]);

    // AtHome: Professional selection
    const [atHomePreference, setAtHomePreference] = useState(draft.selectedSalon ? 'Specific' : 'Any'); // 'Any' | 'Specific'
    const [showProModal, setShowProModal] = useState(false);
    const [professionals, setProfessionals] = useState([]);
    const [proLoading, setProLoading] = useState(false);

    useEffect(() => {
        if (isSomeoneElse && auth?.customerId && guests.length === 0) {
            fetchGuests();
        }
    }, [isSomeoneElse]);

    useEffect(() => {
        if (draft.serviceMode === 'AtSalon' && draft.selectedSalon?.id) {
            fetchStylists(draft.selectedSalon.id);
        }
    }, [draft.selectedSalon?.id]);

    useEffect(() => {
        if (draft.serviceMode === 'AtHome' && atHomePreference === 'Specific') {
            fetchProfessionals();
        }
    }, [draft.serviceMode, atHomePreference, draft.location]);

    const fetchProfessionals = async () => {
        try {
            setProLoading(true);
            const data = await api.getSalons({
                city: draft.location?.city,
                lat: draft.location?.lat,
                lng: draft.location?.lng,
                partnerType: 'Freelancer',
                gender: draft.gender,
                sort: 'rating',
            });
            setProfessionals(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[BookingConfirm] Error fetching professionals:', err);
        } finally {
            setProLoading(false);
        }
    };

    const fetchGuests = async () => {
        try {
            const data = await api.getGuests(auth.customerId);
            if (!data.error) setGuests(data);
        } catch (err) { }
    };

    const fetchStylists = async (salonId) => {
        try {
            const data = await api.getStylists(salonId);
            if (!data.error) setStylists(data);
        } catch (err) { }
    };

    const handleSelectGuest = (guest) => {
        if (selectedGuestId === guest.id) {
            setSelectedGuestId(null);
            setRecipientName('');
            setRecipientPhone('');
        } else {
            setSelectedGuestId(guest.id);
            setRecipientName(guest.name);
            setRecipientPhone(guest.mobileNumber || '');
        }
    };

    const profile = auth?.customerProfile;
    const addresses = profile?.addresses || [];

    // Auto-select default address if not set
    useEffect(() => {
        if (draft.serviceMode === 'AtHome' && !draft.selectedAddressId && addresses.length > 0) {
            const def = addresses.find(a => a.isDefault) || addresses[0];
            if (def) {
                updateDraft({ selectedAddressId: def.id });
            }
        }
    }, [addresses, draft.selectedAddressId, draft.serviceMode]);

    const selectedAddress = addresses.find(a => a.id === draft.selectedAddressId) || addresses.find(a => a.isDefault) || addresses[0];

    // Distance calculation
    let distance = null;
    if (draft.serviceMode === 'AtHome' && selectedAddress && draft.selectedSalon) {
        // This case might not happen often in V0 as AtHome usually assigns Freelancers
        // but if we have a target salon/partner loc:
        distance = haversineKm(selectedAddress.lat, selectedAddress.lng, draft.selectedSalon.lat, draft.selectedSalon.lng);
    } else if (draft.serviceMode === 'AtSalon' && draft.selectedSalon && draft.location) {
        distance = haversineKm(draft.location.lat, draft.location.lng, draft.selectedSalon.lat, draft.selectedSalon.lng);
    }
    const distanceStr = formatDistance(distance);

    const handleBook = async () => {
        // Validation: Address is mandatory for At Home
        if (draft.serviceMode === 'AtHome' && !selectedAddress) {
            Alert.alert(
                'Address Required',
                'Please add your service address for home visit.',
                [{ text: 'Add Address', onPress: () => navigation.navigate('EditAddress') }]
            );
            return;
        }

        if (isSomeoneElse && !recipientName.trim()) {
            Alert.alert('Recipient Name Required', 'Please provide the name of the person receiving the service.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                serviceIds: draft.selectedServices.map((s) => s.id),
                serviceMode: draft.serviceMode,
                serviceGender: draft.gender,
                salonId: (draft.serviceMode === 'AtSalon' || (draft.serviceMode === 'AtHome' && atHomePreference === 'Specific'))
                    ? draft.selectedSalon?.id
                    : undefined,
                stylistId: (draft.serviceMode === 'AtSalon' && stylistPreference === 'Specific')
                    ? selectedStylistId
                    : undefined,
                beneficiaryName: isSomeoneElse ? recipientName : (profile?.name || 'Self'),
                beneficiaryPhone: isSomeoneElse ? recipientPhone : (auth?.phone || null),
                location: draft.serviceMode === 'AtHome' ? {
                    city: selectedAddress.city,
                    lat: selectedAddress.lat,
                    lng: selectedAddress.lng,
                    addressLine: selectedAddress.addressLine
                } : {
                    city: draft.selectedSalon?.city || draft.location?.city,
                    lat: draft.selectedSalon?.lat || draft.location?.lat,
                    lng: draft.selectedSalon?.lng || draft.location?.lng,
                    addressLine: draft.selectedSalon?.addressLine || '',
                },
                bookingDate: draft.bookingDate,
                timeSlot: draft.timeSlot,
                customerId: auth?.customerId,
                guestId: isSomeoneElse ? selectedGuestId : null,
                paymentMethod
            };

            // 1. Auto-assign and Create Booking
            const result = await api.autoAssignBooking(payload);

            if (result.error === 'NO_PROVIDERS') {
                navigation.navigate('ProviderAssigned', { noProvider: true });
                return;
            }

            // 2. Initiate Payment
            const payRes = await api.initiatePayment({
                bookingId: result.booking.id,
                paymentMethod
            });

            if (paymentMethod === 'Online' && payRes.success) {
                navigation.navigate('PaytmPage', { params: payRes.paytmParams });
                // We don't advance to ProviderAssigned yet because payment is pending
                return;
            }

            updateDraft({ assignedProvider: result.assignedProvider, confirmedBooking: result.booking });
            navigation.navigate('BookingSuccess');
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const getImageUrl = (url) => {
        const BU = api.BASE_URL || 'http://localhost:5000';
        if (!url) return null;
        if (url.startsWith('http')) {
            return url.replace(/http:\/\/192\.168\.1\.10:5000/g, BU);
        }
        return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <Image
                        source={require('../../assets/brand/logo_icon.png')}
                        style={styles.headerIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>Confirm Booking</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Services summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Services</Text>
                    {draft.selectedServices.map((s) => (
                        <View key={s.id} style={styles.serviceRow}>
                            <Text style={styles.serviceName}>{s.name}</Text>
                            <Text style={styles.servicePrice}>₹{s.price}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.subtotalLabel}>Item Subtotal</Text>
                        <Text style={styles.subtotalPrice}>₹{subtotal}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Convenience Fee</Text>
                        <Text style={styles.feePrice}>₹{convenienceFee}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderTopWidth: 2, borderTopColor: colors.primarySoft }]}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalPrice}>₹{totalPrice}</Text>
                    </View>
                </View>

                {/* Date & time */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Date & Time</Text>
                    <View style={styles.dtRow}>
                        <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                        <Text style={styles.dtText}>{formatDate(draft.bookingDate)}</Text>
                        <MaterialIcons name="schedule" size={16} color={colors.primary} style={{ marginLeft: 16 }} />
                        <Text style={styles.dtText}>{draft.timeSlot}</Text>
                    </View>
                </View>

                {/* Mode */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Mode</Text>
                    <View style={styles.dtRow}>
                        <MaterialIcons name={draft.serviceMode === 'AtHome' ? 'home' : 'storefront'} size={16} color={colors.primary} />
                        <Text style={styles.dtText}>{draft.serviceMode === 'AtHome' ? 'At Home – Freelancer will visit you' : 'At Salon – Visit the salon'}</Text>
                    </View>
                </View>

                {/* Address Handling */}
                {draft.serviceMode === 'AtHome' ? (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Service Address</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AddressList', { mode: 'select' })}>
                                <Text style={styles.changeText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                        {selectedAddress ? (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="location-on" size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                                        {distanceStr && (
                                            <View style={styles.distBadge}>
                                                <MaterialIcons name="near-me" size={10} color={colors.primary} />
                                                <Text style={styles.distBadgeText}>{distanceStr}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressText}>{selectedAddress.addressLine}, {selectedAddress.city}</Text>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addAddrBtn} onPress={() => navigation.navigate('EditAddress')}>
                                <MaterialIcons name="add-location" size={20} color={colors.primary} />
                                <Text style={styles.addAddrText}>Add Address</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Salon Address</Text>

                        </View>
                        {draft.selectedSalon ? (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="storefront" size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.addressLabel}>
                                            {draft.selectedSalon.businessName || draft.selectedSalon.name}
                                        </Text>
                                        {distanceStr && (
                                            <View style={styles.distBadge}>
                                                <MaterialIcons name="near-me" size={10} color={colors.primary} />
                                                <Text style={styles.distBadgeText}>{distanceStr}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressText}>
                                        {draft.selectedSalon.addressLine
                                            ? `${draft.selectedSalon.addressLine}, `
                                            : ''}{draft.selectedSalon.area || draft.selectedSalon.city || 'Location not set'}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.addressBox}>
                                <MaterialIcons name="storefront" size={20} color={colors.gray} />
                                <Text style={[styles.addressText, { color: colors.gray }]}>Using Salon's verified location</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Payment Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Method</Text>
                    <TouchableOpacity
                        style={[styles.premiumPayBtn, paymentMethod === 'Online' && styles.premiumPayBtnActive]}
                        onPress={() => setPaymentMethod('Online')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.payIconBox}>
                            <MaterialIcons name="account-balance-wallet" size={24} color={paymentMethod === 'Online' ? colors.primary : colors.gray} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.payMainText, paymentMethod === 'Online' && styles.payMainTextActive]}>UPI / Online Payment</Text>
                            <Text style={styles.paySubText}>Paytm, PhonePe, Cards, Netbanking</Text>
                        </View>
                        {paymentMethod === 'Online' && <MaterialIcons name="check-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.premiumPayBtn, paymentMethod === 'Cash' && styles.premiumPayBtnActive, { marginTop: 12 }]}
                        onPress={() => setPaymentMethod('Cash')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.payIconBox}>
                            <MaterialIcons name="payments" size={24} color={paymentMethod === 'Cash' ? colors.primary : colors.gray} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.payMainText, paymentMethod === 'Cash' && styles.payMainTextActive]}>
                                {draft.serviceMode === 'AtSalon' ? 'Pay at Salon' : 'Cash After Service'}
                            </Text>
                            <Text style={styles.paySubText}>Pay after your service is completed</Text>
                        </View>
                        {paymentMethod === 'Cash' && <MaterialIcons name="check-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                </View>

                {/* Recipient info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Recipient</Text>
                    <View style={styles.recipientToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !isSomeoneElse && styles.toggleBtnActive]}
                            onPress={() => setIsSomeoneElse(false)}
                        >
                            <Text style={[styles.toggleBtnText, !isSomeoneElse && styles.toggleBtnTextActive]}>Myself</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, isSomeoneElse && styles.toggleBtnActive]}
                            onPress={() => setIsSomeoneElse(true)}
                        >
                            <Text style={[styles.toggleBtnText, isSomeoneElse && styles.toggleBtnTextActive]}>Someone else</Text>
                        </TouchableOpacity>
                    </View>

                    {isSomeoneElse ? (
                        <View style={styles.recipientForm}>
                            {guests.length > 0 && (
                                <View style={styles.guestPickSection}>
                                    <Text style={styles.subLabel}>Saved Guests</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestScroll}>
                                        {guests.map((g) => (
                                            <TouchableOpacity
                                                key={g.id}
                                                style={[styles.guestChip, selectedGuestId === g.id && styles.guestChipActive]}
                                                onPress={() => handleSelectGuest(g)}
                                            >
                                                <MaterialIcons
                                                    name="person"
                                                    size={16}
                                                    color={selectedGuestId === g.id ? colors.primary : colors.gray}
                                                />
                                                <Text style={[styles.guestChipText, selectedGuestId === g.id && styles.guestChipTextActive]}>
                                                    {g.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                            <TextInput
                                style={styles.recipientInput}
                                placeholder="Recipient Name"
                                value={recipientName}
                                onChangeText={(txt) => {
                                    setRecipientName(txt);
                                    if (selectedGuestId) setSelectedGuestId(null);
                                }}
                            />
                            <TextInput
                                style={styles.recipientInput}
                                placeholder="Recipient Phone (Optional)"
                                value={recipientPhone}
                                onChangeText={(txt) => {
                                    setRecipientPhone(txt);
                                    if (selectedGuestId) setSelectedGuestId(null);
                                }}
                                keyboardType="phone-pad"
                            />
                        </View>
                    ) : (
                        <View style={styles.dtRow}>
                            <MaterialIcons name="person-outline" size={18} color={colors.gray} />
                            <Text style={styles.dtText}>{profile?.name || 'Guest User'}</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.dtText}>{profile?.gender || 'Gender Not Set'}</Text>
                        </View>
                    )}
                </View>

                {/* AtSalon: Stylist Preference */}
                {draft.serviceMode === 'AtSalon' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Stylist Preference</Text>
                        <View style={styles.recipientToggle}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, stylistPreference === 'Any' && styles.toggleBtnActive]}
                                onPress={() => setStylistPreference('Any')}
                            >
                                <Text style={[styles.toggleBtnText, stylistPreference === 'Any' && styles.toggleBtnTextActive]}>Any available</Text>
                            </TouchableOpacity>
                            {stylists.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.toggleBtn, stylistPreference === 'Specific' && styles.toggleBtnActive]}
                                    onPress={() => setStylistPreference('Specific')}
                                >
                                    <Text style={[styles.toggleBtnText, stylistPreference === 'Specific' && styles.toggleBtnTextActive]}>I have a preference</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {stylistPreference === 'Specific' && stylists.length > 0 && (
                            <View style={styles.guestPickSection}>
                                <Text style={styles.subLabel}>Available Stylists</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestScroll}>
                                    {stylists.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={[styles.guestChip, selectedStylistId === s.id && styles.guestChipActive]}
                                            onPress={() => setSelectedStylistId(s.id === selectedStylistId ? null : s.id)}
                                        >
                                            <MaterialIcons
                                                name="person"
                                                size={16}
                                                color={selectedStylistId === s.id ? colors.primary : colors.gray}
                                            />
                                            <Text style={[styles.guestChipText, selectedStylistId === s.id && styles.guestChipTextActive]}>
                                                {s.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        {stylistPreference === 'Any' && (
                            <View style={styles.dtRow}>
                                <MaterialIcons name="shuffle" size={16} color={colors.gray} />
                                <Text style={{ fontSize: 13, color: colors.textLight, flex: 1 }}>
                                    Your request will be sent. The salon owner will assign a stylist at the time of service.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* AtHome only: Identity / Professional Note */}
                {draft.serviceMode !== 'AtSalon' && (
                    <View style={[styles.card, { backgroundColor: colors.primarySoft, borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
                        <View style={styles.dtRow}>
                            <MaterialIcons
                                name={atHomePreference === 'Specific' && draft.selectedSalon ? "verified-user" : "admin-panel-settings"}
                                size={18}
                                color={colors.primary}
                            />
                            <Text style={[styles.dtText, { color: colors.primary, fontWeight: '700' }]}>
                                {atHomePreference === 'Specific' && draft.selectedSalon
                                    ? "Verified Professional Selected"
                                    : "Professional Assignment Policy"}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                            {atHomePreference === 'Specific' && draft.selectedSalon
                                ? `${draft.selectedSalon.name} is a verified professional matching your service requirements.`
                                : `A verified professional matching the recipient's requirements will be assigned for your comfort and safety.`}
                        </Text>
                    </View>
                )}

                {/* AtHome: Professional selection choice */}
                {draft.serviceMode === 'AtHome' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Professional Assignment</Text>
                        <View style={styles.recipientToggle}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, atHomePreference === 'Any' && styles.toggleBtnActive]}
                                onPress={() => {
                                    setAtHomePreference('Any');
                                    updateDraft({ selectedSalon: null });
                                }}
                            >
                                <Text style={[styles.toggleBtnText, atHomePreference === 'Any' && styles.toggleBtnTextActive]}>Auto-assign</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, atHomePreference === 'Specific' && styles.toggleBtnActive]}
                                onPress={() => setAtHomePreference('Specific')}
                            >
                                <Text style={[styles.toggleBtnText, atHomePreference === 'Specific' && styles.toggleBtnTextActive]}>Select Specific</Text>
                            </TouchableOpacity>
                        </View>

                        {atHomePreference === 'Specific' && (
                            <TouchableOpacity
                                style={styles.proSelectionBox}
                                onPress={() => setShowProModal(true)}
                            >
                                {draft.selectedSalon ? (
                                    <View style={styles.selectedProRow}>
                                        <View style={styles.proAvatar}>
                                            {draft.selectedSalon.coverImage ? (
                                                <Image source={{ uri: getImageUrl(draft.selectedSalon.coverImage) }} style={styles.proAvatarImg} />
                                            ) : (
                                                <MaterialIcons name="person" size={24} color={colors.grayMedium} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={styles.proNameText}>{draft.selectedSalon.name}</Text>
                                                {draft.selectedSalon.genderPreference === 'Unisex' && (
                                                    <View style={styles.unisexBadgeSmall}>
                                                        <Text style={styles.unisexBadgeTextSmall}>Unisex</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.proLabelText}>{draft.selectedSalon.area || draft.selectedSalon.city}</Text>
                                        </View>
                                        <Text style={styles.changeText}>Change</Text>
                                    </View>
                                ) : (
                                    <View style={styles.noProSelected}>
                                        <MaterialIcons name="person-add" size={20} color={colors.primary} />
                                        <Text style={styles.noProSelectedText}>Tap to choose a professional</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {atHomePreference === 'Any' && (
                            <View style={styles.dtRow}>
                                <MaterialIcons name="verified" size={16} color={colors.gray} />
                                <Text style={{ fontSize: 13, color: colors.textLight, flex: 1 }}>
                                    A top-rated verified professional from {draft.location?.city || 'your area'} will be assigned to you.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Professional Selection Modal */}
            <Modal visible={showProModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Professional</Text>
                            <TouchableOpacity onPress={() => setShowProModal(false)}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {proLoading ? (
                            <View style={styles.modalCenter}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : professionals.length === 0 ? (
                            <View style={styles.modalCenter}>
                                <Text style={styles.emptyText}>No professionals available in {draft.location?.city}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={professionals}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ padding: 16 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.proListItem,
                                            draft.selectedSalon?.id === item.id && styles.proListItemActive
                                        ]}
                                        onPress={() => {
                                            updateDraft({ selectedSalon: item });
                                            setShowProModal(false);
                                        }}
                                    >
                                        <View style={styles.proListAvatar}>
                                            {item.coverImage ? (
                                                <Image source={{ uri: getImageUrl(item.coverImage) }} style={styles.proAvatarImg} />
                                            ) : (
                                                <MaterialIcons name="person" size={20} color={colors.grayMedium} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.proListName}>{item.name}</Text>
                                            <View style={styles.proListMeta}>
                                                <MaterialIcons name="star" size={14} color="#F59E0B" />
                                                <Text style={styles.proListRating}>{item.rating || 'New'}</Text>
                                                <View style={styles.dot} />
                                                <Text style={styles.proListArea}>{item.area}</Text>
                                                {item.genderPreference === 'Unisex' && (
                                                    <>
                                                        <View style={styles.dot} />
                                                        <View style={styles.unisexBadge}>
                                                            <Text style={styles.unisexBadgeText}>Unisex</Text>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                        {draft.selectedSalon?.id === item.id && (
                                            <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <View style={styles.footer}>
                <View style={styles.assignNote}>
                    <MaterialIcons name="info" size={16} color={colors.primary} />
                    <Text style={styles.assignNoteText}>
                        {draft.serviceMode === 'AtSalon'
                            ? 'Please review your booking details before confirming.'
                            : (atHomePreference === 'Specific' && draft.selectedSalon)
                                ? `Booking confirmed with ${draft.selectedSalon.name}.`
                                : 'Top-rated professional will be auto-assigned for your slot.'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookBtn, loading && { opacity: 0.7 }]}
                    onPress={handleBook}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator color={colors.white} />
                            <Text style={styles.bookBtnText}>Confirming Booking…</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="check-circle" size={20} color={colors.white} />
                            <Text style={styles.bookBtnText}>
                                {paymentMethod === 'Online' ? `Confirm & Pay - ₹${totalPrice}` : 'Confirm Booking'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { width: 24, height: 24 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    scroll: { flex: 1 },
    card: { backgroundColor: colors.white, margin: 16, marginBottom: 0, borderRadius: 16, padding: 18, elevation: 1 },
    cardTitle: { fontSize: 13, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    serviceName: { fontSize: 15, color: colors.text, fontWeight: '500' },
    servicePrice: { fontSize: 15, color: colors.text, fontWeight: '700' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: 10, marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
    subtotalLabel: { fontSize: 14, fontWeight: '600', color: colors.gray },
    subtotalPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
    feeLabel: { fontSize: 14, fontWeight: '600', color: colors.gray },
    feePrice: { fontSize: 14, fontWeight: '600', color: colors.secondary },
    dtRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dtText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    nameInput: { borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 8 },
    phoneNote: { fontSize: 13, color: colors.gray },
    footer: { padding: 16, paddingBottom: 32, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayBorder, gap: 10 },
    assignNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, padding: 10, borderRadius: 10 },
    assignNoteText: { fontSize: 12, color: colors.primary, fontWeight: '600', flex: 1 },
    bookBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bookBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    changeText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
    addressBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, padding: 12, borderRadius: 12 },
    addressLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    addressText: { fontSize: 13, color: colors.textLight, marginTop: 2 },
    addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary, borderRadius: 12 },
    addAddrText: { color: colors.primary, fontWeight: '700' },
    paymentOptions: { gap: 10 },
    payOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.grayBorder },
    payOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    payText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.gray },
    payTextActive: { color: colors.text, fontWeight: '700' },
    dot: { marginHorizontal: 6, color: colors.gray },
    distBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    distBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
    editText: { marginLeft: 10, color: colors.primary, fontWeight: '700', fontSize: 13 },

    premiumPayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.grayBorder,
        backgroundColor: colors.white
    },
    premiumPayBtnActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft
    },
    payIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    payMainText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text
    },
    payMainTextActive: {
        color: colors.primary
    },
    paySubText: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2
    },

    recipientToggle: { flexDirection: 'row', backgroundColor: colors.grayBorder, borderRadius: 12, padding: 4, marginBottom: 12 },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    toggleBtnActive: { backgroundColor: colors.white, elevation: 2 },
    toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.gray },
    toggleBtnTextActive: { color: colors.text, fontWeight: '700' },
    recipientForm: { gap: 8 },
    recipientInput: { backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.grayBorder },
    guestPickSection: { marginBottom: 4 },
    subLabel: { fontSize: 11, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', marginBottom: 8 },
    guestScroll: { gap: 8, paddingBottom: 8 },
    guestChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.grayBorder },
    guestChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    guestChipText: { fontSize: 13, fontWeight: '600', color: colors.gray },
    guestChipTextActive: { color: colors.primary, fontWeight: '700' },

    // Professional Selection Styles
    proSelectionBox: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.grayBorder,
        padding: 12,
        backgroundColor: colors.background
    },
    noProSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 4
    },
    noProSelectedText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '700'
    },
    selectedProRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    proAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    proAvatarImg: {
        width: '100%',
        height: '100%'
    },
    proNameText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text
    },
    proLabelText: {
        fontSize: 12,
        color: colors.textLight
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '40%'
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBorder
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text
    },
    modalCenter: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyText: {
        fontSize: 14,
        color: colors.gray,
        textAlign: 'center'
    },
    proListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: colors.grayBorder
    },
    proListItemActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft
    },
    proListAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    proListName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text
    },
    proListMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    proListRating: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F59E0B'
    },
    proListArea: {
        fontSize: 12,
        color: colors.textLight
    },
    unisexBadge: {
        backgroundColor: '#E0F2FE', // light blue
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    unisexBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0369A1',
        textTransform: 'uppercase'
    },
    unisexBadgeSmall: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    unisexBadgeTextSmall: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0369A1',
        textTransform: 'uppercase'
    }
});
