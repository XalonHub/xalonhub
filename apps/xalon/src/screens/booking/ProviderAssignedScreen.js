import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { openMaps } from '../../utils/bookingUtils';
import api from '../../services/api';

const PARTNER_TYPE_LABELS = {
    Freelancer: 'Freelancer',
    Male_Salon: 'Salon',
    Female_Salon: 'Salon',
    Unisex_Salon: 'Salon',
};

// Helper for image URLs
const getImageUrl = (url) => {
    const BU = api.BASE_URL || 'http://localhost:5001';
    if (!url) return null;
    if (url.startsWith('http')) {
        return url.replace(/http:\/\/192\.168\.1\.10:5000/g, BU);
    }
    return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProviderAssignedScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { noProvider } = route.params || {};

    if (noProvider) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.fallback}>
                    <MaterialIcons name="search-off" size={64} color={colors.gray} />
                    <Text style={styles.fallbackTitle}>No professionals available</Text>
                    <Text style={styles.fallbackSub}>No professionals available right now. Please try a different time or location.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryBtnText}>Try Different Time</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // This should not be reached in the new flow
    return null;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12 },
    assignedText: { fontSize: 13, fontWeight: '600', color: colors.success, flex: 1 },
    providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: 16, marginTop: 0, borderRadius: 20, padding: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, gap: 14 },
    providerAvatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    providerAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    providerName: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    typeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, color: colors.gray },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    ratingText: { fontSize: 14, fontWeight: '800', color: '#92400E' },
    waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#25D366', backgroundColor: '#F0FFF4' },
    waBtnText: { fontSize: 15, fontWeight: '700', color: '#128C7E' },
    fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    fallbackTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    fallbackSub: { fontSize: 15, color: colors.gray, textAlign: 'center', lineHeight: 22 },
    retryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
    retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    footer: { padding: 16, paddingBottom: 36, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayBorder },
    confirmBtn: { backgroundColor: colors.success, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, alignItems: 'stretch' },
    actionDirBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', gap: 4 },
    actionDirText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
