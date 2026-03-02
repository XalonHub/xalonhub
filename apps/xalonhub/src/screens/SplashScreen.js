import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '../context/OnboardingContext';
import api from '../services/api';

export default function SplashScreen({ navigation }) {
    const { formData, syncCloudDraftToLocal } = useOnboarding();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userRaw = await AsyncStorage.getItem('user');

                // Artificial delay for splash feel
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (token && userRaw) {
                    const user = JSON.parse(userRaw);

                    // 1. Fetch latest profile from cloud to ensure local state is fresh
                    try {
                        const res = await api.get(`/partners/me/${user.phone}`);
                        if (res.data) {
                            const freshData = await syncCloudDraftToLocal(res.data);

                            // 2. Routing logic using fresh data
                            if (freshData.isOnboarded) {
                                navigation.replace('Dashboard');
                                return;
                            }

                            if (freshData.lastScreen) {
                                // Reset stack based on progress to ensure back buttons work
                                let routes = [];
                                if (freshData.workPreference === 'salon') {
                                    routes.push({ name: 'WorkPreference' });
                                    if (freshData.lastScreen !== 'SalonCategory') routes.push({ name: 'SalonCategory' });
                                    if (freshData.lastScreen !== 'SalonBasicInfo') routes.push({ name: 'SalonBasicInfo' });
                                    routes.push({ name: freshData.lastScreen });
                                } else {
                                    routes.push({ name: 'WorkPreference' });
                                    routes.push({ name: freshData.lastScreen });
                                }
                                navigation.reset({ index: routes.length - 1, routes });
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('[SplashScreen] Could not fetch fresh profile, using local draft', e.message);
                    }

                    // Fallback to local logic if cloud fetch fails or no profile found
                    if (formData.isOnboarded) {
                        navigation.replace('Dashboard');
                    } else if (formData.lastScreen) {
                        let routes = [];
                        if (formData.workPreference === 'salon') {
                            routes.push({ name: 'WorkPreference' });
                            routes.push({ name: 'SalonCategory' });
                            routes.push({ name: formData.lastScreen });
                        } else {
                            routes.push({ name: 'WorkPreference' });
                            routes.push({ name: formData.lastScreen });
                        }
                        navigation.reset({ index: routes.length - 1, routes });
                    } else {
                        const isSalon = formData.workPreference === 'salon' || (user.role && user.role !== 'Freelancer');
                        const hasBasic = isSalon ? !!formData.salonInfo?.name : !!formData.personalInfo?.name;

                        if (isSalon) {
                            navigation.replace(!hasBasic ? 'SalonBasicInfo' : 'Dashboard');
                        } else {
                            navigation.replace(!hasBasic ? 'BasicInfo' : 'Dashboard');
                        }
                    }
                } else {
                    navigation.replace('Language');
                }
            } catch (error) {
                console.error("Auth check failed", error);
                navigation.replace('Language');
            }
        };

        checkAuth();
    }, [formData.lastScreen]);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={{ flex: 1 }} edges={[]}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="business" size={64} color={colors.white} style={styles.logoIcon} />
                        <Text style={styles.appName}>XalonHub</Text>
                        <Text style={styles.tagline}>Grow your salon business</Text>
                    </View>
                    <Text style={styles.footer}>Partner App · by XalonHub</Text>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    logoIcon: {
        marginBottom: 16,
    },
    appName: {
        fontSize: 38,
        fontWeight: '800',
        color: colors.white,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
    },
    footer: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 40,
    },
});
