import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useUserProfile } from '../hooks/use-user-profile';
import { useAuthStore } from '../store/auth-store';
import { colors } from '../theme/colors';
import { ArtworkImage } from './artwork-image';

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
};

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
};

export function AppHeader({ eyebrow, title, subtitle, actions = [] }: AppHeaderProps) {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = authStatus === 'authenticated';
  const { data: profile } = useUserProfile();
  const displayName = profile?.displayName || profile?.artistStageName || profile?.name || user?.name || 'Guest';

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.identity}
          onPress={() => router.push(isAuthenticated ? ('/more' as never) : ('/sign-in' as never))}
        >
          <ArtworkImage uri={profile?.avatarUrl} palette={['#402010', '#d73569']} style={styles.avatar} />
          <View style={styles.identityCopy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.meta}>{isAuthenticated ? displayName : 'Sign in for your personal music space'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={`${action.icon}-${action.accessibilityLabel}`}
              accessibilityLabel={action.accessibilityLabel}
              activeOpacity={0.85}
              onPress={action.onPress}
              style={styles.actionButton}
            >
              <Ionicons name={action.icon} size={18} color={colors.text} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
