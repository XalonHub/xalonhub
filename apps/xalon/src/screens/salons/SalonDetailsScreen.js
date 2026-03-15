import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, Animated, Image,
    Alert, Modal, ImageBackground, Dimensions, FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getCategoryMetadata } from '../../constants/CategoryConstants';

const FACILITY_LABELS = {
    ac: { label: 'A/C', icon: 'snow' },
    wifi: { label: 'Wi-Fi', icon: 'wifi' },
    parking: { label: 'Parking', icon: 'car' },
    beverages: { label: 'Beverages', icon: 'cafe' },
    tv: { label: 'TV / Entertainment', icon: 'tv' },
    card_payment: { label: 'Card Payment', icon: 'card' },
    wheelchair: { label: 'Wheelchair Accessible', icon: 'body' },
    music: { label: 'Music', icon: 'musical-notes' },
};

// ── Info Chip ────────────────────────────────────────────────────────────────

function InfoChip({ icon, label }) {
    return (
        <View style={styles.infoChip}>
            <MaterialIcons name={icon} size={14} color={colors.primary} />
            <Text style={styles.infoChipText}>{label}</Text>
        </View>
    );
}

// ── Service Item ─────────────────────────────────────────────────────────────

// ── Service Item ─────────────────────────────────────────────────────────────

