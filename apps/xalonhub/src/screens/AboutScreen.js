import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AboutScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About XalonHub</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="business" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.appName}>XalonHub Inc.</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.para}>
                        XalonHub Inc. is dedicated to empowering beauty professionals and salon owners with 
                        innovative digital tools. Our platform simplifies booking management, 
                        enhances client engagement, and provides the essential infrastructure 
                        needed to grow your business in the modern digital landscape.
                    </Text>
                    
                    <Text style={styles.para}>
                        We believe in transforming the beauty industry by bridging the gap between 
                        professionals and technology, allowing you to focus on what you do best 
                        while we handle the rest.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 XalonHub Inc. All Rights Reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    scrollContent: { padding: 24, alignItems: 'center' },
    logoContainer: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF9C3',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    appName: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    version: { fontSize: 14, color: '#64748B', marginTop: 4 },
    contentCard: {
        backgroundColor: '#F8FAFC', padding: 24, borderRadius: 20,
        width: '100%', borderWidth: 1, borderColor: '#E2E8F0'
    },
    para: {
        fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 16,
        textAlign: 'justify'
    },
    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { fontSize: 12, color: '#94A3B8' }
});
