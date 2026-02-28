import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OTPVerifyScreen({ route, navigation }) {
    const { phone } = route.params;
    const { login } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const inputs = useRef([]);

    useEffect(() => {
        if (resendTimer === 0) return;
        const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const handleChange = (val, i) => {
        // Support pasting full OTP
        if (val.length === 4) {
            const digits = val.split('');
            setOtp(digits);
            inputs.current[3]?.focus();
            return;
        }
        const newOtp = [...otp];
        newOtp[i] = val;
        setOtp(newOtp);
        if (val && i < 3) inputs.current[i + 1]?.focus();
    };

    const handleBackspace = (val, i) => {
        if (!val && i > 0) inputs.current[i - 1]?.focus();
    };

    const handleVerify = async () => {
        const otpStr = otp.join('');
        if (otpStr.length !== 4) return;
        setLoading(true);
        try {
            const res = await api.verifyOTP(phone, otpStr);
            if (!res.success) {
                Alert.alert('Invalid OTP', res.message || 'Please try again.');
                return;
            }
            // Store auth via context — AppNavigator re-renders to MainTabs automatically
            await login({
                token: res.token,
                user: res.user,
                customerProfile: res.customerProfile,
            });
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        await api.sendOTP(phone);
        setOtp(['', '', '', '']);
        setResendTimer(30);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
                    <Text style={styles.backText}>Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>Enter OTP</Text>
                <Text style={styles.subtitle}>
                    We sent a 4-digit OTP to{'\n'}
                    <Text style={styles.phone}>+91 {phone}</Text>
                </Text>

                <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                        <TextInput
                            key={i}
                            ref={ref => inputs.current[i] = ref}
                            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                            keyboardType="number-pad"
                            maxLength={i === 0 ? 4 : 1}
                            value={digit}
                            onChangeText={val => handleChange(val, i)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace') handleBackspace(digit, i);
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.btn, otp.join('').length !== 4 && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={loading || otp.join('').length !== 4}
                >
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Verify & Continue</Text>}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                    <Text style={styles.resendText}>Didn't receive OTP? </Text>
                    {resendTimer > 0 ? (
                        <Text style={styles.timer}>Resend in {resendTimer}s</Text>
                    ) : (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendLink}>Resend OTP</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    back: { paddingHorizontal: 20, paddingTop: 20 },
    backText: { fontSize: 16, color: colors.primary, marginLeft: 4, fontWeight: '600' },
    content: { paddingHorizontal: 28, paddingTop: 20 },
    title: { fontSize: 26, fontWeight: '800', color: colors.black, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textLight, lineHeight: 22, marginBottom: 36 },
    phone: { color: colors.black, fontWeight: '700' },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
    otpBox: {
        width: 60, height: 64, borderRadius: 14,
        borderWidth: 1.5, borderColor: colors.grayBorder,
        textAlign: 'center', fontSize: 26, fontWeight: '700', color: colors.black,
        backgroundColor: colors.grayLight,
    },
    otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    btnDisabled: { backgroundColor: colors.gray },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    resendText: { color: colors.textLight, fontSize: 14 },
    timer: { color: colors.gray, fontSize: 14 },
    resendLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
