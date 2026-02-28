import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

export default function SalonRegistrationSuccessScreen({ navigation }) {
    const { clearOnboardingDraft, completeOnboarding } = useOnboarding();

    const handleGoToDashboard = async () => {
        try {
            await completeOnboarding();
            await clearOnboardingDraft();
            navigation.replace('Dashboard');
        } catch (e) {
            console.error('Failed to complete onboarding:', e);
            navigation.replace('Dashboard');
        }
    };
    // Subtle scale-in animation for the check circle
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Top coloured band */}
            <View style={styles.topBand}>
                <SafeAreaView edges={['top']}>
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={styles.thankYou}>Thank you</Text>
                        <Text style={styles.partnerLine}>
                            for registering as a{' '}
                            <Text style={styles.highlight}>Xalon Salon Partner</Text>
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Body */}
            <View style={styles.body}>
                {/* Animated check circle */}
                <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
                    <Ionicons name="checkmark" size={80} color="#FFF" />
                </Animated.View>

                <Text style={styles.congratsTitle}>Congratulations!</Text>
                <Text style={styles.congratsSub}>
                    Your salon onboarding is{'\n'}completed successfully.
                </Text>

                <Text style={styles.infoText}>
                    We are verifying your salon details.{'\n'}
                    We will notify you soon.
                </Text>

            </View>

            {/* Footer — navigation will be added based on your next screen */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleGoToDashboard}
                >
                    <Text style={styles.primaryBtnText}>Go To Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Top band
    topBand: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    thankYou: { fontSize: 26, fontWeight: '600', color: '#FFF', marginBottom: 6 },
    partnerLine: { fontSize: 16, color: '#FFF', textAlign: 'center' },
    highlight: { fontWeight: '800', color: '#FFD700' },

    // Body
    body: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 48,
        paddingHorizontal: 28,
    },
    checkCircle: {
        width: 116, height: 116, borderRadius: 58,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    checkIcon: { fontSize: 58, color: '#FFF', fontWeight: 'bold' },

    congratsTitle: {
        fontSize: 30, fontWeight: '800',
        color: colors.primary, marginBottom: 12,
    },
    congratsSub: {
        fontSize: 17, color: '#E91E8C', fontWeight: '500',
        textAlign: 'center', lineHeight: 26, marginBottom: 32,
    },
    infoText: {
        fontSize: 14, color: '#64748B',
        textAlign: 'center', lineHeight: 22, marginBottom: 32,
    },

    // Video card
    videoCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F8FAFC', borderRadius: 16,
        padding: 16, gap: 14, width: '100%',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    videoThumb: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    playIcon: { fontSize: 22, color: colors.primary },
    videoInfo: { flex: 1 },
    videoTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    videoDuration: { fontSize: 12, color: '#94A3B8', marginTop: 3 },

    // Footer
    footer: { padding: 24, paddingBottom: 36 },
    primaryBtn: {
        backgroundColor: '#1E293B',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
