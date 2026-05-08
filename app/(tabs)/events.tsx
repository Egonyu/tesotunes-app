import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EventCard, SectionHeader } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { usePublicEvents } from '../../src/hooks/use-public-events';
import { colors } from '../../src/theme/colors';

export default function EventsScreen() {
  const { data: events = [], isLoading } = usePublicEvents();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Discover live sessions, tours, and curated fan experiences.</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title={isLoading ? 'Loading events' : 'Upcoming near you'} action="View all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onPress={() => router.push(`/events/${event.id}` as never)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.list}>
        <SectionHeader title="This month" />
        {events.map((event) => (
          <TouchableOpacity key={event.id} style={styles.listRow} activeOpacity={0.82} onPress={() => router.push(`/events/${event.id}` as never)}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateMonth}>{event.dateLabel.split(',')[0]}</Text>
              <Text style={styles.dateDay}>{event.dateLabel.split(' ').at(-1)}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSubtitle}>
                {event.venue} • {event.city}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 16,
  },
  rail: {
    gap: 16,
    paddingRight: 16,
  },
  list: {
    gap: 14,
  },
  listRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  dateBadge: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  dateDay: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  eventSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
