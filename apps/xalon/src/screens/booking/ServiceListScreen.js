import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const GENDER_MAP = { Men: 'Male', Women: 'Female', Unisex: 'Unisex' };

export default function ServiceListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { category, gender, serviceName } = route.params || {};
    const { draft, toggleService, totalDuration, totalPrice } = useBooking();
    const { auth } = useAuth();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [footerAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                // If the "category" is one of our top-level gender filters, 
                // we treat it as a request for ALL services for that gender.
                const isGenderFilter = category === 'Men' || category === 'Women';
                const apiCategory = isGenderFilter ? null : category;
                const apiGender = isGenderFilter ? (category === 'Men' ? 'Male' : 'Female') : gender;

                const data = await api.getServiceCatalog(apiCategory, apiGender);

                let filtered = Array.isArray(data) ? data : [];

                // If a specific service name was passed (from Popular Services), filter for it
                if (serviceName) {
                    filtered = filtered.filter(s =>
                        s.name.toLowerCase().includes(serviceName.toLowerCase())
                    );
                }

                setServices(filtered);
            } catch (err) {
                console.error('[ServiceListScreen] Load Error:', err);
                setError('Failed to load services. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [category, gender, serviceName]);

    useEffect(() => {
        if (draft.selectedServices.length > 0) {
            Animated.spring(footerAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        } else {
            Animated.spring(footerAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    }, [draft.selectedServices.length]);

    const selectedIds = new Set(draft.selectedServices.map((s) => s.id));

    const handleToggle = (item) => {
        toggleService({
            id: item.id,
            name: item.name,
            price: item.specialPrice || item.defaultPrice,
            duration: item.duration,
            gender: item.gender,
        });
    };

    const handleContinue = () => {
        if (draft.selectedServices.length === 0) return;

        // NEW FLOW: No early login gated profile check here. 
        // We move to Slot Selection (BookingDateTime) immediately.
        navigation.navigate('BookingDateTime');
    };

    const renderItem = ({ item, index }) => {
        const selected = selectedIds.has(item.id);
        const isPremium = index % 3 === 0; // Simulate some premium items for visual variety

        return (
            <TouchableOpacity
                onPress={() => handleToggle(item)}
                activeOpacity={0.9}
                style={styles.cardContainer}
            >
                <View style={[styles.card, selected && styles.cardSelected]}>
                    {selected && (
                        <LinearGradient
                            colors={[colors.primaryLight, colors.white]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <View style={styles.cardContent}>
                        <View style={styles.cardLeft}>
                            <View style={styles.nameRow}>
                                <Text style={styles.serviceName}>{item.name}</Text>
                                {isPremium && (
                                    <View style={styles.trendingBadge}>
                                        <MaterialIcons name="trending-up" size={10} color={colors.gold} />
                                        <Text style={styles.trendingText}>TRENDING</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.metaRow}>
                                <View style={styles.metaIconText}>
                                    <MaterialIcons name="schedule" size={14} color={colors.gray} />
                                    <Text style={styles.metaText}>{item.duration} min</Text>
                                </View>
                                <View style={styles.dot} />
                                <Text style={styles.fulfillmentText}>
                                    {draft.serviceMode === 'AtHome' ? 'Doorstep Expert' : 'Professional Salon'}
                                </Text>
                            </View>
                            <Text style={styles.description} numberOfLines={2}>
                                {item.description || "Expert service delivered with premium products for a salon-like experience at your convenience."}
                            </Text>
                        </View>
                        <View style={styles.cardRight}>
                            <View style={styles.priceContainer}>
                                {item.specialPrice && (
                                    <Text style={styles.priceOriginal}>₹{item.defaultPrice}</Text>
                                )}
                                <Text style={styles.price}>₹{item.specialPrice || item.defaultPrice}</Text>
                            </View>
                            <View style={[styles.addButton, selected && styles.addButtonActive]}>
                                <MaterialIcons
                                    name={selected ? "remove-circle-outline" : "add-circle-outline"}
                                    size={18}
                                    color={selected ? colors.error : colors.primary}
                                />
                                <Text style={[styles.addButtonText, selected && styles.addButtonTextActive]}>
                                    {selected ? "REMOVE" : "ADD"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{category || 'Services'}</Text>
                <TouchableOpacity style={styles.searchBtn}>
                    <MaterialIcons name="search" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Mode focused info bar */}
            <View style={styles.modeWrapper}>
                <LinearGradient
                    colors={draft.serviceMode === 'AtHome' ? ['#F5F3FF', '#EDE9FE'] : ['#F3F4F6', '#E5E7EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modeBar}
                >
                    <View style={styles.modeIconCircle}>
                        <MaterialIcons
                            name={draft.serviceMode === 'AtHome' ? 'bolt' : 'storefront'}
                            size={16}
                            color={draft.serviceMode === 'AtHome' ? colors.primary : colors.gray}
                        />
                    </View>
                    <View>
                        <Text style={styles.modeLabel}>
                            {draft.serviceMode === 'AtHome' ? 'Premium At-Home Service' : 'Premium Salon Visit'}
                        </Text>
                        <Text style={styles.modeSubtext}>
                            {draft.serviceMode === 'AtHome' ? 'Top-rated expert arrives at your doorstep' : 'Visit our verified partner salon'}
                        </Text>
                    </View>
                </LinearGradient>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.loadingText}>Fetching curated services...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('ServiceList', { category, gender })}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="sentiment-dissatisfied" size={64} color={colors.grayMedium} />
                            <Text style={styles.emptyTitle}>No services today</Text>
                            <Text style={styles.emptyText}>We couldn't find any services in this category right now.</Text>
                        </View>
                    }
                />
            )}

            {/* Bottom Floating CTA */}
            <Animated.View style={[
                styles.footerContainer,
                { transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [150, 0] }) }] }
            ]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.9)', colors.white]}
                    style={styles.footerGradient}
                >
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerCount}>
                                {draft.selectedServices.length} {draft.selectedServices.length > 1 ? 'Services' : 'Service'} • {totalDuration} min
                            </Text>
                            <Text style={styles.footerTotal}>₹{totalPrice}</Text>
                        </View>
                        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                            <LinearGradient
                                colors={colors.primaryGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.continueGradient}
                            >
                                <Text style={styles.continueBtnText}>Continue</Text>
                                <MaterialIcons name="chevron-right" size={20} color={colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.white
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    searchBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },

    modeWrapper: { paddingHorizontal: 20, marginBottom: 12 },
    modeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.grayBorder
    },
    modeIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    modeLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    modeSubtext: { fontSize: 11, color: colors.gray, marginTop: 1 },

    list: { padding: 20, paddingBottom: 120 },
    cardContainer: { marginBottom: 16 },
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.grayBorder,
        elevation: 3,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    cardSelected: { borderColor: colors.primary, borderWidth: 1.5 },
    cardContent: { padding: 16, flexDirection: 'row' },
    cardLeft: { flex: 1, paddingRight: 10 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    serviceName: { fontSize: 16, fontWeight: '700', color: colors.text },
    trendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    trendingText: { fontSize: 9, fontWeight: '900', color: colors.gold },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    metaIconText: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: colors.gray, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.grayMedium },
    fulfillmentText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

    description: { fontSize: 13, color: colors.textLight, lineHeight: 18 },

    cardRight: { width: 90, alignItems: 'flex-end', justifyContent: 'space-between' },
    priceContainer: { alignItems: 'flex-end' },
    price: { fontSize: 18, fontWeight: '800', color: colors.text },
    priceOriginal: { fontSize: 12, color: colors.gray, textDecorationLine: 'line-through', marginBottom: -2 },

    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primaryLight
    },
    addButtonActive: { backgroundColor: colors.white, borderColor: colors.error, borderWidth: 1 },
    addButtonText: { fontSize: 12, fontWeight: '800', color: colors.primary },
    addButtonTextActive: { color: colors.error },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14, color: colors.gray, fontWeight: '500' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorText: { color: colors.gray, fontSize: 15, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary },
    retryText: { color: colors.white, fontWeight: '700' },

    emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
    emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent'
    },
    footerGradient: {
        padding: 20,
        paddingBottom: 34,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerCount: { fontSize: 13, color: colors.gray, fontWeight: '600' },
    footerTotal: { fontSize: 24, color: colors.text, fontWeight: '900', letterSpacing: -1 },
    continueBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
    continueGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 14 },
    continueBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
