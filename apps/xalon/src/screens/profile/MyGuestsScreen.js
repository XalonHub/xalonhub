import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function MyGuestsScreen() {
    const navigation = useNavigation();
    const { auth } = useAuth();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchGuests = useCallback(async () => {
        if (!auth?.customerId) return;
        setLoading(true);
        try {
            const data = await api.getGuests(auth.customerId);
            if (!data.error) setGuests(data);
        } catch (err) {
            console.error('Fetch guests error:', err);
        }
        setLoading(false);
    }, [auth?.customerId]);

    useFocusEffect(
        useCallback(() => {
            fetchGuests();
        }, [fetchGuests])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchGuests();
        setRefreshing(false);
    };

    const handleDelete = (guestId) => {
        Alert.alert(
            'Delete Guest',
            'Are you sure you want to delete this guest profile? Existing bookings will revert to "Guest" name.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteGuest(auth.customerId, guestId);
                            fetchGuests();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete guest.');
                        }
                    }
                },
            ]
        );
    };

    const renderGuest = ({ item }) => (
        <View style={styles.guestCard}>
            <View style={styles.guestInfo}>
                <View style={styles.avatar}>
                    <MaterialIcons name="person" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.guestName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        {item.relationship && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.relationship}</Text>
                            </View>
                        )}
                        {item.mobileNumber && (
                            <Text style={styles.phoneText}>{item.mobileNumber}</Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddEditGuest', { guest: item })}
                    style={styles.actionBtn}
                >
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.actionBtn}
                >
                    <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Guests</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {loading && !refreshing && guests.length === 0 ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                ) : guests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <MaterialIcons name="people-outline" size={48} color={colors.gray} />
                        </View>
                        <Text style={styles.emptyTitle}>No Guests yet</Text>
                        <Text style={styles.emptySub}>Add your family or friends to book services for them quickly.</Text>
                        <TouchableOpacity
                            style={styles.addBtnLarge}
                            onPress={() => navigation.navigate('AddEditGuest')}
                        >
                            <MaterialIcons name="add" size={20} color={colors.white} />
                            <Text style={styles.addBtnLargeText}>Add New Guest</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={guests}
                            renderItem={renderGuest}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.list}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                            }
                        />
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => navigation.navigate('AddEditGuest')}
                            activeOpacity={0.85}
                        >
                            <MaterialIcons name="add" size={28} color={colors.white} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    content: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 100 },
    guestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1 },
    guestInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    guestName: { fontSize: 16, fontWeight: '700', color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    badge: { backgroundColor: colors.grayLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '600', color: colors.gray },
    phoneText: { fontSize: 13, color: colors.gray },
    actions: { flexDirection: 'row', gap: 4 },
    actionBtn: { padding: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconBg: { width: 100, height: 100, borderRadius: 32, backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    addBtnLarge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    addBtnLargeText: { color: colors.white, fontSize: 15, fontWeight: '700' },
    fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
});
