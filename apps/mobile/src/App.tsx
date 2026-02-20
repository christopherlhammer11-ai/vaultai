import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { VaultSessionProvider, useVaultSession } from '@mobile/providers/VaultSessionProvider';
import ChatScreen from '@mobile/screens/ChatScreen';
import UnlockScreen from '@mobile/screens/UnlockScreen';
import VaultCreationScreen from '@mobile/screens/VaultCreationScreen';
import PasswordSetupScreen from '@mobile/screens/PasswordSetupScreen';
import WelcomeScreen from '@mobile/screens/WelcomeScreen';
import PersonaSelectionScreen from '@mobile/screens/PersonaSelectionScreen';
import FirstChatTutorialScreen from '@mobile/screens/FirstChatTutorialScreen';
import { palette } from '@mobile/theme/colors';

enableScreens(true);
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    primary: palette.primary,
    text: palette.textPrimary,
    border: palette.border,
    notification: palette.primary,
  },
};

function Navigator() {
  const { status } = useVaultSession();
  const isUnlocked = status === 'ready';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isUnlocked ? (
        <Stack.Screen name="Chat" component={ChatScreen} />
      ) : (
        <Stack.Screen name="Unlock" component={UnlockScreen} />
      )}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="VaultCreation" component={VaultCreationScreen} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
      <Stack.Screen name="PersonaSelection" component={PersonaSelectionScreen} />
      <Stack.Screen name="FirstChatTutorial" component={FirstChatTutorialScreen} />
    </Stack.Navigator>
  );
}

export default function RootApp() {
  return (
    <VaultSessionProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Navigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </VaultSessionProvider>
  );
}