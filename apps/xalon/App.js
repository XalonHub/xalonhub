import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, Alert, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <BookingProvider>
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
            <AppNavigator />
          </NavigationContainer>
        </BookingProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
