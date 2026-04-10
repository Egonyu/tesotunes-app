import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { MiniPlayer } from '../../src/components/mini-player';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSubtle,
          tabBarStyle: {
            backgroundColor: '#080808',
            borderTopColor: '#111111',
            height: 88,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              index: focused ? 'home' : 'home-outline',
              search: focused ? 'search' : 'search-outline',
              library: focused ? 'library' : 'library-outline',
              events: focused ? 'calendar' : 'calendar-outline',
            };

            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      />
      <MiniPlayer />
    </>
  );
}
