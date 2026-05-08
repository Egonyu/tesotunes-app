import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ArtworkImage } from '../../src/components/artwork-image';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useEventDetail, useEventWaitlist } from '../../src/hooks/use-event-detail';
import { usePublicEvents } from '../../src/hooks/use-public-events';
import { useAuthStore } from '../../src/store/auth-store';
import { colors } from '../../src/theme/colors';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: allEvents } = usePublicEvents();
  const fallback = allEvents?.find((e) => e.id === id);
  const { data: event, isLoading } = useEventDetail(id ?? '', fallback);
  const waitlist = useEventWaitlist(id ?? '');
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const [registered, setRegistered] = useState(false);

  async function handleWaitlist() {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    await waitlist.mutateAsync();
    setRegistered(true);
  }

  if (isLoading && !event) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!event) {
    return (
      <Screen>
        <StateMessage
          title="Event not found"
          body="This event may have ended or been removed."
          actionLabel="Back to events"
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[event.palette[0], event.palette[1], '#090909']} style={styles.hero}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backLabel}>Events</Text>
        </TouchableOpacity>

        {event.imageUrl ? (
          <ArtworkImage uri={event.imageUrl} palette={event.palette} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="calendar" size={56} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeLabel}>{event.dateLabel}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.venue}>{event.venue}</Text>
        <Text style={styles.city}>{event.city}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {event.category ? (
          <View style={styles.chip}>
            <Ionicons name="musical-notes-outline" size={13} color={colors.accent} />
            <Text style={styles.chipLabel}>{event.category}</Text>
          </View>
        ) : null}

        {event.price ? (
          <View style={styles.infoRow}>
            <Ionicons name="ticket-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Entry: <Text style={styles.infoValue}>{event.price}</Text></Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoLabel}>{event.venue}, {event.city}</Text>
        </View>

        {event.description ? (
          <View style={styles.descriptionBlock}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {registered ? (
            <View style={styles.registeredBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={styles.registeredLabel}>You're on the waitlist</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, waitlist.isPending && styles.buttonDisabled]}
              onPress={() => void handleWaitlist()}
              disabled={waitlist.isPending}
              activeOpacity={0.88}
            >
              {waitlist.isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={18} color={colors.background} />
                  <Text style={styles.primaryButtonLabel}>Register Interest</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {event.ticketUrl ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => void Linking.openURL(event.ticketUrl!)}
              activeOpacity={0.88}
            >
              <Ionicons name="open-outline" size={16} color={colors.accent} />
              <Text style={styles.secondaryButtonLabel}>Get Tickets</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {waitlist.error ? (
          <Text style={styles.error}>{waitlist.error instanceof Error ? waitlist.error.message : 'Failed to register. Try again.'}</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    marginTop: 8,
  },
  bannerPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dateBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateBadgeLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  venue: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  city: {
    color: colors.textSubtle,
    fontSize: 13,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    gap: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(30,215,96,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontWeight: '700',
  },
  descriptionBlock: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 13,
  },
  secondaryButtonLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(30,215,96,0.1)',
    borderRadius: 999,
    paddingVertical: 15,
  },
  registeredLabel: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
