import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const PLATFORMS = [
    {
        id: 'instagram',
        icon: 'logo-instagram',
        color: '#E1306C',
        bg: '#FFF0F6',
        label: 'Instagram',
        handle: '@xalonhub',
        url: 'https://www.instagram.com/xalonhub',
    },
    {
        id: 'facebook',
        icon: 'logo-facebook',
        color: '#4267B2',
        bg: '#EEF2FF',
        label: 'Facebook',
        handle: 'facebook.com/xalonhub',
        url: 'https://www.facebook.com/xalonhub',
    },
    {
        id: 'youtube',
        icon: 'logo-youtube',
        color: '#FF0000',
        bg: '#FFF1F1',
        label: 'YouTube',
        handle: 'youtube.com/xalonhub',
        url: 'https://www.youtube.com/xalonhub',
    },
];

export default function SocialFollowScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Follow Us</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Stay connected with XalonHub across all platforms</Text>

                <View style={styles.card}>
                    {PLATFORMS.map((p, idx) => (
                        <View key={p.id}>
                            <TouchableOpacity
                                style={styles.row}
                                activeOpacity={0.7}
                                onPress={() => Linking.openURL(p.url)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: p.bg }]}>
                                    <Ionicons name={p.icon} size={24} color={p.color} />
                                </View>
                                <View style={styles.rowInfo}>
                                    <Text style={styles.rowLabel}>{p.label}</Text>
                                    <Text style={styles.rowHandle}>{p.handle}</Text>
                                </View>
                                <Ionicons name="open-outline" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                            {idx < PLATFORMS.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

    content: { flex: 1, padding: 24 },
    subtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 20 },

    card: {
        backgroundColor: '#FFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 16, gap: 14,
    },
    iconBox: {
        width: 46, height: 46, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    rowInfo: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
    rowHandle: { fontSize: 13, color: '#64748B' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
});
