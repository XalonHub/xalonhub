import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, SafeAreaView, StatusBar, KeyboardAvoidingView,
    Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { colors } from '../theme/colors';
import api from '../services/api';

export default function LoginScreen({ navigation, route }) {
    const { returnTo } = route.params || {};
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.sendOTP(phone);
            if (res.success) {
                navigation.navigate('OTPVerify', { phone, dev_otp: res.dev_otp, returnTo });
            } else {
                Alert.alert('Error', res.message || 'Could not send OTP. Please try again.');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
                <View style={styles.card}>
                    <Image
                        source={require('../assets/brand/logo_full.png')}
                        style={styles.logoFull}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Get Started</Text>
                    <Text style={styles.subtitle}>Enter your mobile number to book beauty services</Text>

                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.countryCode}>🇮🇳 +91</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10 digit mobile number"
                            placeholderTextColor={colors.gray}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <Text style={styles.terms}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.link}>Terms of Service</Text> &{' '}
                        <Text style={styles.link}>Privacy Policy</Text>
                    </Text>

                    <TouchableOpacity
                        style={[styles.btn, phone.length !== 10 && styles.btnDisabled]}
                        onPress={handleSendOTP}
                        disabled={loading || phone.length !== 10}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.btnText}>Request OTP</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    card: {
        backgroundColor: colors.white, borderRadius: 20,
        padding: 28, shadowColor: '#000',
        shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    },
    logoFull: {
        width: 120,
        height: 48,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.black, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.textLight, marginBottom: 28, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: colors.primary,
        borderRadius: 12, paddingHorizontal: 14, height: 54,
    },
    countryCode: { fontSize: 15, color: colors.text, marginRight: 10 },
    input: { flex: 1, fontSize: 17, color: colors.text, fontWeight: '600' },
    terms: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginVertical: 20, lineHeight: 18 },
    link: { color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
    btn: {
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
    },
    btnDisabled: { backgroundColor: colors.grayBorder },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
