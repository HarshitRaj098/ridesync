import React from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { buildInviteText, startsInLabel } from '../data/mockData';
import { useAppSelector } from '../hooks/useAppStore';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/**
 * Screen 6 — Trip Lobby (pre-ride waiting room). Shows the real trip on
 * this device, or "Trip not found" when there is none. The rider list is
 * empty until someone joins on this device — no seeded riders.
 */
export function TripLobbyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const trip = useAppSelector((s) => s.trip.currentTrip);
  const user = useAppSelector((s) => s.auth.user);

  async function shareInvite() {
    if (!trip) return;
    try {
      await Share.share({ message: buildInviteText(trip) });
    } catch {
      Alert.alert('Share failed', 'The invite could not be shared. Try again.');
    }
  }

  if (!trip) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="Trip Lobby" showBack />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Trip not found</Text>
          <Text style={styles.emptyText}>
            There is no trip on this device yet. Create a trip or join one with an invite code.
          </Text>
          <View style={{ height: 12 }} />
          <PrimaryButton title="Create a Trip" onPress={() => navigation.navigate('CreateTrip')} />
          <View style={{ height: 10 }} />
          <SecondaryButton title="Join a Trip" onPress={() => navigation.navigate('JoinTrip')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Trip Lobby" showBack />
      <View style={styles.card}>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>{startsInLabel(trip)}</Text>
        </View>
        <Text style={styles.title}>{trip.name}</Text>
        <Text style={styles.route}>
          {trip.origin} → {trip.destination}
          {trip.distanceKm !== null ? ` · ${trip.distanceKm} km` : ' · distance not estimated yet'}
        </Text>
        <Text style={styles.meta}>
          {trip.date} · {trip.startTime} · {trip.type} · Code {trip.code}
        </Text>
        <Text style={styles.meta}>Leader: {trip.leaderName}</Text>
      </View>

      <Text style={styles.sectionLabel}>Riders in Lobby</Text>
      <View style={styles.list}>
        <Text style={styles.youRow}>
          {user?.name ?? 'You'} (You{ trip.leaderName === user?.name ? ' · Leader' : ''})
        </Text>
        <Text style={styles.more}>
          No other riders here yet — share the invite link and riders will appear here when they join on this device.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="▶ Start Ride — Go Live" onPress={() => navigation.navigate('ConvoyDashboard')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="Share Invite Link" onPress={shareInvite} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, padding: 18, marginHorizontal: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  pillText: { color: colors.success, fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  route: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  meta: { color: colors.textFaint, fontSize: 12, marginTop: 6 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  list: { paddingHorizontal: 20 },
  youRow: { color: colors.text, fontSize: 13.5, fontWeight: '600', paddingVertical: 6 },
  more: { color: colors.textFaint, fontSize: 12, marginTop: 12, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 22 },
  empty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, marginHorizontal: 20, marginTop: 8 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyText: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
