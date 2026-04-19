import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useOnboarding } from '../context/OnboardingContext';
import api from '../services/api';

export default function SplashScreen({ navigation }) {
    const { formData, syncCloudDraftToLocal } = useOnboarding();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                const userRaw = await SecureStore.getItemAsync('user');
                const language = await AsyncStorage.getItem('language');

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
                        console.log('[SplashScreen] Could not fetch fresh profile', e.message);

                        // If token is invalid (401) or user not found (404), logout
                        if (e.response && (e.response.status === 401 || e.response.status === 404)) {
                            console.log('[SplashScreen] Session invalid, clearing data');
                            await SecureStore.deleteItemAsync('token');
                            await SecureStore.deleteItemAsync('user');
                            navigation.replace('Language');
                            return;
                        }
                    }

                    // Fallback to local logic if cloud fetch fails (but not a 401/404)
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
                    // No session - Language is important on first launch
                    if (!language) {
                        navigation.replace('Language');
                    } else {
                        // Language exists but no session, go to Login
                        navigation.replace('Login');
                    }
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
                <SafeAreaView style={{ flex: 1, alignItems: 'center' }} edges={[]}>
                    <View style={styles.logoContainer}>
                        <View style={styles.brandPill}>
                            <Image
                                source={require('../assets/brand/logo_full.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.hubText}>HUB</Text>
                        </View>
                        <Text style={styles.tagline}>Grow your salon business</Text>
                    </View>
                    <Text style={styles.footer}>by XalonHub Inc</Text>
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
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 40,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    logoImage: {
        width: 200,
        height: 52,
    },
    hubText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
        marginLeft: 8,
        letterSpacing: 2,
        marginTop: 4, // Optical adjustment for baseline
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    footer: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 40,
        textAlign: 'center',
    },
});
