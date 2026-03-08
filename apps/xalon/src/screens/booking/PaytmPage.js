import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';

export default function PaytmPage({ route, navigation }) {
    const { params } = route.params; // These are paytmParams from backend
    const [loading, setLoading] = useState(true);
    const [isDevMode, setIsDevMode] = useState(false);

    useEffect(() => {
        // Check if we are in a mock/dev environment
        if (!params.MID || params.MID.includes('MOCK')) {
            setIsDevMode(true);
            setLoading(false);
        }
    }, [params]);

    const handleSimulatePayment = async (status) => {
        setLoading(true);
        try {
            // In a real scenario, Paytm calls the callback. 
            // In simulation, we call a mock callback or just update status if it's purely frontend test.
            // But since the backend handles callback to update DB, we should ideally trigger that.

            // For now, let's just simulate the navigation result as if callback happened.
            if (status === 'Success') {
                // Ideally trigger the callback route on backend for simulation
                await api.initiatePayment({
                    bookingId: params.ORDER_ID,
                    paymentMethod: 'Online',
                    simulationStatus: 'TXN_SUCCESS' // We'd need to support this on backend
                }).catch(() => { });

                Alert.alert('Success', 'Payment simulated successfully.');
                navigation.navigate('BookingSuccess', { bookingId: params.ORDER_ID });
            } else {
                Alert.alert('Failed', 'Payment simulated as failed.');
                navigation.goBack();
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to simulate payment.');
        } finally {
            setLoading(false);
        }
    };

    if (isDevMode) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Simulation</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <MaterialIcons name="qr-code-2" size={80} color={colors.primary} />
                    <Text style={styles.title}>UPI / Online Payment</Text>
                    <Text style={styles.subtitle}>Order ID: {params.ORDER_ID}</Text>
                    <Text style={styles.amount}>₹{params.TXN_AMOUNT}</Text>

                    <View style={styles.simButtons}>
                        <TouchableOpacity
                            style={[styles.btn, styles.successBtn]}
                            onPress={() => handleSimulatePayment('Success')}
                        >
                            <Text style={styles.btnText}>Simulate Success</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.failBtn]}
                            onPress={() => handleSimulatePayment('Failed')}
                        >
                            <Text style={styles.btnText}>Simulate Failure</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Real Paytm form POST using WebView
    const paytmUrl = (params.MID && (params.MID.includes('STAGING') || params.MID.startsWith('MOCK')))
        ? "https://securegw-stage.paytm.in/order/process"
        : "https://securegw.paytm.in/order/process";

    const htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ffffff; color: #1a1a1a; }
                    .container { text-align: center; padding: 20px; }
                    .loader { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #00baf2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 24px; }
                    h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
                    p { font-size: 14px; color: #6b7280; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body onload="document.forms[0].submit()">
                <div class="container">
                    <div class="loader"></div>
                    <h2>Secure Payment</h2>
                    <p>Redirecting to Paytm Payment Gateway...</p>
                </div>
                <form method="post" action="${paytmUrl}">
                    ${Object.keys(params).map(key => `
                        <input type="hidden" name="${key}" value="${params[key]}" />
                    `).join('')}
                </form>
            </body>
        </html>
    `;

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.action === 'PAYMENT_COMPLETE') {
                if (data.status === 'Paid' || data.status === 'Pending') {
                    // Pending is also okay for transition; backend will confirm eventually
                    navigation.navigate('BookingSuccess', { bookingId: data.bookingId });
                } else {
                    Alert.alert('Payment Failed', 'Your online payment was not successful or was cancelled.');
                    navigation.goBack();
                }
            }
        } catch (err) {
            console.log('WebView message parse error:', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Secure Payment</Text>
                <View style={{ width: 24 }} />
            </View>
            <WebView
                source={{ html: htmlContent }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onMessage={handleWebViewMessage}
                style={{ flex: 1 }}
            />
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBorder
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 20 },
    subtitle: { fontSize: 14, color: colors.gray, marginTop: 8 },
    amount: { fontSize: 32, fontWeight: '900', color: colors.primary, marginVertical: 30 },
    simButtons: { width: '100%', gap: 12 },
    btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    successBtn: { backgroundColor: '#2e7d32' },
    failBtn: { backgroundColor: '#c62828' },
    btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }
});
