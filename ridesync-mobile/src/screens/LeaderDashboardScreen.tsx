import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { MEMBERS, RIDER_STATS, TRIP } from '../data/mockData';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';

/** Screen 8 — Leader Dashboard (ride health, regroup, broadcast, end trip, analytics). */
export function LeaderDashboardScreen() {
  const online = MEMBERS.filter((m) => m.status === 'online').length;
  const stopped = MEMBERS.filter((m) => m.status === 'stopped').length;
  const offline = MEMBERS.filter((m) => m.status === 'offline').length;
  const separated = 1; // Puneet stopped at the fuel station, 2 min behind (mock)
  const avgSpeed = Math.round(
    MEMBERS.filter((m) => m.speedKmh !== null).reduce((sum, m) => sum + (m.speedKmh ?? 0), 0) /
      MEMBERS.filter((m) => m.speedKmh !== null).length,
  );
  const healthScore = 92;

  const cards = [
    { label: 'Ride Health', value: `${healthScore}%`, color: colors.success },
    { label: 'Online Riders', value: `${online}/${TRIP.riderCount}`, color: colors.cyan },
    { label: 'Avg Speed', value: `${avgSpeed} km/h`, color: colors.text },
    { label: 'Stopped', value: String(stopped), color: colors.warning },
    { label: 'Offline', value: String(offline), color: colors.textDim },
    { label: 'Separated', value: String(separated), color: colors.danger },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Leader Dashboard" showBack />
      <View style={styles.sub}>
        <Text style={styles.tripName}>{TRIP.name}</Text>
        <Text style={styles.tripMeta}>
          {TRIP.origin} → {TRIP.destination} · {TRIP.distanceKm} km · Leader: Rohit Verma
        </Text>
      </View>

      <View style={styles.grid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.card}>
            <Text style={[styles.value, { color: c.color }]}>{c.value}</Text>
            <Text style={styles.label}>{c.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠ 1 rider separated</Text>
        <Text style={styles.warningText}>Puneet Sharma stopped at a fuel station near KM 214, 2 min behind the convoy.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="↻  Regroup at Next Stop" onPress={() => Alert.alert('Regroup sent', 'All riders were asked to regroup at the dhaba in 5 km (mock broadcast).')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="📣  Broadcast Message" onPress={() => Alert.alert('Broadcast', 'Broadcast composer — message goes to all 12 riders (mock).')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="■  End Trip" onPress={() => Alert.alert('End trip?', 'Ending the trip closes the convoy for all riders. (Mock — no trip was ended.)')} />
      </View>

      <Text style={styles.sectionLabel}>Analytics (mock)</Text>
      <View style={styles.analytics}>
        <Text style={styles.analyticsRow}>Total rides led: {RIDER_STATS.totalRides}</Text>
        <Text style={styles.analyticsRow}>Distance logged: {RIDER_STATS.kmLogged.toLocaleString('en-IN')} km</Text>
        <Text style={styles.analyticsRow}>Safety score: {RIDER_STATS.safetyScore}%</Text>
        <Text style={styles.analyticsRow}>Ride health now: {healthScore}% — dips when a rider stops or goes offline.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sub: { paddingHorizontal: 20, marginBottom: 16 },
  tripName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  tripMeta: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  card: { width: '31%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '700' },
  label: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4, textAlign: 'center' },
  warningBox: { marginHorizontal: 20, marginTop: 16, backgroundColor: 'rgba(245,158,11,0.07)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', borderRadius: 12, padding: 14 },
  warningTitle: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  warningText: { color: colors.textDim, fontSize: 12, marginTop: 4, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 20 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  analytics: { marginHorizontal: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8 },
  analyticsRow: { color: colors.textDim, fontSize: 13 },
});
