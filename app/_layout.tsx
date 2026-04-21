import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppMenu } from '../src/components/app-menu';
import { AppProvider } from '../src/providers/app-provider';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
        <AppMenu />
      </View>
    </AppProvider>
  );
}
