import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const lang = await AsyncStorage.getItem('language');
                if (lang) {
                    // Language already chosen — skip language screen
                    navigation.replace('MainTabs');
                } else {
                    navigation.replace('Language');
                }
            } catch {
                navigation.replace('Language');
            }
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.logoContainer}>
                <MaterialIcons name="content-cut" size={80} color={colors.white} style={styles.logo} />
                <Text style={styles.appName}>Xalon</Text>
                <Text style={styles.tagline}>Book your perfect look</Text>
            </View>
            <Text style={styles.footer}>by XalonHub</Text>
        </LinearGradient>
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
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    appName: {
        fontSize: 42,
        fontWeight: '800',
        color: colors.white,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    footer: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 40,
    },
});
