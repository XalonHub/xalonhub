import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { height } = Dimensions.get('window');

export default function AddNewClientScreen({ navigation }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [inviteModalVisible, setInviteModalVisible] = useState(false);

    const handleAdd = () => {
        // Return to AddBooking with the customer name
        navigation.navigate('AddBooking', { customerName: name || 'Guest User' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Client</Text>
            </View>

            <View style={styles.content}>

                {/* Inputs */}
                <View style={styles.inputContainer}>
                    <Text style={styles.floatingLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#94A3B8"
                    />
                    {name.length > 0 && (
                        <TouchableOpacity style={styles.clearIcon} onPress={() => setName('')}>
                            <Ionicons name="close-circle" size={16} color="#64748B" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.floatingLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#94A3B8"
                    />
                    {phone.length > 0 && (
                        <TouchableOpacity style={styles.clearIcon} onPress={() => setPhone('')}>
                            <Ionicons name="close-circle" size={16} color="#64748B" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.floatingLabel}>Email Address (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#94A3B8"
                    />
                    {email.length > 0 && (
                        <TouchableOpacity style={styles.clearIcon} onPress={() => setEmail('')}>
                            <Ionicons name="close-circle" size={16} color="#64748B" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomFooter}>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteModalVisible(true)}>
                    <Text style={styles.inviteBtnText}>Add & Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* Invite Modal Bottom Sheet */}
            <Modal visible={inviteModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Please ensure invite message</Text>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>
                                'Hi {name || 'User'} ji,{"\n"}
                                <Text style={styles.highlightText}>Sundhan Beauty Parlour</Text> just got on the XalonHub App.
                                Download it NOW from https://ref.xalonhub.care/tX4DT9mZw9xE3cMS6 to book your favorite services and earn on your next service booking.{"\n\n"}
                                Thank you{"\n"}
                                <Text style={styles.highlightText}>Sundhan Beauty Parlour</Text>'
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.sendBtn} onPress={() => {
                            setInviteModalVisible(false);
                            handleAdd();
                        }}>
                            <Text style={styles.sendBtnText}>Send</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setInviteModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
        backgroundColor: '#FFF'
    },
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '500', color: '#000' },
    supportBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary,
        justifyContent: 'center', alignItems: 'center'
    },

    content: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },

    // Inputs
    inputContainer: {
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8,
        paddingHorizontal: 16, height: 56, marginBottom: 24, justifyContent: 'center'
    },
    floatingLabel: {
        position: 'absolute', top: -10, left: 12, backgroundColor: '#FFF',
        paddingHorizontal: 4, fontSize: 13, color: '#64748B'
    },
    input: { fontSize: 16, color: '#1E293B', paddingRight: 30, height: '100%' },
    clearIcon: { position: 'absolute', right: 16 },

    // Footer Buttons
    bottomFooter: { flexDirection: 'row', padding: 20, gap: 12 },
    inviteBtn: { flex: 1, backgroundColor: '#000', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    inviteBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    addBtn: { flex: 1, backgroundColor: '#000', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 18, color: '#000', fontWeight: '500' },

    // Message Box inside Modal
    messageBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 24 },
    messageText: { fontSize: 14, color: '#1E293B', lineHeight: 22 },
    highlightText: { color: '#D6336C' }, // Matching the dark pink in the screenshot

    // Modal Buttons
    sendBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
    cancelBtn: { backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
    cancelBtnText: { color: '#000', fontSize: 16, fontWeight: '500' }
});
