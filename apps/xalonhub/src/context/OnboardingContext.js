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

    // Freelancer KYC (Now unified into DocumentUploadScreen & BankDetailsScreen)
    kyc: {
        permanentAddress: {
            address: '',
            state: '',
            district: '',
            city: '',
            locality: '',
            pincode: '',
        },
        currentAddress: {
            address: '',
            state: '',
            district: '',
            city: '',
            locality: '',
            pincode: '',
        },
        bank: {
            bankName: '',
            accName: '',
            ifsc: '',
            accNum: '',
        },
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
        hasAgentCode: false,
        agentCode: '',
    },

    // Salon: Address (SalonAddressScreen / SalonAddressConfirmScreen)
    salonAddress: {
        mapAddress: '',
        address: '',
        state: '',
        district: '',
        city: '',
        locality: '',
        pincode: '',
    },
    salonCover: {
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
    contractAccepted: false,
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
        // 1. Compute new state synchronously
        const newFormData = {
            ...formData,
            [section]: typeof values === 'object' && !Array.isArray(values)
                ? { ...formData[section], ...values }
                : values,
        };

        // Update local state immediately
        setFormData(newFormData);


        // 2. Fetch fresh user & token to ensure we don't use stale state right after login
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const currentToken = storedToken;

        // 3. Sync with backend API (only if on web or if we have a token)
        if (!currentUser || !currentUser.phone || !currentToken) {
            console.log('[OnboardingContext] No user or token found. Skipping API sync for now.');
            return;
        }

        try {
            let currentPartnerId = newFormData.partnerId;

            // Scenario 1: Initializing partnerProfile with PartnerType
            if (section === 'workPreference') {
                const partnerType = values === 'freelancer' ? 'Freelancer' : 'Unisex_Salon'; // Simplified default
                try {
                    const initRes = await api.post('/partners/init', {
                        phone: currentUser.phone,
                        partnerType
                    });

                    // Save newly obtained ID
                    if (initRes.data && initRes.data.id) {
                        currentPartnerId = initRes.data.id;
                        setFormData(p => ({ ...p, partnerId: currentPartnerId }));
                    }
                } catch (e) {
                    // Profile might already exist, try fetching it or ignore
                    console.log('Profile may already exist', e?.response?.data || e.message);
                }
            }

            // If we have a partner ID, we can do incremental saves
            if (currentPartnerId) {
                if (section === 'personalInfo' || section === 'salonInfo') {
                    await api.put(`/partners/${currentPartnerId}/basic-info`, newFormData[section]);

                    // Specific to Freelancer: their genderPreference is collected here but belongs in workPreferences
                    if (section === 'personalInfo' && newFormData.personalInfo.genderPreference) {
                        await api.put(`/partners/${currentPartnerId}/preferences`, {
                            workPreferences: { genderPreference: newFormData.personalInfo.genderPreference }
                        });
                    }
                } else if (section === 'salonAddress' || section === 'address') {
                    await api.put(`/partners/${currentPartnerId}/address`, newFormData[section]);
                } else if (section === 'kyc') {
                    // KYC has multiple sub-sections — route each to the correct endpoint
                    const kycData = newFormData.kyc;
                    // Address parts → /address
                    if (kycData.permAddress || kycData.currAddress || kycData.permanentAddress || kycData.currentAddress) {
                        await api.put(`/partners/${currentPartnerId}/address`, {
                            permAddress: kycData.permAddress,
                            currAddress: kycData.currAddress,
                            permanentAddress: kycData.permanentAddress,
                            currentAddress: kycData.currentAddress,
                        });
                    }
                    // Bank + KYC documents → /documents (merged with existing)
                    if (kycData.bank || kycData.documents) {
                        await api.put(`/partners/${currentPartnerId}/documents`, {
                            bank: kycData.bank,
                            kycDocuments: kycData.documents,
                        });
                    }
                } else if (section === 'professional') {
                    await api.put(`/partners/${currentPartnerId}/professional`, newFormData[section]);
                } else if (section === 'categories') {
                    // Save freelancer capability categories
                    await api.put(`/partners/${currentPartnerId}/preferences`, {
                        categories: newFormData.categories,
                        workPreferences: newFormData.workPreferences || null,
                    });
                } else if (section === 'documents') {
                    await api.put(`/partners/${currentPartnerId}/documents`, newFormData[section]);
                } else if (section === 'salonCover') {
                    await api.put(`/partners/${currentPartnerId}/salon-cover`, newFormData.salonCover);
                } else if (section === 'workingHours') {
                    await api.put(`/partners/${currentPartnerId}/hours`, {
                        workingHours: newFormData.workingHours
                    });
                } else if (section === 'contractAccepted') {
                    await api.put(`/partners/${currentPartnerId}/contract`, { contractAccepted: newFormData[section] });
                } else if (section === 'lastScreen') {
                    // Just tracking locally is fine usually, but maybe we want to save to draft on server?
                    // For now, local is prioritized by SplashScreen anyway.
                }
                console.log(`[API Sync] Successfully synced section: ${section} for partner: ${currentPartnerId}`);
            }

        } catch (apiError) {
            console.error(`[API Sync] Failed to sync section ${section}:`, apiError?.response?.data || apiError.message);
            throw apiError; // rethrow so UI can handle if needed
        }

    }, []);

    // Merge cloud draft into local storage and state upon login
    const syncCloudDraftToLocal = useCallback(async (profile) => {
        if (!profile) return;

        console.log('[OnboardingContext] Hydrating local draft from Cloud Profile:', profile);

        let hydratedFormData = { ...defaultFormData };
        hydratedFormData.partnerId = profile.id;
        hydratedFormData.workPreference = profile.partnerType === 'Freelancer' ? 'freelancer' : 'salon';

        if (profile.basicInfo) {
            if (hydratedFormData.workPreference === 'freelancer') {
                hydratedFormData.personalInfo = { ...hydratedFormData.personalInfo, ...profile.basicInfo };
            } else {
                hydratedFormData.salonInfo = { ...hydratedFormData.salonInfo, ...profile.basicInfo };
            }
        }

        if (profile.address) {
            if (hydratedFormData.workPreference === 'freelancer') {
                // For freelancers, profile.address comes from LocationConfirm (service address with lat/lng)
                // or FreelancerKYC (permAddress/currAddress).
                if (profile.address.permAddress || profile.address.permanentAddress) {
                    // KYC-style address
                    hydratedFormData.kyc = { ...hydratedFormData.kyc, ...profile.address };
                } else {
                    // Service address from LocationConfirm - store at formData.address
                    hydratedFormData.address = { ...hydratedFormData.address, ...profile.address };
                    // Also populate kyc.permanentAddress as a convenience fallback
                    hydratedFormData.kyc.permanentAddress = { ...hydratedFormData.kyc.permanentAddress, ...profile.address };
                }
            } else {
                hydratedFormData.salonAddress = { ...hydratedFormData.salonAddress, ...profile.address };
            }
        }

        if (profile.professionalDetails) {
            hydratedFormData.professional = { ...hydratedFormData.professional, ...profile.professionalDetails };
        }

        if (profile.categories) {
            hydratedFormData.categories = profile.categories;
        }

        if (profile.workingHours) {
            hydratedFormData.workingHours = profile.workingHours;
        }

        if (profile.documents) {
            // Map universally so DocumentUploadScreen works for both path flows
            hydratedFormData.documents = { ...hydratedFormData.documents, ...profile.documents };
            // Populate nested kyc struct for BankDetails compatibility
            if (profile.documents.bank) {
                hydratedFormData.kyc.bank = { ...hydratedFormData.kyc.bank, ...profile.documents.bank };
            }
            if (hydratedFormData.workPreference === 'freelancer') {
                hydratedFormData.kyc.documents = { ...hydratedFormData.kyc.documents, ...profile.documents };
            }
        }

        if (profile.salonCover) {
            hydratedFormData.salonCover = profile.salonCover;
        } else if (profile.coverImages && profile.coverImages.length > 0) {
            // Legacy/Fallback hydration
            hydratedFormData.salonCover = {
                inside: [profile.coverImages[0]].filter(Boolean),
                outside: [profile.coverImages[1]].filter(Boolean),
            };
        }

        // Hydrate services (differently for freelancer/salon based on existing use)
        if (profile.salonServices) {
            // Mapping what's in DB to what the UI expects (selectedServices or salonServices)
            if (hydratedFormData.workPreference === 'freelancer') {
                hydratedFormData.selectedServices = profile.salonServices;
            } else {
                hydratedFormData.salonServices = profile.salonServices;
            }
        }

        if (profile.isOnboarded !== undefined) {
            hydratedFormData.isOnboarded = profile.isOnboarded;
        }

        if (profile.user && profile.user.emailVerified !== undefined) {
            hydratedFormData.emailVerified = profile.user.emailVerified;
        } else if (profile.emailVerified !== undefined) {
            hydratedFormData.emailVerified = profile.emailVerified;
        }

        if (profile.kycStatus !== undefined) {
            hydratedFormData.kycStatus = profile.kycStatus;
        }

        if (profile.contractAccepted !== undefined) {
            hydratedFormData.contractAccepted = profile.contractAccepted;
        }

        if (profile.basicInfo && profile.basicInfo.aadharNumber) {
            hydratedFormData.personalInfo.aadharNumber = profile.basicInfo.aadharNumber;
        }

        if (profile.basicInfo && profile.basicInfo.profileImg) {
            hydratedFormData.personalInfo.profileImg = profile.basicInfo.profileImg;
        }

        if (profile.basicInfo && profile.basicInfo.agentCode) {
            hydratedFormData.personalInfo.agentCode = profile.basicInfo.agentCode;
        }

        // Determine lastScreen based on completeness if not present
        if (!hydratedFormData.lastScreen) {
            if (hydratedFormData.isOnboarded) {
                hydratedFormData.lastScreen = 'Dashboard';
            } else {
                const hasBasicInfo = profile.basicInfo && profile.basicInfo.name;
                const hasAddress = profile.address && profile.address.state;
                const hasServices = profile.salonServices && profile.salonServices.length > 0;

                if (profile.partnerType === 'Freelancer') {
                    if (!hasBasicInfo) hydratedFormData.lastScreen = 'BasicInfo';
                    else if (!hasAddress) hydratedFormData.lastScreen = 'LocationConfirm';
                    else if (!hasServices) hydratedFormData.lastScreen = 'ServiceCategory';
                    else hydratedFormData.lastScreen = 'Dashboard';
                } else {
                    if (!hasBasicInfo) hydratedFormData.lastScreen = 'SalonBasicInfo';
                    else if (!hasAddress) hydratedFormData.lastScreen = 'SalonAddress';
                    else if (!hasServices) hydratedFormData.lastScreen = 'SalonServiceSetup';
                    else hydratedFormData.lastScreen = 'Dashboard';
                }
            }
        }

        // Finalize merge
        const finalData = deepMerge(defaultFormData, hydratedFormData);
        setFormData(finalData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));

        return finalData; // return it so the caller knows where they are in the flow
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
        await AsyncStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <OnboardingContext.Provider value={{
            formData,
            updateFormData,
            clearOnboardingDraft,
            syncCloudDraftToLocal,
            completeOnboarding
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
