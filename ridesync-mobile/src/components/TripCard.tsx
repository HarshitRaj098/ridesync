import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { TRIP } from '../data/mockData';

export function TripCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>Starts in {TRIP.startsInMinutes} min</Text>
        </View>
      </View>
      <Text style={styles.title}>{TRIP.name}</Text>
      <Text style={styles.route}>
        {TRIP.origin} → {TRIP.destination} · {TRIP.distanceKm} km
      </Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{TRIP.riderCount}</Text>
          <Text style={styles.statLabel}>Riders</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{TRIP.vehicleCount}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{TRIP.type}</Text>
          <Text style={styles.statLabel}>Type</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 18, padding: 18, marginHorizontal: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  pillText: { color: colors.success, fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  route: { color: colors.textDim, fontSize: 12.5, marginTop: 4 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
