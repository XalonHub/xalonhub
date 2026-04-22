import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, ScrollView, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOURS = [];
for (let h = 0; h < 24; h++) {
    const period = h < 12 ? 'AM' : 'PM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    HOURS.push(`${String(display).padStart(2, '0')}:00 ${period}`);
    HOURS.push(`${String(display).padStart(2, '0')}:30 ${period}`);
}

function TimePicker({ visible, title, value, onSelect, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={tm.overlay}>
                <View style={tm.sheet}>
                    <View style={tm.handle} />
                    <Text style={tm.title}>{title}</Text>
                    <ScrollView>
                        {HOURS.map((h) => (
                            <TouchableOpacity
                                key={h}
                                style={[tm.option, h === value && tm.optionActive]}
                                onPress={() => { onSelect(h); onClose(); }}
                            >
                                <Text style={[tm.optionText, h === value && tm.optionTextActive]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={tm.cancelBtn} onPress={onClose}>
                        <Text style={tm.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const tm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, maxHeight: '60%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
    option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionActive: { backgroundColor: colors.primary + '10' },
    optionText: { fontSize: 16, color: '#1E293B', textAlign: 'center' },
    optionTextActive: { color: colors.primary, fontWeight: '700' },
    cancelBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});

export default function WorkingHoursScreen({ navigation, route }) {
    const { formData, updateFormData, refreshProfile } = useOnboarding();

    useEffect(() => {
        refreshProfile();
    }, []);

    // Attempt to parse existing workingHours if available
    const existingHours = Array.isArray(formData.workingHours) ? formData.workingHours : [];
    const initialDays = existingHours.length > 0
        ? existingHours.filter(h => h.isOpen).map(h => h.dayName)
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const initialOpen = existingHours[0]?.openTime || '09:00 AM';
    const initialClose = existingHours[0]?.closeTime || '07:00 PM';
    const initial24 = existingHours.length > 0 && existingHours.every(h => h.openTime === '12:00 AM' && h.closeTime === '11:59 PM');

    const [selectedDays, setSelectedDays] = useState(initialDays);
    const [openTime, setOpenTime] = useState(initialOpen);
    const [closeTime, setCloseTime] = useState(initialClose);
    const [is24Hours, setIs24Hours] = useState(initial24);

    const [openPicker, setOpenPicker] = useState(null); // 'open' | 'close'
    const isEdit = route.params?.isEdit;

    // Sync with formData if it changes (hydration)
    useEffect(() => {
        if (formData.workingHours && formData.workingHours.length > 0) {
            const days = formData.workingHours.filter(h => h.isOpen).map(h => h.dayName);
            // Only sync if local state is still at default and cloud has data
            if (selectedDays.length === 5 && selectedDays.includes('Mon') && days.length > 0) {
                setSelectedDays(days);
                setOpenTime(formData.workingHours[0].openTime);
                setCloseTime(formData.workingHours[0].closeTime);
                setIs24Hours(formData.workingHours.every(h => h.openTime === '12:00 AM' && h.closeTime === '11:59 PM'));
            }
        }
    }, [formData]);

    const handleSave = async () => {
        const workingHours = DAYS.map(day => ({
            dayName: day,
            isOpen: selectedDays.includes(day),
            openTime: is24Hours ? '12:00 AM' : openTime,
            closeTime: is24Hours ? '11:59 PM' : closeTime,
        }));
        await updateFormData('workingHours', workingHours);
        if (isEdit) {
            navigation.goBack();
            return;
        }
        if (formData.workPreference === 'freelancer') {
            await updateFormData('lastScreen', 'BankDetails');
            navigation.navigate('BankDetails', { nextScreen: 'DocumentUpload' });
        } else {
            // This case might be legacy or for a different flow, but let's keep it consistent
            await updateFormData('lastScreen', 'BankDetails');
            navigation.navigate('BankDetails', { nextScreen: 'DocumentUpload' });
        }
    };

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
        else setSelectedDays([...selectedDays, day]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Working Hours</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Available Days</Text>
                    <Text style={styles.cardSubtitle}>Select exactly when you are available to take bookings.</Text>

                    <View style={styles.daysGrid}>
                        {DAYS.map(day => {
                            const isActive = selectedDays.includes(day);
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.dayBadge, isActive && styles.dayBadgeActive]}
                                    onPress={() => toggleDay(day)}
                                >
                                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.timeHeaderRow}>
                        <View>
                            <Text style={styles.cardTitle}>Daily Schedule</Text>
                            <Text style={styles.cardSubtitle}>Set your standard operating hours.</Text>
                        </View>
                    </View>

                    {!is24Hours && (
                        <View style={styles.timeInputsRow}>
                            <TouchableOpacity style={styles.timeInputContainer} onPress={() => setOpenPicker('open')}>
                                <Text style={styles.timeLabel}>Opening Time</Text>
                                <View style={styles.timeBox}>
                                    <Text style={styles.timeValue}>{openTime}</Text>
                                    <Ionicons name="time-outline" size={18} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.timeInputDivider} />
                            <TouchableOpacity style={styles.timeInputContainer} onPress={() => setOpenPicker('close')}>
                                <Text style={styles.timeLabel}>Closing Time</Text>
                                <View style={styles.timeBox}>
                                    <Text style={styles.timeValue}>{closeTime}</Text>
                                    <Ionicons name="moon-outline" size={18} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Available 24 Hours?</Text>
                        <Switch
                            value={is24Hours}
                            onValueChange={setIs24Hours}
                            trackColor={{ false: '#E2E8F0', true: colors.secondary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={handleSave}
                >
                    <Text style={styles.btnText}>{isEdit ? 'Update Schedule' : 'Save Schedule'}</Text>
                </TouchableOpacity>
            </View>

            <TimePicker
                visible={openPicker === 'open'}
                title="Opening Time"
                value={openTime}
                onSelect={setOpenTime}
                onClose={() => setOpenPicker(null)}
            />
            <TimePicker
                visible={openPicker === 'close'}
                title="Closing Time"
                value={closeTime}
                onSelect={setCloseTime}
                onClose={() => setOpenPicker(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 10,
    },
    backBtn: { padding: 8, marginRight: 8, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    backIcon: { fontSize: 24, color: '#1E293B', lineHeight: 24, fontWeight: '600' },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },

    content: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 40, gap: 24 },

    card: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20 },

    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dayBadge: {
        paddingVertical: 10, paddingHorizontal: 16,
        backgroundColor: '#F1F5F9', borderRadius: 30,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    dayBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    dayTextActive: { color: '#FFF' },

    timeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    timeInputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 24 },
    timeInputContainer: { flex: 1 },
    timeLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    timeBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16
    },
    timeValue: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    timeIcon: { fontSize: 18 },
    timeInputDivider: { width: 16 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12 },
    switchLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },

    footer: { padding: 24, paddingBottom: 32, backgroundColor: '#F8FAFC' },
    btn: { backgroundColor: colors.secondary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
