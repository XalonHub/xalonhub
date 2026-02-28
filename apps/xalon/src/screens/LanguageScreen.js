import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
];

export default function LanguageScreen({ navigation }) {
    const [selected, setSelected] = useState('en');

    const handleContinue = async () => {
        await AsyncStorage.setItem('language', selected);
        navigation.replace('MainTabs');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.content}>
                <Text style={styles.subtitle}>Select your preferred language to get started</Text>

                <View style={styles.list}>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[styles.langItem, selected === lang.code && styles.langItemSelected]}
                            onPress={() => setSelected(lang.code)}
                        >
                            <Text style={[styles.langText, selected === lang.code && styles.langTextSelected]}>
                                {lang.label}
                            </Text>
                            <View style={[styles.radio, selected === lang.code && styles.radioSelected]}>
                                {selected === lang.code && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
                <Text style={styles.changeNote}>This can be changed anytime from settings</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
    subtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: 32 },
    list: { gap: 12 },
    langItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 18, paddingHorizontal: 20,
        borderWidth: 1, borderColor: colors.grayBorder, borderRadius: 12,
        backgroundColor: colors.white,
    },
    langItemSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    langText: { fontSize: 16, color: colors.text },
    langTextSelected: { color: colors.primary, fontWeight: '600' },
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: colors.grayBorder,
        justifyContent: 'center', alignItems: 'center',
    },
    radioSelected: { borderColor: colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    continueBtn: {
        backgroundColor: colors.grayLight, borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 40,
    },
    continueBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
    changeNote: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 12 },
});
