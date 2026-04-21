import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, StatusBar, KeyboardAvoidingView,
    Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { sendOTP, getBranding } from '../services/api';

export default function LoginScreen({ navigation }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);

    React.useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await getBranding();
                if (res.data && res.data.logoUrl) {
                    setLogoUrl(res.data.logoUrl);
                }
            } catch (e) {
                console.log('[LoginScreen] Branding fetch failed', e.message);
            }
        };
        fetchBranding();
    }, []);

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
            return;
        }
        setLoading(true);
        try {
            const res = await sendOTP(phone);
            const dev_otp = res.data?.dev_otp;
            navigation.navigate('OTPVerify', { phone, dev_otp });
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[colors.primary, colors.secondary]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <View style={styles.brandPill}>
                        {logoUrl ? (
                            <Image
                                source={{ uri: logoUrl }}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={[styles.logoImage, { backgroundColor: '#f0f0f0', borderRadius: 4 }]} />
                        )}
                        <Text style={styles.hubText}>HUB</Text>
                    </View>
                    <Text style={styles.headerSub}>Partner Portal</Text>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Welcome, Partner!</Text>
                        <Text style={styles.subtitle}>Enter your mobile number to manage your salon</Text>

                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="10 Digit Mobile Number"
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoImage: { width: 160, height: 42 },
    hubText: { fontSize: 16, fontWeight: '800', color: colors.primary, marginLeft: 6, letterSpacing: 1.5, marginTop: 4 },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8, marginTop: -4 },
    inner: { flex: 1, paddingHorizontal: 24, marginTop: -20 },
    card: {
        backgroundColor: colors.white, borderRadius: 20,
        padding: 28, shadowColor: '#000',
        shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.black, marginBottom: 6 },
    subtitle: { fontSize: 13, color: colors.textLight, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: colors.primary,
        borderRadius: 10, paddingHorizontal: 12, height: 52,
    },
    countryCode: { fontSize: 16, color: colors.text, marginRight: 8 },
    input: { flex: 1, fontSize: 16, color: colors.text },
    terms: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginVertical: 20, lineHeight: 18 },
    link: { color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
    btn: {
        backgroundColor: colors.primary, borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
    },
    btnDisabled: { backgroundColor: colors.grayBorder },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
