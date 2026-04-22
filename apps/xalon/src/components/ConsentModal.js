import React from 'react';
import {
    View, Text, StyleSheet, Modal,
    TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ConsentModal({ visible, onAccept, onDecline }) {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="notifications" size={32} color={colors.primary} />
                        </View>
                        <View style={[styles.miniCircle, { backgroundColor: '#22C55E' }]}>
                            <Ionicons name="logo-whatsapp" size={14} color="#FFF" />
                        </View>
                    </View>

                    <Text style={styles.title}>Stay in the loop!</Text>
                    <Text style={styles.description}>
                        Would you like to receive your booking confirmations and stylist arrival alerts on WhatsApp?
                    </Text>

                    <View style={styles.features}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                            <Text style={styles.featureText}>Instant Confirmations</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                            <Text style={styles.featureText}>Stylist Arrival Alerts</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={styles.primaryBtn} 
                            onPress={onAccept}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryBtnText}>Enable WhatsApp Updates</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.secondaryBtn} 
                            onPress={onDecline}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>
                        Manage this anytime in Profile > Settings.
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.8)',
        justifyContent: 'center', alignItems: 'center', padding: 24
    },
    card: {
        backgroundColor: '#FFF', borderRadius: 32, padding: 24, width: '100%',
        alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 12
    },
    iconContainer: { marginBottom: 20, position: 'relative' },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft,
        justifyContent: 'center', alignItems: 'center'
    },
    miniCircle: {
        position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#FFF'
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.black, marginBottom: 12, textAlign: 'center' },
    description: {
        fontSize: 15, color: colors.textLight, textAlign: 'center',
        lineHeight: 22, marginBottom: 24, paddingHorizontal: 10
    },
    features: { width: '100%', gap: 12, marginBottom: 28, paddingHorizontal: 20 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { fontSize: 14, color: colors.text, fontWeight: '500' },
    
    actions: { width: '100%', gap: 12 },
    primaryBtn: {
        backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 18,
        alignItems: 'center', width: '100%', shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secondaryBtn: {
        paddingVertical: 14, borderRadius: 18, alignItems: 'center', width: '100%'
    },
    secondaryBtnText: { color: colors.textLight, fontSize: 15, fontWeight: '600' },
    
    footerText: {
        marginTop: 18, fontSize: 11, color: colors.grayMedium, textAlign: 'center'
    }
});
