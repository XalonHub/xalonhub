import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { getPartnerReviews } from '../services/api';

// ─── Star Row Component ───────────────────────────────────────────────────────
function StarRow({ rating = 0, size = 16, style }) {
    return (
        <View style={[{ flexDirection: 'row', gap: 2 }, style]}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
                    size={size}
                    color={star <= rating || star - 0.5 <= rating ? '#F59E0B' : '#CBD5E1'}
                />
            ))}
        </View>
    );
}

// ─── Rating Bar ──────────────────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View style={styles.ratingBarRow}>
            <Text style={styles.ratingBarStar}>{star}★</Text>
            <View style={styles.ratingBarBg}>
                <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.ratingBarCount}>{count}</Text>
        </View>
    );
}

// ─── Review Card ─────────────────────────────────────────────────────────────
function ReviewCard({ item }) {
    const [noteExpanded, setNoteExpanded] = useState(false);

    const booking = item.booking || {};
    const customerName =
        booking.customer?.name ||
        booking.beneficiaryName ||
        booking.guestName ||
        booking.client?.name ||
        'Customer';

    const services = Array.isArray(booking.services) ? booking.services : [];
    const firstService = services[0]?.serviceName || 'Service';
    const dateStr = booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
          })
        : '';

    return (
        <View style={styles.reviewCard}>
            {/* Header row */}
            <View style={styles.reviewHeader}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                        {customerName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.reviewCustomerName}>{customerName}</Text>
                    <Text style={styles.reviewMeta}>{firstService} · {dateStr}</Text>
                </View>
                {item.rating != null && (
                    <View style={styles.ratingChip}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingChipText}>{item.rating}.0</Text>
                    </View>
                )}
            </View>

            {/* Stars */}
            {item.rating != null && (
                <StarRow rating={item.rating} size={14} style={{ marginTop: 8 }} />
            )}

            {/* Review text */}
            {item.reviewText ? (
                <Text style={styles.reviewText}>"{item.reviewText}"</Text>
            ) : (
                <Text style={styles.noReviewText}>No written review</Text>
            )}

            {/* Partner note chip */}
            {item.partnerNote && (
                <TouchableOpacity
                    style={styles.noteChip}
                    onPress={() => setNoteExpanded(!noteExpanded)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="document-text-outline" size={13} color={colors.secondary} />
                    <Text style={styles.noteChipText}>Your Note</Text>
                    <Ionicons
                        name={noteExpanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={colors.secondary}
                    />
                </TouchableOpacity>
            )}
            {noteExpanded && item.partnerNote && (
                <View style={styles.noteExpanded}>
                    <Text style={styles.noteExpandedText}>{item.partnerNote}</Text>
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FeedbackScreen({ navigation }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = async () => {
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId) { setLoading(false); return; }
            const res = await getPartnerReviews(partnerId);
            console.log('[FeedbackScreen] Fetched reviews:', JSON.stringify(res?.data, null, 2));
            setReviews(res?.data || []);
        } catch (err) {
            console.error('FeedbackScreen fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchReviews(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchReviews(); };

    // ── Aggregate stats ──────────────────────────────────────────────────────
    const ratedReviews = reviews.filter((r) => r.rating != null);
    const totalReviews = ratedReviews.length;
    const averageRating =
        totalReviews > 0
            ? Math.round((ratedReviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
            : 0;

    const starCounts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: ratedReviews.filter((r) => r.rating === star).length,
    }));

    const ListHeader = () => (
        <View style={styles.summaryCard}>
            {/* Average big display */}
            <View style={styles.avgRow}>
                <Text style={styles.avgNumber}>{averageRating || '–'}</Text>
                <View>
                    <StarRow rating={averageRating} size={24} />
                    <Text style={styles.totalReviewsText}>
                        {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </Text>
                </View>
            </View>

            {/* Per-star bars */}
            <View style={styles.barsContainer}>
                {starCounts.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} total={totalReviews} />
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Feedback & Reviews</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ReviewCard item={item} />}
                    ListHeaderComponent={<ListHeader />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="star-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No reviews yet</Text>
                            <Text style={styles.emptySub}>
                                Complete bookings to start receiving customer feedback.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 40, gap: 12 },

    // Summary card
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    avgNumber: {
        fontSize: 56,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 60,
    },
    totalReviewsText: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    barsContainer: { gap: 6 },
    ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ratingBarStar: { fontSize: 12, color: '#64748B', fontWeight: '600', width: 20 },
    ratingBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    ratingBarFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
    ratingBarCount: { fontSize: 12, color: '#64748B', fontWeight: '600', width: 20, textAlign: 'right' },

    // Review card
    reviewCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: { fontSize: 18, fontWeight: '800', color: colors.primary },
    reviewCustomerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    reviewMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    ratingChipText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
    reviewText: {
        marginTop: 10,
        fontSize: 14,
        color: '#334155',
        lineHeight: 21,
        fontStyle: 'italic',
    },
    noReviewText: { marginTop: 10, fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
    noteChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 12,
        alignSelf: 'flex-start',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    noteChipText: { fontSize: 12, fontWeight: '700', color: colors.secondary },
    noteExpanded: {
        marginTop: 8,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: colors.secondary,
    },
    noteExpandedText: { fontSize: 13, color: '#064E3B', lineHeight: 20 },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', maxWidth: 260 },
});
