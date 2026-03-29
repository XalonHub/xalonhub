import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const STORAGE_KEY = 'onboarding_draft';

const defaultFormData = {
    // Work preference: 'freelancer' | 'salon'
    workPreference: null,
    partnerId: null, // Track the backend profile ID

    // Freelancer: Personal Profile (BasicInfoScreen)
    personalInfo: {
        name: '',
        dob: '',
        fatherName: '',
        gender: '',
        email: '',
        travel: '',
        experience: '',
        aadharNumber: '',
        profileImg: null,
        agentCode: '',
    },

    // Unified Bank Details (moved from kyc.bank)
    bank: {
        bankName: '',
        accName: '',
        ifsc: '',
        accNum: '',
    },

    // Unified Address (moved from salonAddress / kyc.permanentAddress)
    address: {
        address: '',
        state: '',
        district: '',
        city: '',
        locality: '',
        pincode: '',
        lat: null,
        lng: null,
    },

    // KYC Documents only
    kyc: {
        documents: {
            hasLicense: 'Yes',
            dlName: '',
            dlDob: '',
            hasPoliceCert: 'Yes',
        },
    },

    // Salon: Basic info (SalonBasicInfoScreen)
    salonInfo: {
        name: '',
        businessName: '',
        email: '',
        state: '',
        district: '',
        city: '',
        panCard: '',
        gstNumber: '',
        about: '',
        hasAgentCode: false,
        agentCode: '',
    },

    salonCover: {
        logo: null,
        banner: null,
        inside: [], // Array of up to 3 URLs
        outside: [], // Array of up to 3 URLs
    },
    lastScreen: null,

    // Freelancer/Salon: Professional Details (Social links)
    professional: {
        facebook: '',
        instagram: '',
        youtube: '',
    },

    onboardingGender: 'Male',
    selectedServices: [], // Array of { id, name, category, gender, price, ... }
    salonServices: [], // Array of services selected by salon owner
    workingHours: null,

    // Freelancer capability categories (selected from existing CATEGORIES list)
    categories: [], // e.g. ['Makeup', 'Hair', 'Massage']
    isOnboarded: false,
    emailVerified: false,

    // KYC verification status: null | 'under_review' | 'approved' | 'rejected'
    kycStatus: null,
    kycRejectedReason: null,
    contractAccepted: false,
    stylists: [],
};

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
    const [formData, setFormData] = useState(defaultFormData);
    const [loaded, setLoaded] = useState(false);

    // Auth state retrieved locally for API calls
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Load persisted draft from AsyncStorage on mount
    useEffect(() => {
        (async () => {
            try {
                // Also load auth data so we can sync to backend
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('token');
                if (storedUser) setUser(JSON.parse(storedUser));
                if (storedToken) setToken(storedToken);

                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    setFormData(prev => deepMerge(prev, saved));
                }
            } catch (e) {
                console.warn('[OnboardingContext] Failed to load draft or user:', e);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    // Auto-save to AsyncStorage whenever formData changes
    useEffect(() => {
        if (!loaded) return;
        (async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
            } catch (e) {
                console.warn('[OnboardingContext] Failed to save draft:', e);
            }
        })();
    }, [formData, loaded]);

    // Update state and optionally sync with backend API
    const updateFormData = useCallback(async (section, values) => {
        setFormData(prev => {
            let nextState = {
                ...prev,
                [section]: typeof values === 'object' && !Array.isArray(values)
                    ? { ...prev[section], ...values }
                    : values,
            };

            // Derive categories if services change
            if (section === 'salonServices' || section === 'selectedServices') {
                const services = nextState[section] || [];
                const uniqueCats = [...new Set(services.map(s => s.category).filter(Boolean))];
                nextState.categories = uniqueCats;
            }

            return nextState;
        });

        // 2. Prepare for API sync
        try {
            // Get latest state/storage data
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const currentToken = storedToken;

            if (!currentUser || !currentUser.phone || !currentToken) {
                console.log('[OnboardingContext] No user or token found. Skipping API sync.');
                return;
            }

            // Get latest partnerId from state (using a functional update trick or just checking storage)
            let currentPartnerId = await AsyncStorage.getItem('partnerId');

            // 3. Handle Profile Initialization if needed
            if (section === 'workPreference' && !currentPartnerId) {
                const partnerType = values === 'freelancer' ? 'Freelancer' : 'Unisex_Salon';
                try {
                    const initRes = await api.post('/partners/init', {
                        phone: currentUser.phone,
                        partnerType
                    });

                    if (initRes.data && initRes.data.id) {
                        currentPartnerId = initRes.data.id;
                        setFormData(p => ({ ...p, partnerId: currentPartnerId }));
                        await AsyncStorage.setItem('partnerId', currentPartnerId);
                    }
                } catch (e) {
                    console.log('Profile initialization:', e?.response?.data?.error || e.message);
                    if (e.response?.data?.profile?.id) {
                        currentPartnerId = e.response.data.profile.id;
                        setFormData(p => ({ ...p, partnerId: currentPartnerId }));
                        await AsyncStorage.setItem('partnerId', currentPartnerId);
                    }
                }
            }

            // 4. If we have a partner ID, sync the changed section
            if (currentPartnerId) {
                // We fetch the current state for this specific sync call
                // Note: since setFormData is async, we may need to use the 'values' directly 
                // for the section being updated to be sure we have the latest.

                // We'll use a pattern where we get the NEXT state for the API call
                let nextSectionData = values;

                // If it was a partial object update, we need to merge it with current formData
                // But to be safest, we can use the result of a functional update.
                let updateData = values;

                switch (section) {
                    case 'personalInfo':
                    case 'salonInfo':
                        await api.put(`/partners/${currentPartnerId}/basic-info`, updateData);
                        break;
                    case 'address':
                        // Unified address sync
                        await api.put(`/partners/${currentPartnerId}/address`, updateData);
                        break;
                    case 'bank':
                        // Unified bank sync
                        await api.put(`/partners/${currentPartnerId}/documents`, { bank: updateData });
                        break;
                    case 'kyc':
                        // Sync only identity documents and verification status
                        if (updateData.documents || updateData.kycStatus) {
                            await api.put(`/partners/${currentPartnerId}/documents`, {
                                kycDocuments: updateData.documents,
                                kycStatus: updateData.kycStatus
                            });
                        }
                        break;
                    case 'professional':
                        await api.put(`/partners/${currentPartnerId}/professional`, updateData);
                        break;
                    case 'categories':
                    case 'workPreferences':
                        // For these we might need both, so we peek into state for the other one
                        // But for simplicity of this fix, let's just send what we have
                        await api.put(`/partners/${currentPartnerId}/preferences`, {
                            categories: section === 'categories' ? updateData : formData.categories,
                            workPreferences: section === 'workPreferences' ? updateData : formData.workPreferences,
                        });
                        break;
                    case 'documents':
                        await api.put(`/partners/${currentPartnerId}/documents`, updateData);
                        break;
                    case 'salonCover':
                        await api.put(`/partners/${currentPartnerId}/salon-cover`, updateData);
                        break;
                    case 'workingHours':
                        await api.put(`/partners/${currentPartnerId}/hours`, { workingHours: updateData });
                        break;
                    case 'salonServices':
                        {
                            const cats = [...new Set(updateData.map(s => s.category).filter(Boolean))];
                            await Promise.all([
                                api.put(`/partners/${currentPartnerId}/services`, { salonServices: updateData }),
                                api.put(`/partners/${currentPartnerId}/preferences`, { categories: cats })
                            ]);
                        }
                        break;
                    case 'selectedServices':
                        {
                            const cats = [...new Set(updateData.map(s => s.category).filter(Boolean))];
                            await Promise.all([
                                api.put(`/partners/${currentPartnerId}/services`, { salonServices: updateData }),
                                api.put(`/partners/${currentPartnerId}/preferences`, { categories: cats })
                            ]);
                        }
                        break;
                    case 'contractAccepted':
                        await api.put(`/partners/${currentPartnerId}/contract`, { contractAccepted: updateData });
                        break;
                }
                console.log(`[API Sync] Successfully synced section: ${section} for partner: ${currentPartnerId}`);
            }
        } catch (apiError) {
            console.error(`[API Sync] Failed to sync section ${section}:`, apiError?.response?.data || apiError.message);
        }
    }, [formData]);

    // Merge cloud draft into local storage and state
    const syncCloudDraftToLocal = useCallback(async (profile, isFresh = false) => {
        if (!profile) return null;

        console.log('[OnboardingContext] Syncing Profile:', profile.id);

        let finalData = null;

        await new Promise((resolve) => {
            setFormData(prev => {
                // Start from prev to keep any local-only state, 
                // but we will deeply merge the profile data into it.
                let next = isFresh ? { ...defaultFormData } : deepMerge(defaultFormData, prev);
                
                next.partnerId = profile.id;
                next.workPreference = profile.partnerType === 'Freelancer' ? 'freelancer' : 'salon';

                if (profile.basicInfo) {
                    const section = next.workPreference === 'freelancer' ? 'personalInfo' : 'salonInfo';
                    next[section] = { ...next[section], ...profile.basicInfo };
                }

                if (profile.address) {
                    next.address = { ...next.address, ...profile.address };
                }

                if (profile.professionalDetails) {
                    next.professional = { ...next.professional, ...profile.professionalDetails };
                }

                if (profile.categories) next.categories = profile.categories;
                if (profile.workPreferences) next.workPreferences = profile.workPreferences;
                if (profile.workingHours) next.workingHours = profile.workingHours;

                if (profile.documents) {
                    const docs = profile.documents;
                    
                    // 1. Bank
                    if (docs.bank) {
                        next.bank = { ...next.bank, ...docs.bank };
                    }
                    
                    // 2. Identity Docs (KYC)
                    // We start with a fresh documents object based on default + current to avoid missing keys
                    let nextKycDocs = { ...next.kyc?.documents };
                    
                    // Priority 1: Map any flat fields from the database (Legacy/Hybrid)
                    const kycKeys = [
                        'aadhaarFront', 'aadhaarBack', 'aadhaarNum', 
                        'licenseNum', 'licenseImg', 'hasLicense', 'dlName', 'dlDob',
                        'hasPoliceCert', 'policeNum', 'policeImg', 'regCertificateNum', 'regCertificateImg',
                        'showcaseImages'
                    ];
                    kycKeys.forEach(key => {
                        if (docs[key] !== undefined && docs[key] !== null) {
                            nextKycDocs[key] = docs[key];
                        }
                    });

                    // Priority 2: Merge the nested kycDocuments record if it exists (New Structure)
                    if (docs.kycDocuments) {
                        Object.keys(docs.kycDocuments).forEach(k => {
                            if (docs.kycDocuments[k] !== undefined && docs.kycDocuments[k] !== null) {
                                nextKycDocs[k] = docs.kycDocuments[k];
                            }
                        });
                    }

                    // Normalize hasPoliceCert to boolean as expected by UI
                    if (nextKycDocs.hasPoliceCert === 'Yes') nextKycDocs.hasPoliceCert = true;
                    if (nextKycDocs.hasPoliceCert === 'No') nextKycDocs.hasPoliceCert = false;
                    
                    next.kyc = { ...next.kyc, documents: nextKycDocs };
                }

                if (profile.salonCover) {
                    next.salonCover = { ...next.salonCover, ...profile.salonCover };
                }

                // Fallback for salon cover if missing
                if (!profile.salonCover && profile.documents) {
                    const docs = profile.documents;
                    if (docs.shopFrontImg || docs.shopBanner || docs.shopInteriorImg) {
                        next.salonCover = {
                            ...next.salonCover,
                            banner: docs.shopBanner || next.salonCover.banner,
                            outside: docs.shopFrontImg ? [docs.shopFrontImg] : next.salonCover.outside,
                            inside: docs.shopInteriorImg ? [docs.shopInteriorImg] : next.salonCover.inside,
                        };
                    }
                }

                if (profile.salonServices) {
                    const sKey = next.workPreference === 'freelancer' ? 'selectedServices' : 'salonServices';
                    next[sKey] = profile.salonServices;
                }

                if (profile.stylists) next.stylists = profile.stylists;
                if (profile.isOnboarded !== undefined) next.isOnboarded = profile.isOnboarded;
                if (profile.kycStatus !== undefined) next.kycStatus = profile.kycStatus;
                if (profile.kycRejectedReason !== undefined) next.kycRejectedReason = profile.kycRejectedReason;
                if (profile.user?.emailVerified !== undefined) next.emailVerified = profile.user.emailVerified;

                if (!next.lastScreen) {
                    if (next.isOnboarded) {
                        next.lastScreen = 'Dashboard';
                    } else {
                        const hasBasic = profile.basicInfo && profile.basicInfo.name;
                        next.lastScreen = hasBasic ? 'address' : (next.workPreference === 'freelancer' ? 'BasicInfo' : 'SalonBasicInfo');
                    }
                }

                finalData = { ...next };
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
                resolve(finalData);
                return finalData;
            });
        });

        return finalData;
    }, []);


    // Mark as onboarded on both local and cloud
    const completeOnboarding = useCallback(async () => {
        if (!formData.partnerId) return;
        try {
            await api.put(`/partners/${formData.partnerId}/complete`);
            setFormData(prev => ({ ...prev, isOnboarded: true, lastScreen: 'Dashboard' }));
        } catch (e) {
            console.error('[OnboardingContext] Failed to complete onboarding:', e?.response?.data || e.message);
            throw e;
        }
    }, [formData.partnerId]);

    // Clear the draft completely (call after successful final submission)
    const clearOnboardingDraft = useCallback(async () => {
        setFormData(defaultFormData);
        await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEY),
            AsyncStorage.removeItem('partnerId'),
        ]);
    }, []);

    // Complete Logout: Clear EVERYTHING
    const logout = useCallback(async () => {
        setFormData(defaultFormData);
        setUser(null);
        setToken(null);
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEY),
                AsyncStorage.removeItem('user'),
                AsyncStorage.removeItem('token'),
                AsyncStorage.removeItem('partnerId'),
            ]);
            console.log('[OnboardingContext] Successfully logged out and cleared all data.');
        } catch (e) {
            console.error('[OnboardingContext] Failed to clear data during logout:', e);
        }
    }, []);

    return (
        <OnboardingContext.Provider value={{
            formData,
            updateFormData,
            clearOnboardingDraft,
            syncCloudDraftToLocal,
            completeOnboarding,
            logout
        }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
    return ctx;
}

// Utility: deep merge b into a (b wins on conflict)
function deepMerge(a, b) {
    if (typeof a !== 'object' || a === null) return b;
    if (typeof b !== 'object' || b === null) return a;
    const result = { ...a };
    for (const key of Object.keys(b)) {
        if (key in result && typeof result[key] === 'object' && !Array.isArray(result[key])) {
            result[key] = deepMerge(result[key], b[key]);
        } else {
            result[key] = b[key];
        }
    }
    return result;
}
