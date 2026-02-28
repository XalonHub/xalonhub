import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

export default function RegistrationSuccessScreen({ navigation }) {
    const { clearOnboardingDraft, completeOnboarding } = useOnboarding();

    const handleGoToDashboard = async () => {
        try {
            await completeOnboarding();
            await clearOnboardingDraft();
            navigation.replace('Dashboard');
        } catch (e) {
            console.error('Failed to complete onboarding:', e);
            navigation.replace('Dashboard'); // Fallback to at least get them to dashboard
        }
    };
    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <View style={styles.topSection}>
                <SafeAreaView edges={['top']}>
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={styles.thankYouText}>Thank you</Text>
                        <Text style={styles.partnerText}>for becoming a <Text style={styles.highlightText}>XalonHub Partner</Text></Text>
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.content}>
                <View style={styles.checkCircleLarge}>
                    <Ionicons name="checkmark" size={80} color="#FFF" />
                </View>

                <Text style={styles.congratsTitle}>Congratulations!</Text>
                <Text style={styles.congratsSubtitle}>
                    Your initial onboarding is{'\n'}completed.
                </Text>

                <Text style={styles.infoText}>
                    We are verifying your application.{'\n'}We will notify you soon.
                </Text>

            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={handleGoToDashboard}
                >
                    <Text style={styles.btnText}>Go To Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    topSection: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 20,
        alignItems: 'center', justifyContent: 'center',
        borderBottomLeftRadius: 30, borderBottomRightRadius: 30
    },
    thankYouText: { fontSize: 24, color: '#FFF', fontWeight: '500', marginBottom: 4 },
    partnerText: { fontSize: 18, color: '#FFF' },
    highlightText: { color: '#FFD700', fontWeight: 'bold' }, // Yellow accent

    content: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },

    checkCircleLarge: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: colors.secondary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 40,
        shadowColor: colors.secondary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    checkIcon: { fontSize: 60, color: '#FFF', fontWeight: 'bold' },

    congratsTitle: { fontSize: 28, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
    congratsSubtitle: { fontSize: 18, color: '#E91E8C', textAlign: 'center', lineHeight: 26, fontWeight: '500', marginBottom: 40 },

    infoText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 40 },

    videoPlaceholder: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    videoIcon: { fontSize: 24 },
    videoText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },

    footer: { padding: 24, paddingBottom: 32 },
    btn: { backgroundColor: '#1E293B', borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
