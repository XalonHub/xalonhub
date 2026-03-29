import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, Dimensions,
    Platform, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';

const { width } = Dimensions.get('window');

export default function WorkPreferenceScreen({ navigation }) {
    const [saloonConfirmModal, setSaloonConfirmModal] = useState(false);
    const { updateFormData, logout } = useOnboarding();
    const handleBack = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout", style: "destructive", onPress: async () => {
                    await logout();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        ]);
    };

    const handleSalonSelect = () => {
        setSaloonConfirmModal(true);
    };

    const handleSalonSubmit = async () => {
        setSaloonConfirmModal(false);
        await updateFormData('workPreference', 'salon');
        await updateFormData('lastScreen', 'SalonCategory');
        navigation.navigate('SalonCategory');
    };

    const handleFreelancerSelect = async () => {
        await updateFormData('workPreference', 'freelancer');
        await updateFormData('lastScreen', 'ServiceAgreement');
        navigation.navigate('ServiceAgreement');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Background Decoration */}
            <View style={styles.bgDecorationTop} />
            <View style={styles.bgDecorationBottom} />

            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={28} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.titleContainer}>
                        <Text style={styles.greeting}>Welcome !</Text>
                        <Text style={styles.mainTitle}>Choose Work{'\n'}Preference</Text>
                        <Text style={styles.subtitle}>Select how you want to offer your services to customers.</Text>
                    </View>

                    <View style={styles.cardsContainer}>
                        {/* At Salon Setup Card */}
                        <TouchableOpacity
                            style={styles.cardWrapper}
                            onPress={handleSalonSelect}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[colors.white, '#FFF0F5']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.card}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.cardTextGroup}>
                                        <Text style={styles.cardSubtitle}>Established Location</Text>
                                        <Text style={styles.salonTitle}>At Salon{'\n'}Setup</Text>
                                    </View>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="business" size={42} color={colors.primary} />
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardFooterText}>I manage a physical salon</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* At Home Setup Card */}
                        <TouchableOpacity
                            style={styles.cardWrapper}
                            onPress={handleFreelancerSelect}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[colors.white, '#F3F0FF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.card}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.cardTextGroup}>
                                        <Text style={[styles.cardSubtitle, { color: colors.secondary }]}>At Home Setup</Text>
                                        <Text style={styles.homeTitle}>For{'\n'}Freelancer</Text>
                                    </View>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '15' }]}>
                                        <Ionicons name="home" size={42} color={colors.secondary} />
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.cardFooterText, { color: colors.secondary }]}>I provide freelance services</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Salon Confirmation Modal */}
            <Modal visible={saloonConfirmModal} transparent animationType="fade">
                <View style={modal.overlay}>
                    <View style={modal.sheet}>
                        <View style={modal.sheetIndicator} />

                        <View style={modal.modalIconContainer}>
                            <Ionicons name="business" size={32} color={colors.primary} />
                        </View>

                        <Text style={modal.title}>Confirm Selection</Text>
                        <Text style={modal.body}>
                            Are you sure you want to proceed as a Salon? Choose this option only if you have an established physical location.
                        </Text>

                        <View style={modal.actions}>
                            <TouchableOpacity style={modal.cancelBtn} onPress={() => setSaloonConfirmModal(false)}>
                                <Text style={modal.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={modal.submitBtn} onPress={handleSalonSubmit}>
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={modal.submitGradient}
                                >
                                    <Text style={modal.submitText}>Yes, Continue</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    bgDecorationTop: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.primary + '08',
    },
    bgDecorationBottom: {
        position: 'absolute',
        bottom: -50,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: colors.secondary + '08',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    helpBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    titleContainer: {
        marginTop: 20,
        marginBottom: 40,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    mainTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 42,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textLight,
        lineHeight: 22,
        paddingRight: 20,
    },
    cardsContainer: {
        gap: 20,
    },
    cardWrapper: {
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 5,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.white,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 20,
    },
    cardTextGroup: {
        flex: 1,
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    salonTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 34,
    },
    homeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 34,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    cardFooterText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
});

const modal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    sheetIndicator: {
        width: 40,
        height: 5,
        backgroundColor: colors.grayBorder,
        borderRadius: 3,
        marginBottom: 24,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        color: colors.textLight,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.grayLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textLight,
    },
    submitBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
});
