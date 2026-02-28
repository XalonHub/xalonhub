import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

export default function SubscriptionPaymentScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Payment</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.icon}>💳</Text>
                <Text style={styles.title}>Payment Gateway Placeholder</Text>
                <Text style={styles.subtitle}>This screen will integrate with Razorpay or Stripe to process subscription payments.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    backBtn: { padding: 8, marginRight: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    backIcon: { fontSize: 24, color: '#1E293B', lineHeight: 24, fontWeight: '600' },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1E293B' },

    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    icon: { fontSize: 80, marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24 }
});
