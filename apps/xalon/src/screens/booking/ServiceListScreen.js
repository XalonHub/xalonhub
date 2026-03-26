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
import { getCategoryMetadata } from '../../constants/CategoryConstants';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ServiceListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { category, gender, serviceName } = route.params || {};
    const { draft, toggleService, totalDuration, subtotal, totalPrice } = useBooking();

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

    // No need for mock data anymore

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                // We now load the FULL catalog for the gender/mode so that tabs/scrolling work locally.
                const isGenderFilter = category === 'Men' || category === 'Women';
                const apiGender = isGenderFilter ? (category === 'Men' ? 'Male' : 'Female') : gender;

                // Pass partnerType so the backend resolves role-specific pricing.
                const partnerType = draft.serviceMode === 'AtHome' ? 'Freelancer' : null;

                // We send category=null to get the full catalog for the gender.
                const data = await api.getServiceCatalog(null, apiGender, partnerType);
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
    }, [gender, serviceName, draft.serviceMode, category === 'Men', category === 'Women']);

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

    const { sections, availableCategories, categoryImages } = useMemo(() => {
        const groups = {};
        const cats = new Set();
        const catImgs = {};

        const filtered = services.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.forEach(s => {
            const cat = s.category || 'General';
            cats.add(cat);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(s);
            
            // Capture a representative image for the category from its services
            if (!catImgs[cat] && s.image) {
                catImgs[cat] = s.image;
            }
        });

        const sortedCats = Object.keys(groups).sort();
        const sectionData = sortedCats.map(cat => ({
            title: cat,
            data: groups[cat]
        }));

        return {
            sections: sectionData,
            availableCategories: Array.from(cats).sort((a, b) => a.localeCompare(b)),
            categoryImages: catImgs
        };
    }, [services, searchQuery]);

    useEffect(() => {
        if (!selectedCategory && availableCategories.length > 0) {
            // If navigated with a category name, use that, otherwise first available
            const initialCat = (category && category !== 'Men' && category !== 'Women')
                ? category
                : availableCategories[0];

            setSelectedCategory(initialCat);

            // Allow time for the list to render before scrolling
            if (initialCat) {
                setTimeout(() => {
                    handleTabPress(initialCat, availableCategories.indexOf(initialCat));
                }, 500);
            }
        }
    }, [availableCategories, selectedCategory, category]);

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

        const scrollOptions = {
            sectionIndex: sections.findIndex(s => s.title === cat),
            itemIndex: 0,
            animated: true,
            viewOffset: 0,
            viewPosition: 0
        };

        if (scrollOptions.sectionIndex === -1) {
            setIsManualScroll(false);
            return;
        }

        try {
            sectionListRef.current?.scrollToLocation(scrollOptions);
        } catch (error) {
            console.warn('[handleTabPress] Scroll attempt 1 failed:', error);
            // Fallback: try with a small delay for layout calculation
            setTimeout(() => {
                try {
                    sectionListRef.current?.scrollToLocation({
                        ...scrollOptions,
                        animated: false
                    });
                } catch (inner) {
                    console.error('[handleTabPress] Scroll failed completely:', inner);
                }
            }, 100);
        }

        // Reset manual scroll flag after animation completes
        // Using a longer timeout to ensure native scroll completes
        setTimeout(() => setIsManualScroll(false), 800);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (!isManualScroll && viewableItems.length > 0) {
            // Find the most prominent visible section
            const visibleSections = viewableItems
                .filter(item => item.section)
                .map(item => item.section.title);

            if (visibleSections.length > 0) {
                const dominantSection = visibleSections[0];
                if (dominantSection !== selectedCategory) {
                    setSelectedCategory(dominantSection);
                    scrollToTab(dominantSection);
                }
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 40
    }).current;

    const handleToggle = (item) => {
        // Use pre-resolved effectivePrice/effectiveSpecialPrice from backend.
        // Special price (if > 0) is the final price.
        const price = (item.effectiveSpecialPrice && item.effectiveSpecialPrice > 0)
            ? item.effectiveSpecialPrice
            : (item.effectivePrice ?? item.defaultPrice);

        toggleService({
            id: item.id,
            name: item.name,
            price,
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
        const displayPrice = item.effectivePrice ?? item.defaultPrice;
        const special = (item.effectiveSpecialPrice && item.effectiveSpecialPrice > 0) ? item.effectiveSpecialPrice : null;
        const hasSpecial = !!special && special < displayPrice;
        const mainPrice = special || displayPrice;

        return (
            <TouchableOpacity
                onPress={() => handleOpenDetail(item)}
                activeOpacity={0.94}
                style={styles.cardContainer}
            >
                <View style={[styles.card, selected && styles.cardSelected]}>
                    <View style={styles.cardContent}>
                        <View style={styles.cardLeftThum}>
                            <View style={styles.thumbnailPlaceholder}>
                                <MaterialIcons name="image" size={32} color={colors.graySoft} />
                            </View>
                        </View>
                        <View style={styles.cardRightInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.serviceName}>{item.name}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <MaterialIcons name="schedule" size={14} color={colors.gray} />
                                <Text style={styles.metaText}>{item.duration} min</Text>
                                {selected && (
                                    <View style={styles.selectedPill}>
                                        <MaterialIcons name="check" size={10} color={colors.white} />
                                        <Text style={styles.selectedPillText}>SELECTED</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.price}>₹{mainPrice}</Text>
                                {hasSpecial && (
                                    <Text style={styles.priceOriginal}>₹{displayPrice}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[styles.miniAddBtn, selected && styles.miniAddBtnActive]}
                                onPress={() => handleToggle(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={selected ? "remove-circle" : "add-circle"}
                                    size={22}
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
            <View style={styles.headerIndicator} />
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <View style={styles.headerCount}>
                <Text style={styles.headerCountText}>
                    {sections.find(s => s.title === title)?.data.length || 0}
                </Text>
            </View>
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
                            const metadata = getCategoryMetadata(cat);
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
                                    <View style={styles.tabImageWrapper}>
                                        {categoryImages[cat] ? (
                                            <Image source={{ uri: categoryImages[cat] }} style={styles.tabImage} />
                                        ) : (
                                            <View style={styles.tabFallback}>
                                                <Text style={styles.tabFallbackText}>{cat[0].toUpperCase()}</Text>
                                            </View>
                                        )}
                                        {active && <View style={styles.tabImgOverlay} />}
                                    </View>
                                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{metadata.label}</Text>
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
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    onScrollToIndexFailed={(info) => {
                        console.warn('Scroll failed, retrying...', info);
                        sectionListRef.current?.scrollToLocation({
                            sectionIndex: info.index,
                            itemIndex: 0,
                            animated: false
                        });
                    }}
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
                                                    ₹{(selectedServiceForDetail.effectiveSpecialPrice && selectedServiceForDetail.effectiveSpecialPrice > 0)
                                                        ? selectedServiceForDetail.effectiveSpecialPrice
                                                        : (selectedServiceForDetail.effectivePrice ?? selectedServiceForDetail.defaultPrice)}
                                                </Text>
                                                {!!(selectedServiceForDetail.effectiveSpecialPrice && selectedServiceForDetail.effectiveSpecialPrice > 0 && selectedServiceForDetail.effectiveSpecialPrice < (selectedServiceForDetail.effectivePrice ?? selectedServiceForDetail.defaultPrice)) && (
                                                    <Text style={styles.modalPriceOriginal}>
                                                        ₹{selectedServiceForDetail.effectivePrice ?? selectedServiceForDetail.defaultPrice}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.dot} />
                                            <Text style={styles.modalDuration}>{selectedServiceForDetail.duration} minutes</Text>
                                        </View>

                                        {selectedServiceForDetail.description && (
                                            <>
                                                <View style={styles.divider} />
                                                <Text style={styles.modalSectionTitle}>Description</Text>
                                                <Text style={styles.modalDesc}>
                                                    {selectedServiceForDetail.description}
                                                </Text>
                                            </>
                                        )}

                                        {/* Dynamic Steps - only if they exist on the service object */}
                                        {selectedServiceForDetail.steps && Array.isArray(selectedServiceForDetail.steps) && selectedServiceForDetail.steps.length > 0 && (
                                            <>
                                                <Text style={styles.modalSectionTitle}>How it works</Text>
                                                {selectedServiceForDetail.steps.map((step, i) => (
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
                                            </>
                                        )}

                                        {/* Dynamic FAQs - only if they exist */}
                                        {selectedServiceForDetail.faqs && Array.isArray(selectedServiceForDetail.faqs) && selectedServiceForDetail.faqs.length > 0 && (
                                            <>
                                                <Text style={styles.modalSectionTitle}>Frequently Asked Questions</Text>
                                                {selectedServiceForDetail.faqs.map((faq, i) => (
                                                    <View key={i} style={styles.faqItem}>
                                                        <Text style={styles.faqQ}>Q: {faq.q || faq.question}</Text>
                                                        <Text style={styles.faqA}>{faq.a || faq.answer}</Text>
                                                    </View>
                                                ))}
                                            </>
                                        )}

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
                            <Text style={styles.footerTotal}>₹{subtotal}</Text>
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

    tabsWrapper: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
    tabsContainer: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
    tab: { alignItems: 'center', gap: 8, paddingHorizontal: 4 },
    tabActive: {},
    tabImageWrapper: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.grayBorder, backgroundColor: colors.background },
    tabImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    tabFallback: { width: '100%', height: '100%', backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    tabFallbackText: { fontSize: 18, fontWeight: '800', color: colors.primary },
    tabImgOverlay: { position: 'absolute', inset: 0, backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary, borderRadius: 28 },
    tabText: { fontSize: 11, fontWeight: '700', color: colors.gray, textAlign: 'center' },
    tabTextActive: { color: colors.primary, fontWeight: '800' },

    modeWrapper: { paddingHorizontal: 20, marginBottom: 16 },
    modeBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: colors.grayBorder },
    modeIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3 },
    modeLabel: { fontSize: 13, fontWeight: '800', color: colors.text },
    modeSubtext: { fontSize: 11, color: colors.gray, marginTop: 1, fontWeight: '500' },

    sectionHeader: { backgroundColor: 'rgba(255,255,255,0.98)', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIndicator: { width: 4, height: 16, borderRadius: 2, backgroundColor: colors.primary },
    sectionHeaderText: { fontSize: 15, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
    headerCount: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    headerCountText: { fontSize: 11, fontWeight: '700', color: colors.gray },

    list: { paddingHorizontal: 20, paddingBottom: 160 },
    cardContainer: { marginBottom: 16, overflow: 'visible' },
    card: { backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.grayBorder, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    cardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#FBFBFF' },
    cardContent: { padding: 14, flexDirection: 'row', gap: 14 },

    cardLeftThum: { width: 100, height: 100, borderRadius: 16, backgroundColor: colors.background, overflow: 'hidden' },
    thumbnailPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    cardRightInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    serviceName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, letterSpacing: -0.2 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    selectedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    selectedPillText: { fontSize: 9, fontWeight: '900', color: colors.white },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.grayMedium },

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    price: { fontSize: 18, fontWeight: '900', color: colors.text },
    priceOriginal: { fontSize: 13, color: colors.gray, textDecorationLine: 'line-through', fontWeight: '500' },

    miniAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', bottom: 0, right: 0, padding: 4 },
    miniAddBtnActive: { opacity: 0.9 },
    miniAddText: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
    miniAddTextActive: { color: colors.error },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 15, color: colors.gray, fontWeight: '600' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorText: { color: colors.gray, fontSize: 15, textAlign: 'center', lineHeight: 22 },
    retryBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.primary, elevation: 4 },
    retryText: { color: colors.white, fontWeight: '800', fontSize: 16 },

    emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
    emptyText: { color: colors.gray, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },

    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
    footerGradient: { padding: 24, paddingBottom: 40, borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -15 }, shadowOpacity: 0.2, shadowRadius: 25 },
    footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerCount: { fontSize: 13, color: colors.gray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    footerTotal: { fontSize: 30, color: colors.text, fontWeight: '900', letterSpacing: -1.5 },
    continueBtn: { borderRadius: 18, overflow: 'hidden', elevation: 10, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 12 },
    continueGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 18 },
    continueBtnText: { color: colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
});
