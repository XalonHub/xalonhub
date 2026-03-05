import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    View, Text, SectionList, TouchableOpacity, StyleSheet,
    ActivityIndicator, StatusBar, Animated, ScrollView,
    Modal, Image, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ServiceListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { category, gender, serviceName } = route.params || {};
    const { draft, toggleService, totalDuration, totalPrice } = useBooking();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [footerAnim] = useState(new Animated.Value(0));
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedServiceForDetail, setSelectedServiceForDetail] = useState(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabLayouts, setTabLayouts] = useState({});
    const sectionListRef = useRef(null);
    const tabsScrollViewRef = useRef(null);

    // Mock data helper for service details
    const getServiceExtraInfo = (item) => {
        const category = item.category?.toLowerCase() || '';
        if (category.includes('hair')) {
            return {
                steps: [
                    { title: 'Consultation', desc: 'Expert analysis of hair type and scalp.' },
                    { title: 'Cleansing', desc: 'Premium wash with moisturizing shampoo.' },
                    { title: 'Service Execution', desc: 'Professional cutting/styling as requested.' },
                    { title: 'Finishing', desc: 'Serum and final touch-ups for a perfect look.' }
                ],
                faqs: [
                    { q: 'Is a wash included?', a: 'Yes, a premium hair wash is included in this service.' },
                    { q: 'How long does it take?', a: `Approximately ${item.duration} minutes depending on hair length.` }
                ]
            };
        }
        return {
            steps: [
                { title: 'Preparation', desc: 'Sanitizing and setting up premium products.' },
                { title: 'Execution', desc: 'Expert application and service delivery.' },
                { title: 'Cleanup', desc: 'Post-service cleaning and final checks.' }
            ],
            faqs: [
                { q: 'What products are used?', a: 'We use high-quality, dermatologically tested premium brands.' },
                { q: 'Is it safe?', a: 'All our professionals follow strict hygiene and safety protocols.' }
            ]
        };
    };

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const isGenderFilter = category === 'Men' || category === 'Women';
                const apiCategory = isGenderFilter ? null : category;
                const apiGender = isGenderFilter ? (category === 'Men' ? 'Male' : 'Female') : gender;

                const data = await api.getServiceCatalog(apiCategory, apiGender);
                let fetched = Array.isArray(data) ? data : [];

                if (serviceName) {
                    fetched = fetched.filter(s =>
                        s.name.toLowerCase().includes(serviceName.toLowerCase())
                    );
                }

                setServices(fetched);
            } catch (err) {
                console.error('[ServiceListScreen] Load Error:', err);
                setError('Failed to load services. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [category, gender, serviceName]);

    useEffect(() => {
        if (draft.selectedServices.length > 0) {
            Animated.spring(footerAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        } else {
            Animated.spring(footerAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    }, [draft.selectedServices.length]);

    const { sections, availableCategories } = useMemo(() => {
        const groups = {};
        const cats = new Set();

        const filtered = services.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.forEach(s => {
            const cat = s.category || 'General';
            cats.add(cat);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(s);
        });

        const sortedCats = Object.keys(groups).sort();
        const sectionData = sortedCats.map(cat => ({
            title: cat,
            data: groups[cat]
        }));

        return {
            sections: sectionData,
            availableCategories: Array.from(cats).sort((a, b) => a.localeCompare(b))
        };
    }, [services, searchQuery]);

    useEffect(() => {
        if (!selectedCategory && availableCategories.length > 0) {
            setSelectedCategory(availableCategories[0]);
        }
    }, [availableCategories, selectedCategory]);

    const scrollToTab = (cat) => {
        const layout = tabLayouts[cat];
        if (layout && tabsScrollViewRef.current) {
            tabsScrollViewRef.current.scrollTo({
                x: Math.max(0, layout.x - 140),
                animated: true
            });
        }
    };

    const selectedIds = new Set(draft.selectedServices.map((s) => s.id));
    const [isManualScroll, setIsManualScroll] = useState(false);

    // Track tab scrolling to keep active tab centered
    const handleTabPress = (cat, idx) => {
        setIsManualScroll(true);
        setSelectedCategory(cat);
        scrollToTab(cat);

        try {
            if (sections.length > 0) {
                const sIdx = sections.findIndex(s => s.title === cat);
                if (sIdx !== -1) {
                    sectionListRef.current?.scrollToLocation({
                        sectionIndex: sIdx,
                        itemIndex: 0,
                        animated: true,
                        viewOffset: 0,
                        viewPosition: 0
                    });
                }
            }
        } catch (error) {
            console.warn('[handleTabPress] Scroll failed:', error);
            // Fallback: try without animation
            try {
                const sIdx = sections.findIndex(s => s.title === cat);
                sectionListRef.current?.scrollToLocation({
                    sectionIndex: sIdx,
                    itemIndex: 0,
                    animated: false,
                    viewOffset: 0,
                    viewPosition: 0
                });
            } catch (inner) { }
        }

        // Reset manual scroll flag after animation completes
        setTimeout(() => setIsManualScroll(false), 2000);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (!isManualScroll && viewableItems.length > 0) {
            const firstVisible = viewableItems[0];
            if (firstVisible.section) {
                const title = firstVisible.section.title;
                setSelectedCategory(title);
                scrollToTab(title);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 40
    }).current;

    const handleToggle = (item) => {
        toggleService({
            id: item.id,
            name: item.name,
            price: item.specialPrice || item.defaultPrice,
            duration: item.duration,
            gender: item.gender,
        });
    };

    const handleContinue = () => {
        if (draft.selectedServices.length === 0) return;
        navigation.navigate('BookingDateTime');
    };

    const handleOpenDetail = (item) => {
        setSelectedServiceForDetail(item);
        setDetailModalVisible(true);
    };

    const renderItem = ({ item, index }) => {
        const selected = selectedIds.has(item.id);
        const hasSpecial = !!item.specialPrice && item.specialPrice < item.defaultPrice;
        const mainPrice = hasSpecial ? item.specialPrice : item.defaultPrice;

        return (
            <TouchableOpacity
                onPress={() => handleOpenDetail(item)}
                activeOpacity={0.9}
                style={styles.cardContainer}
            >
                <View style={[styles.card, selected && styles.cardSelected]}>
                    <View style={styles.cardContent}>
                        <View style={styles.cardLeftThum}>
                            <View style={styles.thumbnailPlaceholder}>
                                <MaterialIcons name="image" size={32} color={colors.grayLight} />
                            </View>
                        </View>
                        <View style={styles.cardRightInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.serviceName}>{item.name}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <MaterialIcons name="schedule" size={14} color={colors.gray} />
                                <Text style={styles.metaText}>{item.duration} min</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.price}>₹{mainPrice}</Text>
                                {hasSpecial && (
                                    <Text style={styles.priceOriginal}>₹{item.defaultPrice}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[styles.miniAddBtn, selected && styles.miniAddBtnActive]}
                                onPress={() => handleToggle(item)}
                            >
                                <MaterialIcons
                                    name={selected ? "remove-circle" : "add-circle"}
                                    size={20}
                                    color={selected ? colors.error : colors.primary}
                                />
                                <Text style={[styles.miniAddText, selected && styles.miniAddTextActive]}>
                                    {selected ? "REMOVE" : "ADD"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
                </TouchableOpacity>
                {isSearchActive ? (
                    <TextInput
                        autoFocus
                        style={styles.headerSearchInput}
                        placeholder="Search services..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.gray}
                    />
                ) : (
                    <Text style={styles.headerTitle}>{category || 'Services'}</Text>
                )}
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => {
                        setIsSearchActive(!isSearchActive);
                        if (isSearchActive) setSearchQuery('');
                    }}
                >
                    <MaterialIcons name={isSearchActive ? "close" : "search"} size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Premium info moved above tabs */}
            {!loading && !error && (
                <View style={styles.modeWrapper}>
                    <LinearGradient
                        colors={draft.serviceMode === 'AtHome' ? ['#F5F3FF', '#EDE9FE'] : ['#F3F4F6', '#E5E7EB']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.modeBar}
                    >
                        <View style={styles.modeIconCircle}>
                            <MaterialIcons
                                name={draft.serviceMode === 'AtHome' ? 'bolt' : 'storefront'}
                                size={16}
                                color={draft.serviceMode === 'AtHome' ? colors.primary : colors.gray}
                            />
                        </View>
                        <View>
                            <Text style={styles.modeLabel}>
                                {draft.serviceMode === 'AtHome' ? 'Premium At-Home Service' : 'Premium Salon Visit'}
                            </Text>
                            <Text style={styles.modeSubtext}>
                                {draft.serviceMode === 'AtHome' ? 'Top-rated expert arrives at your doorstep' : 'Visit our verified partner salon'}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            )}

            {!loading && !error && availableCategories.length > 1 && (
                <View style={styles.tabsWrapper}>
                    <ScrollView
                        ref={tabsScrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContainer}
                    >
                        {availableCategories.map((cat, idx) => {
                            const active = selectedCategory === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.tab, active && styles.tabActive]}
                                    onPress={() => handleTabPress(cat, idx)}
                                    onLayout={(e) => {
                                        const { x, width } = e.nativeEvent.layout;
                                        setTabLayouts(prev => ({ ...prev, [cat]: { x, width } }));
                                    }}
                                >
                                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.loadingText}>Fetching curated services...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('ServiceList', { category, gender })}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SectionList
                    ref={sectionListRef}
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    stickySectionHeadersEnabled={true}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="sentiment-dissatisfied" size={64} color={colors.grayMedium} />
                            <Text style={styles.emptyTitle}>No services today</Text>
                            <Text style={styles.emptyText}>We couldn't find any services in this category right now.</Text>
                        </View>
                    }
                />
            )}

            {/* Service Details Modal */}
            <Modal
                visible={detailModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedServiceForDetail && (
                                <>
                                    <View style={styles.modalHero}>
                                        <View style={styles.heroPlaceholder}>
                                            <MaterialIcons name="image" size={64} color={colors.grayLight} />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.modalCloseBtn}
                                            onPress={() => setDetailModalVisible(false)}
                                        >
                                            <MaterialIcons name="close" size={24} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        <Text style={styles.modalTitle}>{selectedServiceForDetail.name}</Text>
                                        <View style={styles.modalMeta}>
                                            <View style={styles.modalPriceContainer}>
                                                <Text style={styles.modalPrice}>
                                                    ₹{selectedServiceForDetail.specialPrice || selectedServiceForDetail.defaultPrice}
                                                </Text>
                                                {!!selectedServiceForDetail.specialPrice && (
                                                    <Text style={styles.modalPriceOriginal}>
                                                        ₹{selectedServiceForDetail.defaultPrice}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.dot} />
                                            <Text style={styles.modalDuration}>{selectedServiceForDetail.duration} minutes</Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <Text style={styles.modalSectionTitle}>Description</Text>
                                        <Text style={styles.modalDesc}>
                                            {selectedServiceForDetail.description ||
                                                "Experience our premium service delivered by certified professionals using high-quality products. We ensure a safe and relaxing environment for your grooming needs."}
                                        </Text>

                                        <Text style={styles.modalSectionTitle}>How it works</Text>
                                        {getServiceExtraInfo(selectedServiceForDetail).steps.map((step, i) => (
                                            <View key={i} style={styles.stepItem}>
                                                <View style={styles.stepNumber}>
                                                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                                                </View>
                                                <View style={styles.stepContent}>
                                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                                    <Text style={styles.stepDesc}>{step.desc}</Text>
                                                </View>
                                            </View>
                                        ))}

                                        <Text style={styles.modalSectionTitle}>Frequently Asked Questions</Text>
                                        {getServiceExtraInfo(selectedServiceForDetail).faqs.map((faq, i) => (
                                            <View key={i} style={styles.faqItem}>
                                                <Text style={styles.faqQ}>Q: {faq.q}</Text>
                                                <Text style={styles.faqA}>{faq.a}</Text>
                                            </View>
                                        ))}

                                        <View style={{ height: 40 }} />
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {selectedServiceForDetail && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.modalAddBtn}
                                    onPress={() => {
                                        handleToggle(selectedServiceForDetail);
                                        setDetailModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalAddBtnText}>
                                        {selectedIds.has(selectedServiceForDetail.id) ? "REMOVE FROM BOOKING" : "ADD TO BOOKING"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Animated.View style={[
                styles.footerContainer,
                { transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [150, 0] }) }] }
            ]}>
                <LinearGradient colors={['rgba(255,255,255,0.9)', colors.white]} style={styles.footerGradient}>
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerCount}>
                                {draft.selectedServices.length} {draft.selectedServices.length > 1 ? 'Services' : 'Service'} • {totalDuration} min
                            </Text>
                            <Text style={styles.footerTotal}>₹{totalPrice}</Text>
                        </View>
                        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                            <LinearGradient
                                colors={colors.primaryGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.continueGradient}
                            >
                                <Text style={styles.continueBtnText}>Continue</Text>
                                <MaterialIcons name="chevron-right" size={20} color={colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.white },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    searchBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSearchInput: { flex: 1, height: 40, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: 16, fontSize: 16, color: colors.text, marginHorizontal: 10 },

    tabsWrapper: { paddingBottom: 12 },
    tabsContainer: { paddingHorizontal: 20, gap: 10 },
    tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.grayBorder },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '700', color: colors.gray },
    tabTextActive: { color: colors.white },

    modeWrapper: { paddingHorizontal: 20, marginBottom: 12 },
    modeBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: colors.grayBorder },
    modeIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    modeLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    modeSubtext: { fontSize: 11, color: colors.gray, marginTop: 1 },

    sectionHeader: { backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 12 },
    sectionHeaderText: { fontSize: 14, fontWeight: '900', color: colors.gray, textTransform: 'uppercase', letterSpacing: 1.2 },

    list: { paddingHorizontal: 20, paddingBottom: 140 },
    cardContainer: { marginBottom: 16 },
    card: { backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.grayBorder, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardSelected: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: '#F9F8FF' },
    cardContent: { padding: 12, flexDirection: 'row', gap: 12 },

    cardLeftThum: { width: 100, height: 100, borderRadius: 12, backgroundColor: colors.background, overflow: 'hidden' },
    thumbnailPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    cardRightInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    serviceName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: colors.gray, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.grayMedium },
    fulfillmentText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    price: { fontSize: 17, fontWeight: '800', color: colors.text },
    priceOriginal: { fontSize: 13, color: colors.gray, textDecorationLine: 'line-through' },

    miniAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', bottom: 0, right: 0, padding: 4 },
    miniAddBtnActive: { opacity: 0.8 },
    miniAddText: { fontSize: 11, fontWeight: '800', color: colors.primary },
    miniAddTextActive: { color: colors.error },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14, color: colors.gray, fontWeight: '500' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorText: { color: colors.gray, fontSize: 15, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary },
    retryText: { color: colors.white, fontWeight: '700' },
    emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
    emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.white, height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    modalHero: { width: '100%', height: 250, backgroundColor: colors.background },
    heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalCloseBtn: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },

    modalBody: { padding: 24 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
    modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    modalPrice: { fontSize: 20, fontWeight: '800', color: colors.primary },
    modalPriceOriginal: { fontSize: 14, color: colors.gray, textDecorationLine: 'line-through', marginLeft: 6, fontWeight: '500' },
    modalPriceContainer: { flexDirection: 'row', alignItems: 'baseline' },
    modalDuration: { fontSize: 15, color: colors.gray, fontWeight: '500' },

    divider: { height: 1, backgroundColor: colors.grayBorder, marginVertical: 20 },
    modalSectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16, marginTop: 10 },
    modalDesc: { fontSize: 15, color: colors.grayDark, lineHeight: 24, marginBottom: 24 },

    stepItem: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { fontSize: 14, fontWeight: '800', color: colors.primary },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    stepDesc: { fontSize: 14, color: colors.gray, lineHeight: 20 },

    faqItem: { marginBottom: 20, backgroundColor: colors.background, padding: 16, borderRadius: 12 },
    faqQ: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    faqA: { fontSize: 14, color: colors.gray, lineHeight: 20 },

    modalFooter: { padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.grayBorder, backgroundColor: colors.white },
    modalAddBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    modalAddBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 1 },

    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
    footerGradient: { padding: 20, paddingBottom: 34, borderTopLeftRadius: 36, borderTopRightRadius: 36, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.15, shadowRadius: 20 },
    footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerCount: { fontSize: 13, color: colors.gray, fontWeight: '600' },
    footerTotal: { fontSize: 26, color: colors.text, fontWeight: '900', letterSpacing: -1 },
    continueBtn: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10 },
    continueGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 16 },
    continueBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
