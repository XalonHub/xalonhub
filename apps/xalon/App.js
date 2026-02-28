import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
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
      <BookingProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </BookingProvider>
    </AuthProvider>
  );
}
