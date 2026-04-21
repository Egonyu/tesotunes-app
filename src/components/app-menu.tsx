import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from './mini-player';

type NavItem = {
  href: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
};

const MAIN_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { href: '/search', label: 'Search', activeIcon: 'search', inactiveIcon: 'search-outline' },
  { href: '/library', label: 'Library', activeIcon: 'library', inactiveIcon: 'library-outline' },
  { href: '/more', label: 'More', activeIcon: 'menu', inactiveIcon: 'menu-outline' },
];

const QUICK_ACTIONS = [
  { href: '/search', label: 'Search', icon: 'search-outline' as const },
  { href: '/charts', label: 'Charts', icon: 'stats-chart-outline' as const },
  { href: '/playlists', label: 'Playlists', icon: 'musical-notes-outline' as const },
];

const HIDDEN_PREFIXES = ['/sign-in', '/sign-up', '/verify-email', '/player'];

function matchesPath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/' || pathname === '/index';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppMenu() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [fabExpanded, setFabExpanded] = useState(false);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      {fabExpanded ? <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setFabExpanded(false)} /> : null}

      <View pointerEvents="box-none" style={styles.overlay}>
        <MiniPlayer />

        <View pointerEvents="box-none" style={[styles.fabRail, { bottom: insets.bottom + 88 }]}>
          {fabExpanded
            ? QUICK_ACTIONS.map((action, index) => (
                <Pressable
                  key={action.label}
                  onPress={() => {
                    setFabExpanded(false);
                    router.push(action.href as never);
                  }}
                  style={[styles.fabAction, { marginBottom: index === QUICK_ACTIONS.length - 1 ? 0 : 10 }]}
                >
                  <View style={styles.fabActionIconWrap}>
                    <Ionicons name={action.icon} size={16} color="#d73569" />
                  </View>
                  <Text style={styles.fabActionLabel}>{action.label}</Text>
                </Pressable>
              ))
            : null}

          <Pressable onPress={() => setFabExpanded((value) => !value)} style={styles.fabButton}>
            <LinearGradient colors={['#ff4f90', '#d73569', '#f46d38']} style={styles.fabGradient}>
              <Ionicons name="add" size={20} color="#fff4f7" />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={[styles.navOuter, { bottom: Math.max(insets.bottom, 10) }]}>
          <LinearGradient colors={['rgba(10,16,28,0.98)', 'rgba(8,13,22,0.98)', 'rgba(11,12,18,0.98)']} style={styles.navShell}>
            {MAIN_ITEMS.map((item) => {
              const isFocused = matchesPath(pathname, item.href);

              return (
                <Pressable
                  key={item.href}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={() => router.push(item.href as never)}
                  style={styles.tabButton}
                >
                  <View style={[styles.iconCapsule, isFocused ? styles.iconCapsuleActive : styles.iconCapsuleIdle]}>
                    <Ionicons
                      name={isFocused ? item.activeIcon : item.inactiveIcon}
                      size={16}
                      color={isFocused ? '#d73569' : 'rgba(229,231,235,0.78)'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelIdle]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </LinearGradient>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  fabRail: {
    position: 'absolute',
    left: 16,
    alignItems: 'flex-start',
    zIndex: 22,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#d73569',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabAction: {
    minHeight: 42,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 14,
    backgroundColor: 'rgba(10, 10, 10, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabActionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,53,105,0.14)',
  },
  fabActionLabel: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '700',
  },
  navOuter: {
    position: 'absolute',
    alignSelf: 'center',
    width: 268,
    zIndex: 21,
  },
  navShell: {
    minHeight: 62,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconCapsule: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCapsuleActive: {
    backgroundColor: 'rgba(215,53,105,0.18)',
    borderColor: 'rgba(215,53,105,0.22)',
  },
  iconCapsuleIdle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#f0f0f0',
  },
  tabLabelIdle: {
    color: 'rgba(210,214,220,0.62)',
  },
});
