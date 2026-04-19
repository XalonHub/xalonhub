import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../theme/colors';
import { verifyOTP, sendOTP } from '../services/api';
import { useOnboarding } from '../context/OnboardingContext';

export default function OTPVerifyScreen({ route, navigation }) {
    const { phone, dev_otp: initialDevOtp } = route.params;
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [currentDevOtp, setCurrentDevOtp] = useState(initialDevOtp);
    const inputs = useRef([]);

    const { syncCloudDraftToLocal, clearOnboardingDraft } = useOnboarding();

    useEffect(() => {
        if (resendTimer === 0) return;
        const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    const handleChange = (val, i) => {
        // Handle pasting of full OTP
        if (val.length > 1) {
            const pastedDigits = val.replace(/\D/g, '').split('').slice(0, 4);
            const newOtp = [...otp];
            pastedDigits.forEach((digit, index) => {
                if (i + index < 4) {
                    newOtp[i + index] = digit;
                }
            });
            setOtp(newOtp);

            // Focus on the next empty box, or the last box if full
            const nextFocusIndex = Math.min(i + pastedDigits.length, 3);
            inputs.current[nextFocusIndex]?.focus();
            return;
        }

        // Handle single digit entry
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
            const res = await verifyOTP(phone, otpStr, 'partner');
            console.log("OTP verify success!", res.data);
            await SecureStore.setItemAsync('token', res.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));

            // ALWAYS clear all local data on fresh login to prevent contamination
            await clearOnboardingDraft();

            if (res.data.partnerProfile) {
                const partnerId = res.data.partnerProfile.id;
                await AsyncStorage.setItem('partnerId', partnerId);
                const finalData = await syncCloudDraftToLocal(res.data.partnerProfile, true);

                const resetTo = (name) => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name }],
                    });
                };

                if (finalData.lastScreen) {
                    resetTo(finalData.lastScreen);
                } else if (res.data.partnerProfile.partnerType === 'Freelancer') {
                    const hasBasicInfo = res.data.partnerProfile.basicInfo && res.data.partnerProfile.basicInfo.name;
                    resetTo(!hasBasicInfo ? 'BasicInfo' : 'LocationConfirm');
                } else {
                    const hasBasicInfo = res.data.partnerProfile.basicInfo && res.data.partnerProfile.basicInfo.name;
                    resetTo(!hasBasicInfo ? 'SalonBasicInfo' : 'SalonAddress');
                }
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'WorkPreference' }],
                });
            }
        } catch (err) {
            console.error("OTP verify error:", err?.response?.data || err.message);
            Alert.alert('Invalid OTP', err?.response?.data?.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        const res = await sendOTP(phone);
        if (res.data?.dev_otp) {
            setCurrentDevOtp(res.data.dev_otp);
        }
        setOtp(['', '', '', '']);
        setResendTimer(30);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={20} color={colors.primary} />
                    <Text style={styles.backText}>Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    4-digit OTP sent to{'\n'}
                    <Text style={styles.phone}>+91 {phone}</Text>
                </Text>

                {currentDevOtp && (
                    <View style={styles.devHint}>
                        <Ionicons name="bug-outline" size={16} color="#856404" />
                        <Text style={styles.devHintLabel}>DEV OTP:</Text>
                        <Text style={styles.devHintOtp}>{currentDevOtp}</Text>
                    </View>
                )}
                <View style={styles.otpContainer}>
                    <View style={styles.otpRow}>
                        {otp.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={ref => inputs.current[i] = ref}
                                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={digit}
                                onChangeText={val => handleChange(val, i)}
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === 'Backspace') handleBackspace(digit, i);
                                }}
                            />
                        ))}
                    </View>
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
    back: { paddingHorizontal: 20, paddingTop: 10 },
    backText: { fontSize: 16, color: colors.primary, marginLeft: 4, fontWeight: '600' },
    content: { paddingHorizontal: 28, paddingTop: 10 },
    title: { fontSize: 26, fontWeight: '800', color: colors.black, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textLight, lineHeight: 22, marginBottom: 36 },
    phone: { color: colors.black, fontWeight: '700' },
    otpContainer: { alignItems: 'center', marginBottom: 36 },
    otpRow: { flexDirection: 'row', gap: 12 },
    otpBox: {
        width: 52, height: 60, borderRadius: 14,
        borderWidth: 1.5, borderColor: colors.grayBorder,
        textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.black,
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
    devHint: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF3CD', borderRadius: 10,
        padding: 12, marginBottom: 20, gap: 8,
    },
    devHintLabel: { fontSize: 13, color: '#856404', fontWeight: '600' },
    devHintOtp: { fontSize: 20, fontWeight: '900', color: '#856404', letterSpacing: 4 },
});
