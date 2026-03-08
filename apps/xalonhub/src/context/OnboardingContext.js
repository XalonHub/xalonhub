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
        about: '',
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
                    case 'salonAddress':
                        // For Salons, keep it FLAT as in the app state to avoid format confusion
                        await api.put(`/partners/${currentPartnerId}/address`, updateData);
                        break;
                    case 'address':
                        // For Freelancers, we use the dual address structure
                        await api.put(`/partners/${currentPartnerId}/address`, {
                            currentAddress: updateData,
                            permanentAddress: updateData
                        });
                        break;
                    case 'kyc':
                        if (updateData.permanentAddress || updateData.currentAddress) {
                            await api.put(`/partners/${currentPartnerId}/address`, {
                                permanentAddress: updateData.permanentAddress,
                                currentAddress: updateData.currentAddress,
                            });
                        }
                        if (updateData.bank || updateData.documents) {
                            await api.put(`/partners/${currentPartnerId}/documents`, {
                                bank: updateData.bank,
                                kycDocuments: updateData.documents,
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
    const syncCloudDraftToLocal = useCallback(async (profile) => {
        if (!profile) return;

        console.log('[OnboardingContext] Syncing Cloud Profile to state:', profile.id);

        setFormData(prev => {
            let hydratedFormData = { ...prev }; // Start from current state to prevent data loss
            hydratedFormData.partnerId = profile.id;
            hydratedFormData.workPreference = profile.partnerType === 'Freelancer' ? 'freelancer' : 'salon';

            if (profile.basicInfo) {
                const section = hydratedFormData.workPreference === 'freelancer' ? 'personalInfo' : 'salonInfo';
                hydratedFormData[section] = { ...hydratedFormData[section], ...profile.basicInfo };
            }

            if (profile.address) {
                if (hydratedFormData.workPreference === 'freelancer') {
                    if (profile.address.permanentAddress || profile.address.currentAddress) {
                        hydratedFormData.kyc = { ...hydratedFormData.kyc, ...profile.address };
                    } else {
                        hydratedFormData.address = { ...hydratedFormData.address, ...profile.address };
                    }
                } else {
                    // Standardize Salon Address: try to flatten if it's nested in DB
                    const addr = profile.address || {};
                    hydratedFormData.salonAddress = {
                        ...hydratedFormData.salonAddress,
                        ...(addr.currentAddress || addr)
                    };
                }
            }

            if (profile.professionalDetails) {
                hydratedFormData.professional = { ...hydratedFormData.professional, ...profile.professionalDetails };
            }

            if (profile.categories) hydratedFormData.categories = profile.categories;
            if (profile.workPreferences) hydratedFormData.workPreferences = profile.workPreferences;
            if (profile.workingHours) hydratedFormData.workingHours = profile.workingHours;

            if (profile.documents) {
                hydratedFormData.documents = { ...hydratedFormData.documents, ...profile.documents };
                if (profile.documents.bank) {
                    hydratedFormData.kyc.bank = { ...hydratedFormData.kyc.bank, ...profile.documents.bank };
                }
            }

            if (profile.salonCover) {
                hydratedFormData.salonCover = profile.salonCover;
            }

            if (profile.salonServices) {
                const sKey = hydratedFormData.workPreference === 'freelancer' ? 'selectedServices' : 'salonServices';
                hydratedFormData[sKey] = profile.salonServices;
            }

            if (profile.stylists) {
                hydratedFormData.stylists = profile.stylists;
            }

            if (profile.isOnboarded !== undefined) hydratedFormData.isOnboarded = profile.isOnboarded;
            if (profile.kycStatus !== undefined) hydratedFormData.kycStatus = profile.kycStatus;
            // Sync email verification status from the linked User record
            if (profile.user?.emailVerified !== undefined) hydratedFormData.emailVerified = profile.user.emailVerified;

            // Re-calculate lastScreen if missing
            if (!hydratedFormData.lastScreen) {
                if (hydratedFormData.isOnboarded) {
                    hydratedFormData.lastScreen = 'Dashboard';
                } else {
                    const hasBasic = profile.basicInfo && profile.basicInfo.name;
                    if (profile.partnerType === 'Freelancer') {
                        hydratedFormData.lastScreen = hasBasic ? 'LocationConfirm' : 'BasicInfo';
                    } else {
                        hydratedFormData.lastScreen = hasBasic ? 'SalonAddress' : 'SalonBasicInfo';
                    }
                }
            }

            const finalData = deepMerge(defaultFormData, hydratedFormData);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
            // HACK: Store in temporary local variable so we can return it out of the async function
            // (but since setFormData is async, this won't be immediately available)
            // Better: also return it for the caller to use IMMEDIATELY.
            return finalData;
        });

        // RE-CALCULATE outside setFormData for the caller's immediate use, 
        // while the state update happens in background. 
        // This avoids the 'undefined' crash in screens waiting for the result.
        const currentData = await AsyncStorage.getItem(STORAGE_KEY);
        return currentData ? JSON.parse(currentData) : null;
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
