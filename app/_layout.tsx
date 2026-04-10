import 'expo-dev-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '../src/providers/app-provider';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </AppProvider>
  );
}
