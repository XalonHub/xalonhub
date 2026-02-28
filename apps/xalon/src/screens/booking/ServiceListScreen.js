import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import api from '../../services/api';

const GENDER_MAP = { Men: 'Male', Women: 'Female', Unisex: 'Unisex' };

export default function ServiceListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { category, gender } = route.params || {};
    const { draft, toggleService } = useBooking();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await api.getServiceCatalog(category, GENDER_MAP[category] || gender);
                setServices(Array.isArray(data) ? data : []);
            } catch {
                setError('Failed to load services. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [category, gender]);

    const selectedIds = new Set(draft.selectedServices.map((s) => s.id));

    const handleToggle = (item) => {
        toggleService({
            id: item.id,
            name: item.name,
            price: item.specialPrice || item.defaultPrice,
            duration: item.duration,
        });
    };

    const handleContinue = () => {
        if (draft.selectedServices.length === 0) return;
        navigation.navigate('BookingDateTime');
    };

    const renderItem = ({ item }) => {
        const selected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => handleToggle(item)}
                activeOpacity={0.8}
            >
                <View style={styles.cardLeft}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <MaterialIcons name="schedule" size={13} color={colors.gray} />
                        <Text style={styles.metaText}>{item.duration} min</Text>
                        <View style={styles.fulfillmentChip}>
                            <Text style={styles.fulfillmentText}>{item.fulfillmentType || 'Salon & Freelancer'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={styles.price}>
                        {item.specialPrice ? (
                            <>
                                <Text style={styles.priceOriginal}>₹{item.defaultPrice}  </Text>
                                {'₹' + item.specialPrice}
                            </>
                        ) : (
                            '₹' + item.defaultPrice
                        )}
                    </Text>
                    <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
                        {selected && <MaterialIcons name="check" size={14} color={colors.white} />}
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
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{category || 'Services'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Mode info */}
            <View style={styles.modeBar}>
                <MaterialIcons name={draft.serviceMode === 'AtHome' ? 'home' : 'storefront'} size={15} color={colors.primary} />
                <Text style={styles.modeText}>{draft.serviceMode === 'AtHome' ? 'At Home – Freelancer assigned' : 'At Salon – Salon assigned'}</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color={colors.primary} size="large" />
            ) : error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="search-off" size={48} color={colors.gray} />
                            <Text style={styles.emptyText}>No services found for this category.</Text>
                        </View>
                    }
                />
            )}

            {/* Bottom CTA */}
            {draft.selectedServices.length > 0 && (
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerCount}>{draft.selectedServices.length} service{draft.selectedServices.length > 1 ? 's' : ''} selected</Text>
                        <Text style={styles.footerTotal}>Total: ₹{draft.selectedServices.reduce((s, x) => s + x.price, 0)}</Text>
                    </View>
                    <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                        <Text style={styles.continueBtnText}>Continue</Text>
                        <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    modeBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 8 },
    modeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    list: { padding: 16, gap: 10 },
    card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.grayBorder, elevation: 1 },
    cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '44' },
    cardLeft: { flex: 1, gap: 6 },
    cardRight: { alignItems: 'flex-end', gap: 8 },
    serviceName: { fontSize: 15, fontWeight: '700', color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: colors.gray },
    fulfillmentChip: { backgroundColor: colors.grayLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    fulfillmentText: { fontSize: 11, color: colors.gray, fontWeight: '600' },
    price: { fontSize: 16, fontWeight: '800', color: colors.primary },
    priceOriginal: { fontSize: 12, color: colors.gray, textDecorationLine: 'line-through' },
    checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.grayBorder, justifyContent: 'center', alignItems: 'center' },
    checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorText: { color: colors.error, fontSize: 15, fontWeight: '600' },
    emptyContainer: { paddingTop: 80, alignItems: 'center', gap: 12 },
    emptyText: { color: colors.gray, fontSize: 15, fontWeight: '500' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 24, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    footerCount: { fontSize: 13, color: colors.gray, fontWeight: '600' },
    footerTotal: { fontSize: 17, color: colors.text, fontWeight: '800' },
    continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
    continueBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