function ServiceItem({ item, selected, onToggle, onInfo }) {
    const basePrice = parseFloat(item.defaultPrice || item.price || 0);
    const special = (item.specialPrice && parseFloat(item.specialPrice) > 0) ? parseFloat(item.specialPrice) : null;

    const hasSpecial = !!special && special < basePrice;
    const displayPrice = special || basePrice;
    const originalPrice = hasSpecial ? basePrice : null;

    return (
        <TouchableOpacity
            onPress={() => onInfo(item)}
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
                            {item.gender && item.gender !== 'Unisex' && (
                                <>
                                    <View style={styles.dot} />
                                    <Text style={styles.metaText}>{item.gender}</Text>
                                </>
                            )}
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>₹{displayPrice}</Text>
                            {originalPrice && (
                                <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[styles.miniAddBtn, selected && styles.miniAddBtnActive]}
                            onPress={(e) => {
                                e.stopPropagation();
                                onToggle(item);
                            }}
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
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function SalonDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { salon: initialSalon } = route.params || {};
    const { draft, updateDraft, toggleService, subtotal, totalPrice, totalDuration } = useBooking();
    const { auth } = useAuth();

    const [salon, setSalon] = useState(initialSalon);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeTab, setActiveTab] = useState('Services'); // Services, About, Reviews
    const [footerAnim] = useState(new Animated.Value(0));
    const [detailModal, setDetailModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [imageIndex, setImageIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const categoryRefs = useRef({});
    const BASE_URL = api.BASE_URL;

    // Helper to fix image URLs
    const getImageUrl = (url) => {
        const BU = api.BASE_URL || 'http://localhost:5000';
        if (!url) return null;
        if (url.startsWith('http')) {
            // Replace hardcoded IP with current BU if needed
            return url.replace(/http:\/\/192\.168\.1\.10:5000/g, BU);
        }
        return `${BU}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // No need for mock data anymore

    // Load salon details and services
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                // Fetch both details and services
                const [details, serviceData] = await Promise.all([
                    api.getSalonDetails(salon.id),
                    api.getSalonServices(salon.id)
                ]);

                if (details) setSalon(details);
                setServices(Array.isArray(serviceData) ? serviceData : []);
            } catch (err) {
                console.error('[SalonDetailsScreen] Load Error:', err);
                setError('Failed to load salon details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [salon.id]);

    // If a different salon is selected in cart, warn and clear
    useEffect(() => {
        if (draft.selectedSalon && draft.selectedSalon.id !== salon.id && draft.selectedServices.length > 0) {
            Alert.alert(
                'Switch Salon?',
                `You have services from "${draft.selectedSalon.businessName || draft.selectedSalon.name}" in your cart. Switching salon will clear your current selection.`,
                [
                    { text: 'Keep Current', style: 'cancel' },
                    {
                        text: 'Switch',
                        style: 'destructive',
                        onPress: () => updateDraft({
                            selectedSalon: salon,
                            selectedServices: [],
                            // Preserve mode if it was AtHome, otherwise default to AtSalon for shop partners
                            serviceMode: draft.serviceMode
                        }),
                    },
                ]
            );
        } else if (!draft.selectedSalon || draft.selectedSalon.id !== salon.id) {
            updateDraft({ selectedSalon: salon });
        }
    }, [salon.id]);

    // Footer animation
    useEffect(() => {
        Animated.spring(footerAnim, {
            toValue: draft.selectedServices.length > 0 ? 1 : 0,
            useNativeDriver: true, tension: 50, friction: 8,
        }).start();
    }, [draft.selectedServices.length]);

    // Group services by category
    const { sections, categories } = useMemo(() => {
        const groups = {};
        const skillSet = new Set(salon.categories || []);

        services.forEach(s => {
            // Only include services that match the professional's selected skills/categories
            if (skillSet.size > 0 && !skillSet.has(s.category)) return;

            const cat = s.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(s);
        });
        const cats = Object.keys(groups).sort();
        if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0]);
        return { sections: groups, categories: cats };
    }, [services, salon.categories]);

    const selectedIds = new Set(draft.selectedServices.map(s => s.id));

    const handleToggle = (item) => {
        const price = (item.specialPrice && item.specialPrice > 0) ? item.specialPrice : (item.defaultPrice || item.price);
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
        setSelectedService(item);
        setDetailModal(true);
    };

    const displayImages = (salon.images && salon.images.length > 0) ? salon.images : (salon.coverImage ? [salon.coverImage] : [null]);

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = useMemo(() => {
        if (!salon.workingHours) return null;
        if (Array.isArray(salon.workingHours)) {
            return salon.workingHours.find(h => h.dayName === todayName);
        }
        // If it's the salon object format
        if (typeof salon.workingHours === 'object' && salon.workingHours.days) {
            if (salon.workingHours.days.includes(todayName)) {
                return {
                    isOpen: true,
                    openTime: salon.workingHours.openTime,
                    closeTime: salon.workingHours.closeTime,
                    dayName: todayName
                };
            }
            return { isOpen: false, dayName: todayName };
        }
        return null;
    }, [salon.workingHours, todayName]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
                {/* ── Hero Image Carousel ─────────────────────── */}
                <View style={styles.heroContainer}>
                    <FlatList
                        data={displayImages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                            setImageIndex(index);
                        }}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={({ item }) => (
                            <View style={{ width: Dimensions.get('window').width, height: 260 }}>
                                {item ? (
                                    <Image source={{ uri: getImageUrl(item) }} style={styles.heroImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.heroPlaceholder}>
                                        <MaterialIcons name="storefront" size={60} color={colors.grayMedium} />
                                    </View>
                                )}
                            </View>
                        )}
                        style={{ width: '100%', height: 260 }}
                    />

                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                        locations={[0, 0.4, 1]}
                        style={styles.heroOverlay}
                        pointerEvents="none"
                    >
                        <View />
                        {displayImages.length > 1 && (
                            <View style={styles.imageBadge}>
                                <Text style={styles.imageBadgeText}>{imageIndex + 1} / {displayImages.length}</Text>
                            </View>
                        )}
                    </LinearGradient>

                    <TouchableOpacity style={styles.heroBack} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* ── Salon Info ───────────────────────────────── */}
                <View style={styles.salonInfoCard}>
                    <View style={styles.infoHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.salonName}>{salon.businessName || salon.name}</Text>
                            <View style={styles.locationRow}>
                                <MaterialIcons name="location-on" size={14} color={colors.primary} />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {salon.area || salon.city || salon.district || 'Location not set'}
                                </Text>
                            </View>
                        </View>
                        {/* Logo */}
                        {salon.logoImage && (
                            <Image source={{ uri: getImageUrl(salon.logoImage) }} style={styles.logoImage} resizeMode="contain" />
                        )}
                    </View>

                    {/* Chips row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                        {salon.rating && (
                            <InfoChip icon="star" label={`${parseFloat(salon.rating).toFixed(1)} Rating`} />
                        )}
                        {salon.genderPreference && (
                            <InfoChip
                                icon={salon.genderPreference === 'Male' ? 'man' : salon.genderPreference === 'Female' ? 'woman' : 'people'}
                                label={
                                    salon.partnerType === 'Freelancer'
                                        ? (salon.genderPreference === 'Male' ? 'Male Professionals' : salon.genderPreference === 'Female' ? 'Female Professionals' : 'Both Male & Female')
                                        : (salon.genderPreference === 'Unisex' ? 'Unisex Salon' : `${salon.genderPreference === 'Male' ? "Men's" : "Women's"} Salon`)
                                }
                            />
                        )}
                        {salon.experience && (
                            <InfoChip icon="history" label={`${salon.experience} Years Experience`} />
                        )}
                        {salon.partnerType === 'Freelancer' ? (
                            <InfoChip icon="verified" label="Verified Expert" />
                        ) : (
                            salon.isVerified && <InfoChip icon="verified" label="Verified Partner" />
                        )}
                        {todayHours && todayHours.isOpen ? (
                            <InfoChip icon="schedule" label={`${todayHours.openTime} – ${todayHours.closeTime}`} />
                        ) : todayHours && !todayHours.isOpen ? (
                            <InfoChip icon="schedule" label="Closed Today" />
                        ) : null}
                    </ScrollView>


                    {/* Tabs for Services / About / Reviews */}
                    <View style={styles.mainTabsContainer}>
                        {['Services', 'About', 'Reviews'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.mainTab, activeTab === tab && styles.mainTabActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.mainTabText, activeTab === tab && styles.mainTabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Tab Content ────────────────────────── */}
                {activeTab === 'Services' && (
                    <View>

                        {/* ── Category tabs (sticky) ─────────────────── */}
                        <View style={styles.tabsSection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                                {categories.map(cat => {
                                    const active = selectedCategory === cat;
                                    const metadata = getCategoryMetadata(cat);

                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.tab, active && styles.tabActive]}
                                            onPress={() => {
                                                setSelectedCategory(cat);
                                                if (categoryRefs.current[cat]) {
                                                    categoryRefs.current[cat].measureLayout(
                                                        scrollViewRef.current,
                                                        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
                                                        () => { }
                                                    );
                                                }
                                            }}
                                        >
                                            <Image source={{ uri: metadata.image }} style={styles.tabIcon} />
                                            <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* ── Service sections ────────────────────────── */}
                        <View style={styles.servicesContainer}>
                            {loading ? (
                                <View style={styles.center}>
                                    <ActivityIndicator color={colors.primary} size="large" />
                                    <Text style={styles.loadingText}>Loading services…</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.center}>
                                    <MaterialIcons name="error-outline" size={48} color={colors.error} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : services.length === 0 ? (
                                <View style={styles.center}>
                                    <MaterialIcons name="sentiment-dissatisfied" size={48} color={colors.grayMedium} />
                                    <Text style={styles.emptyTitle}>No services listed yet</Text>
                                    <Text style={styles.emptyText}>This salon hasn't published their menu. Check again soon.</Text>
                                </View>
                            ) : (
                                categories.map(cat => (
                                    <View key={cat} ref={el => categoryRefs.current[cat] = el}>
                                        <View style={styles.catHeader}>
                                            <Text style={styles.catHeaderText}>{cat}</Text>
                                            <Text style={styles.catCount}>{sections[cat]?.length || 0} services</Text>
                                        </View>
                                        {sections[cat]?.map(item => (
                                            <ServiceItem
                                                key={item.id}
                                                item={item}
                                                selected={selectedIds.has(item.id)}
                                                onToggle={handleToggle}
                                                onInfo={handleOpenDetail}
                                            />
                                        ))}
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'About' && (
                    <View style={styles.aboutContainer}>
                        {salon.about ? (
                            <>
                                <Text style={styles.sectionHeading}>
                                    {salon.partnerType === 'Freelancer' ? 'About the Professional' : 'About the Salon'}
                                </Text>
                                <Text style={styles.aboutLongText}>{salon.about}</Text>
                            </>
                        ) : null}

                        {/* Facilities section removed as per requirement */}

                        {(() => {
                            const rawHours = salon.workingHours;
                            let normalizedHours = [];
                            if (Array.isArray(rawHours)) {
                                normalizedHours = rawHours;
                            } else if (rawHours && typeof rawHours === 'object' && rawHours.days) {
                                const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                normalizedHours = allDays.map(d => ({
                                    dayName: d,
                                    isOpen: rawHours.days.includes(d),
                                    openTime: rawHours.openTime,
                                    closeTime: rawHours.closeTime
                                }));
                            }

                            if (normalizedHours.length === 0) return null;

                            return (
                                <>
                                    <Text style={styles.sectionHeading}>Opening Hours</Text>
                                    <View style={styles.hoursBox}>
                                        <View style={{ flex: 1 }}>
                                            {normalizedHours.map((wh, idx) => (
                                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 14, color: wh.dayName === todayName ? colors.primary : colors.grayDark, fontWeight: wh.dayName === todayName ? '700' : '500' }}>
                                                        {wh.dayName} {wh.dayName === todayName && '(Today)'}
                                                    </Text>
                                                    <Text style={{ fontSize: 14, color: wh.isOpen ? colors.text : colors.error, fontWeight: wh.isOpen ? '600' : '500' }}>
                                                        {wh.isOpen ? `${wh.openTime} – ${wh.closeTime}` : 'Closed'}
                                                    </Text>
                                                </View>
                                            ))}
                                            {rawHours && rawHours.breakEnabled && rawHours.breakStart && rawHours.breakEnd && (
                                                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.grayBorder }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '700' }}>
                                                            Daily Break Time
                                                        </Text>
                                                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                                                            {rawHours.breakStart} – {rawHours.breakEnd}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </>
                            );
                        })()}
                    </View>
                )}

                {activeTab === 'Reviews' && (
                    <View style={styles.reviewsContainer}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewScore}>{salon.rating ? parseFloat(salon.rating).toFixed(1) : '0.0'}</Text>
                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <MaterialIcons key={i} name="star" size={16} color={i <= (salon.rating || 0) ? '#F59E0B' : colors.grayLight} />
                                    ))}
                                </View>
                                <Text style={styles.reviewCount}>{salon.reviews || 0} Ratings</Text>
                            </View>
                        </View>
                        {/* Placeholder for actual reviews list */}
                        <View style={styles.center}>
                            <MaterialIcons name="chat-bubble-outline" size={48} color={colors.grayMedium} />
                            <Text style={styles.emptyTitle}>No reviews yet</Text>
                            <Text style={styles.emptyText}>
                                {salon.partnerType === 'Freelancer'
                                    ? "Be the first to review this expert after your service!"
                                    : "Be the first to review this salon after your visit!"}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>
            {/* ── Service Detail Modal ────────────────────────── */}
            <Modal
                visible={detailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedService && (
                                <>
                                    <View style={styles.modalHero}>
                                        <View style={styles.heroPlaceholder}>
                                            <MaterialIcons name="image" size={64} color={colors.grayLight} />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.modalCloseBtn}
                                            onPress={() => setDetailModal(false)}
                                        >
                                            <MaterialIcons name="close" size={24} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        <Text style={styles.modalTitle}>{selectedService.name}</Text>
                                        <View style={styles.modalMeta}>
                                            <View style={styles.modalPriceContainer}>
                                                <Text style={styles.modalPrice}>
                                                    ₹{(selectedService.specialPrice && selectedService.specialPrice > 0) ? selectedService.specialPrice : (selectedService.defaultPrice || selectedService.price)}
                                                </Text>
                                                {!!(selectedService.specialPrice && selectedService.specialPrice > 0 && selectedService.specialPrice < (selectedService.defaultPrice || selectedService.price)) && (
                                                    <Text style={styles.modalPriceOld}>
                                                        ₹{selectedService.defaultPrice || selectedService.price}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.dot} />
                                            <Text style={styles.modalDuration}>{selectedService.duration} minutes</Text>
                                        </View>

                                        {selectedService.description && (
                                            <>
                                                <View style={styles.divider} />
                                                <Text style={styles.modalSectionTitle}>Description</Text>
                                                <Text style={styles.modalDesc}>
                                                    {selectedService.description}
                                                </Text>
                                            </>
                                        )}

                                        {/* Dynamic Steps - only if they exist on the service object */}
                                        {selectedService.steps && Array.isArray(selectedService.steps) && selectedService.steps.length > 0 && (
                                            <>
                                                <Text style={styles.modalSectionTitle}>How it works</Text>
                                                {selectedService.steps.map((step, i) => (
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
                                        {selectedService.faqs && Array.isArray(selectedService.faqs) && selectedService.faqs.length > 0 && (
                                            <>
                                                <Text style={styles.modalSectionTitle}>Frequently Asked Questions</Text>
                                                {selectedService.faqs.map((faq, i) => (
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

                        {selectedService && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.modalAddBtn, selectedIds.has(selectedService.id) && styles.modalRemoveBtn]}
                                    onPress={() => {
                                        handleToggle(selectedService);
                                        setDetailModal(false);
                                    }}
                                >
                                    <Text style={styles.modalAddBtnText}>
                                        {selectedIds.has(selectedService.id) ? "REMOVE FROM CART" : "ADD TO CART"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Floating Cart Footer ────────────────────────── */}
            <Animated.View style={[
                styles.footer,
                { transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [140, 0] }) }] }
            ]}>
                <LinearGradient colors={['rgba(255,255,255,0.92)', colors.white]} style={styles.footerGrad}>
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerCount}>
                                {draft.selectedServices.length} {draft.selectedServices.length === 1 ? 'Service' : 'Services'} · {totalDuration} min
                            </Text>
                            <Text style={styles.footerTotal}>₹{subtotal}</Text>
                        </View>
                        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                            <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueGrad}>
                                <Text style={styles.continueBtnText}>Proceed to Book</Text>
                                <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
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

    // Hero
    heroContainer: { width: '100%', height: 200, position: 'relative', backgroundColor: colors.background },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
    heroOverlay: { position: 'absolute', inset: 0, justifyContent: 'space-between', padding: 20, paddingTop: 40 },
    heroBack: {
        position: 'absolute', top: 40, left: 16,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    },
    imageBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
        marginBottom: 30, // Lift it above the curved overlap
    },
    imageBadgeText: { color: colors.white, fontSize: 13, fontWeight: '800' },

    // Salon Info Card
    salonInfoCard: {
        backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        marginTop: -30, padding: 20, paddingTop: 20,
        borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
    },
    infoHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    salonName: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 2 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: colors.gray, fontWeight: '500', flex: 1 },
    logoImage: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.grayBorder },
    chipsRow: { marginBottom: 8 },
    infoChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, marginRight: 8,
    },
    infoChipText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    aboutText: { fontSize: 14, color: colors.gray, lineHeight: 22, marginTop: 4 },


    // Main Tabs (Services / About / Reviews)
    mainTabsContainer: {
        flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
        marginTop: 8,
    },
    mainTab: {
        flex: 1, paddingVertical: 10, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    mainTabActive: { borderBottomColor: colors.primary },
    mainTabText: { fontSize: 15, fontWeight: '600', color: colors.gray },
    mainTabTextActive: { color: colors.primary, fontWeight: '800' },

    // Category tabs
    tabsSection: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder, paddingVertical: 12 },
    tabsContainer: { paddingHorizontal: 20, gap: 8 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 24,
        backgroundColor: colors.background, borderWidth: 1, borderColor: colors.grayBorder,
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabIcon: { width: 20, height: 20, borderRadius: 10 },
    tabText: { fontSize: 13, fontWeight: '700', color: colors.gray },
    tabTextActive: { color: colors.white },


    // Services
    servicesContainer: { backgroundColor: colors.background },
    catHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.white,
    },
    catHeaderText: { fontSize: 13, fontWeight: '900', color: colors.gray, textTransform: 'uppercase', letterSpacing: 1.2 },
    catCount: { fontSize: 11, color: colors.grayMedium, fontWeight: '600' },

    // Unified Card Styles (similar to ServiceListScreen)
    cardContainer: { marginBottom: 16, marginHorizontal: 16 },
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

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    price: { fontSize: 17, fontWeight: '800', color: colors.text },
    priceOriginal: { fontSize: 13, color: colors.gray, textDecorationLine: 'line-through' },

    miniAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', bottom: 0, right: 0, padding: 4 },
    miniAddBtnActive: { opacity: 0.8 },
    miniAddText: { fontSize: 11, fontWeight: '800', color: colors.primary },
    miniAddTextActive: { color: colors.error },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.white, height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    modalHero: { width: '100%', height: 250, backgroundColor: colors.background },
    heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalCloseBtn: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },

    modalBody: { padding: 24 },
    modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
    modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    modalPrice: { fontSize: 20, fontWeight: '800', color: colors.primary },
    modalPriceOld: { fontSize: 14, color: colors.gray, textDecorationLine: 'line-through', marginLeft: 6, fontWeight: '500' },
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
    modalRemoveBtn: { backgroundColor: colors.error },
    modalAddBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 1 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    footerGrad: { padding: 20, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28, elevation: 25 },
    footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerCount: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    footerTotal: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 },
    continueBtn: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10 },
    continueGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 16 },
    continueBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    loadingText: { fontSize: 14, color: colors.gray, fontWeight: '500' },
    errorText: { fontSize: 14, color: colors.gray, textAlign: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
    emptyText: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 20, marginTop: 4 },

    // About Tab
    aboutContainer: { padding: 20, backgroundColor: colors.white },
    sectionHeading: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16, marginTop: 10 },
    aboutLongText: { fontSize: 15, color: colors.grayDark, lineHeight: 24, marginBottom: 24 },
    facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    facilityGridItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, padding: 12, borderRadius: 12 },
    facilityIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    facilityGridText: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
    hoursBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, padding: 16, borderRadius: 12 },
    hoursText: { fontSize: 15, fontWeight: '600', color: colors.text },

    // Reviews Tab
    reviewsContainer: { padding: 20, backgroundColor: colors.white, minHeight: 300 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.grayBorder, marginBottom: 20 },
    reviewScore: { fontSize: 40, fontWeight: '900', color: colors.text },
    reviewCount: { fontSize: 13, color: colors.gray, marginTop: 4 },
});
