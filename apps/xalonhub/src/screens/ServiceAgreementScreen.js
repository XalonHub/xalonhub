import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

export default function ServiceAgreementScreen({ navigation }) {
    const { updateFormData } = useOnboarding();
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        try {
            setLoading(true);
            await updateFormData('contractAccepted', true);
            navigation.navigate('BasicInfo');
        } catch (error) {
            console.error('Failed to accept agreement', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Agreement</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.docTitle}>SERVICE AGREEMENT</Text>
                <Text style={styles.docSubtitle}>XalonHub Partner At Home Services</Text>

                <Text style={styles.docText}>
                    This Service Agreement (the "Agreement") is entered into between XalonHub (OPC) Private Limited ("XalonHub") and the Salon ("Service Provider").
                </Text>

                <Text style={styles.sectionTitle}>1. PURPOSE</Text>
                <Text style={styles.docText}>
                    The purpose of this Agreement is to establish the terms and conditions under which the Service Provider will offer salon services at customers' homes through the XalonHub platform.
                </Text>

                <Text style={styles.sectionTitle}>2. QUALIFYING CRITERIA</Text>
                <Text style={styles.docText}>
                    The Service Provider must meet and maintain the following criteria:
                </Text>
                <Text style={styles.listItem}>1. Maintain a minimum of 4 chairs and 2 staff members at their facility.</Text>
                <Text style={styles.listItem}>2. Dedicate at least 1 staff member for at-home services.</Text>
                <Text style={styles.listItem}>3. Possess all necessary tools and products for service delivery.</Text>
                <Text style={styles.listItem}>4. XalonHub will provide T-shirts and service bags to the Service Provider.</Text>

                <Text style={styles.sectionTitle}>3. SERVICE PROVIDER OBLIGATIONS</Text>
                <Text style={styles.docText}>3.1. Staffing and Availability</Text>
                <Text style={styles.listItem}>1. Assign a dedicated freelancer approved by XalonHub.</Text>
                <Text style={styles.listItem}>2. Ensure freelancer availability for at least 6 days per week.</Text>
                <Text style={styles.listItem}>... (mocked remaining text for brevity)</Text>

                <Text style={styles.sectionTitle}>7. DIGITAL ACCEPTANCE</Text>
                <Text style={styles.docText}>
                    This Agreement is executed electronically. By accepting this Agreement in the XalonHub Partner APP, the Service Provider acknowledges that they:
                </Text>
                <Text style={styles.listItem}>1. Have read and understood all terms and conditions of this Agreement.</Text>
                <Text style={styles.listItem}>2. Agree to be bound by all provisions contained herein.</Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={handleAccept}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Accept</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: colors.grayBorder
    },
    backBtn: { padding: 4, marginRight: 8 },
    backIcon: { fontSize: 32, color: colors.black, lineHeight: 32, marginTop: -4 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    docTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
    docSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    docText: { fontSize: 12, lineHeight: 18, color: colors.text, marginBottom: 8 },
    listItem: { fontSize: 12, lineHeight: 18, color: colors.text, marginLeft: 8, marginBottom: 4 },
    footer: { padding: 20 },
    btn: { backgroundColor: colors.black, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '600' }
});
