import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { MEMBERS, TRIP } from '../data/mockData';
import { MemberCard } from '../components/MemberCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/** Screen 6 — Trip Lobby (pre-ride waiting room). */
export function TripLobbyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const online = MEMBERS.filter((m) => m.status === 'online').length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Trip Lobby" showBack />
      <View style={styles.card}>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>Starts in {TRIP.startsInMinutes} min</Text>
        </View>
        <Text style={styles.title}>{TRIP.name}</Text>
        <Text style={styles.route}>
          {TRIP.origin} → {TRIP.destination} · {TRIP.distanceKm} km
        </Text>
        <Text style={styles.meta}>
          {TRIP.date} · {TRIP.startTime} · {TRIP.type} · Code {TRIP.code}
        </Text>
        <Text style={styles.meta}>
          {online} of {TRIP.riderCount} riders online · Leader: Rohit Verma
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Riders in Lobby</Text>
      <View style={styles.list}>
        {MEMBERS.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
        <Text style={styles.more}>+ 7 more riders have joined (mock)</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="▶ Start Ride — Go Live" onPress={() => navigation.navigate('ConvoyDashboard')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="Share Invite Link" onPress={() => Alert.alert('Invite link', TRIP.inviteLink)} />
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
  more: { color: colors.textFaint, fontSize: 12, marginTop: 12 },
  actions: { paddingHorizontal: 20, marginTop: 22 },
});
