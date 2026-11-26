import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { endTrip } from '../store/slices/tripSlice';
import { resetRide, sendChat } from '../store/slices/membersSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import type { RootStackParamList } from '../navigation/types';

/**
 * Screen 8 — Leader Dashboard. No seeded trip, riders or health score:
 * with no trip it says so; with a trip, health and average speed stay
 * "—" until a real ride produces them. Regroup, broadcast and end trip
 * act on the real trip on this device (chat + notifications), and only
 * the trip's leader sees the controls.
 */
export function LeaderDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const trip = useAppSelector((s) => s.trip.currentTrip);
  const user = useAppSelector((s) => s.auth.user);
  const members = useAppSelector((s) => s.members.members);
  const lifetime = useAppSelector((s) => s.trip.lifetime);
  const [broadcastText, setBroadcastText] = useState('');

  const isLeader = !!trip && !!user && trip.leaderName === user.name;

  if (!trip) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="Leader Dashboard" showBack />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trip to lead</Text>
          <Text style={styles.emptyText}>
            There is no trip on this device yet. Create a trip and you become its leader.
          </Text>
          <View style={{ height: 12 }} />
          <PrimaryButton title="Create a Trip" onPress={() => navigation.navigate('CreateTrip')} />
        </View>
      </ScrollView>
    );
  }

  const cards = [
    { label: 'Ride Health', value: '—', color: colors.textDim },
    { label: 'Riders Here', value: String(members.length + 1), color: colors.cyan },
    { label: 'Avg Speed', value: '—', color: colors.text },
    { label: 'Stopped', value: '0', color: colors.warning },
    { label: 'Offline', value: '0', color: colors.textDim },
    { label: 'Separated', value: '0', color: colors.danger },
  ];

  function handleRegroup() {
    if (!user) return;
    dispatch(
      sendChat({
        text: 'Regroup at the next stop — please slow down and regroup.',
        author: user.name,
        initials: user.initials,
        isLeader: true,
      }),
    );
    dispatch(
      addNotification({
        id: `n-${Date.now()}`,
        title: 'Regroup requested',
        body: `${user.name} asked the convoy to regroup at the next stop.`,
        time: 'just now',
        unread: true,
        kind: 'info',
      }),
    );
    Alert.alert('Regroup requested', 'Added to the convoy chat on this device.');
  }

  function handleBroadcast() {
    if (!user) return;
    const text = broadcastText.trim();
    if (!text) {
      Alert.alert('Nothing to send', 'Type a broadcast message first.');
      return;
    }
    dispatch(sendChat({ text, author: user.name, initials: user.initials, isLeader: true }));
    dispatch(
      addNotification({
        id: `n-${Date.now()}`,
        title: `Broadcast from ${user.name}`,
        body: text,
        time: 'just now',
        unread: true,
        kind: 'info',
      }),
    );
    setBroadcastText('');
    Alert.alert('Broadcast sent', 'Added to the convoy chat on this device.');
  }

  function handleEndTrip() {
    if (!trip) return;
    const tripName = trip.name;
    Alert.alert('End trip?', 'This ends the trip on this device and records one completed ride.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        onPress: () => {
          dispatch(endTrip());
          dispatch(resetRide());
          dispatch(
            addNotification({
              id: `n-${Date.now()}`,
              title: 'Trip ended',
              body: `${tripName} ended. One ride recorded on this device.`,
              time: 'just now',
              unread: true,
              kind: 'info',
            }),
          );
          Alert.alert('Trip ended', 'One ride recorded on this device.');
          navigation.navigate('Main');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Leader Dashboard" showBack />
      <View style={styles.sub}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <Text style={styles.tripMeta}>
          {trip.origin} → {trip.destination}
          {trip.distanceKm !== null ? ` · ${trip.distanceKm} km` : ' · distance not estimated yet'} · Leader: {trip.leaderName}
        </Text>
        <Text style={styles.tripMeta}>
          {trip.date} · {trip.startTime} · Code {trip.code}
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

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          {members.length === 0
            ? 'You are the only rider in this convoy so far — share the invite link to add riders. Ride health and average speed appear once a real ride is under way.'
            : `${members.length} other rider(s) in this convoy.`}
        </Text>
      </View>

      {isLeader ? (
        <View style={styles.actions}>
          <PrimaryButton title="↻  Regroup at Next Stop" onPress={handleRegroup} />
          <View style={{ height: 14 }} />
          <TextInput
            style={styles.broadcastInput}
            value={broadcastText}
            onChangeText={setBroadcastText}
            placeholder="Broadcast a message to the convoy…"
            placeholderTextColor={colors.textFaint}
          />
          <View style={{ height: 10 }} />
          <SecondaryButton title="📣  Send Broadcast" onPress={handleBroadcast} />
          <View style={{ height: 10 }} />
          <SecondaryButton title="■  End Trip" onPress={handleEndTrip} />
        </View>
      ) : (
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>
            Read-only view — {trip.leaderName} leads this trip. Leader controls (regroup, broadcast, end trip) are
            only for the leader.
          </Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Analytics</Text>
      <View style={styles.analytics}>
        <Text style={styles.analyticsRow}>Total rides led: {lifetime.rides}</Text>
        <Text style={styles.analyticsRow}>Distance logged: {lifetime.km.toLocaleString('en-IN')} km</Text>
        <Text style={styles.analyticsRow}>Safety score: —</Text>
        <Text style={styles.analyticsRow}>Ride health now: — (appears once a real ride is under way)</Text>
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
  noteBox: { marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  noteText: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 20 },
  broadcastInput: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 13 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  analytics: { marginHorizontal: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8 },
  analyticsRow: { color: colors.textDim, fontSize: 13 },
  empty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, marginHorizontal: 20, marginTop: 8 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyText: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 6 },
  readOnly: { marginHorizontal: 20, marginTop: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  readOnlyText: { color: colors.textDim, fontSize: 12.5, lineHeight: 18 },
});
