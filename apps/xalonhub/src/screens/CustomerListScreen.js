import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, FlatList, ActivityIndicator, TextInput,
    Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartnerCustomers } from '../services/api';

const TYPE_CONFIG = {
    'Member': { color: '#6366F1', bg: '#EEF2FF', icon: 'person' },
    'Guest': { color: '#F59E0B', bg: '#FEF9C3', icon: 'people' },
    'Walk-in': { color: '#059669', bg: '#ECFDF5', icon: 'walk' },
};

export default function CustomerListScreen({ navigation }) {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCustomers = async () => {
        try {
            const partnerId = await AsyncStorage.getItem('partnerId');
            if (!partnerId) {
                setLoading(false);
                return;
            }
            const res = await getPartnerCustomers(partnerId);
            setCustomers(res.data || []);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCustomers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomers();
    };

    const maskPhone = (phone) => {
        if (!phone) return 'N/A';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 4) return phone;
        const last4 = cleaned.slice(-4);
        const prefix = phone.startsWith('+') ? '+91 ' : '';
        return `${prefix}******${last4}`;
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const renderItem = ({ item }) => {
        const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.Guest;
        const lastSeen = new Date(item.lastBookingDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        return (
            <View style={styles.customerCard}>
                <View style={styles.cardMain}>
                    <View style={styles.avatarContainer}>
                        {item.profileImg ? (
                            <Image source={{ uri: item.profileImg }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: typeConfig.bg }]}>
                                <Text style={[styles.avatarText, { color: typeConfig.color }]}>
                                    {(item.name || 'C').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.infoContainer}>
                        <View style={styles.nameRow}>
                            <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                                <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
                                <Text style={[styles.typeText, { color: typeConfig.color }]}>{item.type}</Text>
                            </View>
                        </View>
                        <Text style={styles.customerPhone}>{maskPhone(item.phone)}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Last Service</Text>
                        <Text style={styles.statValue}>{lastSeen}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Bookings</Text>
                        <Text style={styles.statValue}>{item.totalBookings} times</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Customers</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or number..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94A3B8"
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No customers yet</Text>
                            <Text style={styles.emptySub}>Customers who book services with you will appear here.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    
    searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        marginLeft: 8,
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    customerCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 16 },
    avatarImg: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700' },
    
    infoContainer: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    customerName: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    typeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    customerPhone: { fontSize: 14, color: '#64748B', fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },
    statLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontSize: 13, fontWeight: '600', color: '#334155' },

    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
