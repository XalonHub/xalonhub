import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import SplashScreen from './src/screens/SplashScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPVerifyScreen from './src/screens/OTPVerifyScreen';

// ─── Shared ───────────────────────────────────────────────────────────────────
import WorkPreferenceScreen from './src/screens/WorkPreferenceScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SubscriptionPaymentScreen from './src/screens/SubscriptionPaymentScreen';

// ─── Freelancer Onboarding ────────────────────────────────────────────────────
import ServiceAgreementScreen from './src/screens/ServiceAgreementScreen';
import BasicInfoScreen from './src/screens/BasicInfoScreen';
import LocationConfirmScreen from './src/screens/LocationConfirmScreen';
import ProfessionalDetailsScreen from './src/screens/ProfessionalDetailsScreen';
import ServiceCategoryScreen from './src/screens/ServiceCategoryScreen';
import ServiceSelectionScreen from './src/screens/ServiceSelectionScreen';
import WorkingHoursScreen from './src/screens/WorkingHoursScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import RegistrationSuccessScreen from './src/screens/RegistrationSuccessScreen';

// ─── Profile & Config-Driven Screens ──────────────────────────────────────────
import ProfileScreen from './src/screens/ProfileScreen';
import BankDetailsScreen from './src/screens/BankDetailsScreen';
import SocialFollowScreen from './src/screens/SocialFollowScreen';
import FacilitiesScreen from './src/screens/FacilitiesScreen';
import StylistManagementScreen from './src/screens/StylistManagementScreen';

// ─── Salon Owner Onboarding ───────────────────────────────────────────────────
import SalonCategoryScreen from './src/screens/SalonCategoryScreen';
import SalonBasicInfoScreen from './src/screens/SalonBasicInfoScreen';
import SalonAddressScreen from './src/screens/SalonAddressScreen';
import SalonWorkingHoursScreen from './src/screens/SalonWorkingHoursScreen';
import SalonServiceSetupScreen from './src/screens/SalonServiceSetupScreen';
import SalonCoverUploadScreen from './src/screens/SalonCoverUploadScreen';
import SalonRegistrationSuccessScreen from './src/screens/SalonRegistrationSuccessScreen';
import EditServiceScreen from './src/screens/EditServiceScreen';

// ─── Booking Flow ─────────────────────────────────────────────────────────────
import AddBookingScreen from './src/screens/AddBookingScreen';
import AddNewClientScreen from './src/screens/AddNewClientScreen';
import AddingServicesScreen from './src/screens/AddingServicesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" translucent backgroundColor="transparent" />
      <OnboardingProvider>
        <NavigationContainer
          onUnhandledAction={(action) => {
            console.warn('Unhandled navigation action:', action);
            const routeName = action.payload?.name || 'requested feature';
            Alert.alert(
              'Under Construction',
              `The ${routeName} is currently being updated. Please try again later or contact support if the issue persists.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              headerTransparent: true,
              contentStyle: { backgroundColor: 'transparent' }
            }}
            initialRouteName="Splash"
          >

            {/* Auth */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />

            {/* Shared */}
            <Stack.Screen name="WorkPreference" component={WorkPreferenceScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="SubscriptionPayment" component={SubscriptionPaymentScreen} />

            {/* Freelancer Flow */}
            <Stack.Screen name="ServiceAgreement" component={ServiceAgreementScreen} />
            <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
            <Stack.Screen name="LocationConfirm" component={LocationConfirmScreen} />
            <Stack.Screen name="ProfessionalDetails" component={ProfessionalDetailsScreen} />
            <Stack.Screen name="ServiceCategory" component={ServiceCategoryScreen} />
            <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
            <Stack.Screen name="WorkingHours" component={WorkingHoursScreen} />
            <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
            <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />

            {/* Profile (Shared) */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
            <Stack.Screen name="SocialFollow" component={SocialFollowScreen} />
            <Stack.Screen name="Facilities" component={FacilitiesScreen} />
            <Stack.Screen name="StylistManagement" component={StylistManagementScreen} />

            {/* Salon Owner Flow */}
            <Stack.Screen name="SalonCategory" component={SalonCategoryScreen} />
            <Stack.Screen name="SalonBasicInfo" component={SalonBasicInfoScreen} />
            <Stack.Screen name="SalonAddress" component={SalonAddressScreen} />
            <Stack.Screen name="SalonWorkingHours" component={SalonWorkingHoursScreen} />
            <Stack.Screen name="SalonServiceSetup" component={SalonServiceSetupScreen} />
            <Stack.Screen name="SalonCoverUpload" component={SalonCoverUploadScreen} />
            <Stack.Screen name="SalonRegistrationSuccess" component={SalonRegistrationSuccessScreen} />
            <Stack.Screen name="EditService" component={EditServiceScreen} />

            {/* Booking Flow */}
            <Stack.Screen name="AddBooking" component={AddBookingScreen} />
            <Stack.Screen name="AddNewClient" component={AddNewClientScreen} />
            <Stack.Screen name="AddingServices" component={AddingServicesScreen} />

          </Stack.Navigator>
        </NavigationContainer>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
