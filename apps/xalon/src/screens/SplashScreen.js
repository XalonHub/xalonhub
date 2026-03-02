import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/brand/logo_icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.appName}>Xalon</Text>
                <Text style={styles.tagline}>Book your perfect look</Text>
            </View>
            <Text style={styles.footer}>by XalonHub</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    logoImage: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.primary,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 16,
        color: colors.gray,
        marginTop: 4,
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    footer: {
        color: colors.grayMedium,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 40,
        letterSpacing: 1,
    },
});
