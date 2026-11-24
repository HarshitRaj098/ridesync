import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { RIDER_STATS, TRIP } from '../data/mockData';
import { TripCard } from '../components/TripCard';
import type { RootStackParamList } from '../navigation/types';

/** Screen 3 — Home Dashboard. */
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const quickActions = [
    { label: 'Create Trip', icon: '+', route: 'CreateTrip' as const },
    { label: 'Join Trip', icon: '👥', route: 'JoinTrip' as const },
    { label: 'My Trips', icon: '🗺', route: 'TripLobby' as const },
    { label: 'Leader', icon: '⭐', route: 'LeaderDashboard' as const },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Convoy Mode</Text>
        <Text style={styles.heroTitle}>Ride Together.{'\n'}Never Get Lost.</Text>
        <Text style={styles.heroText}>Live tracking, group voice and one-tap SOS for your whole crew.</Text>
      </View>

      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.qaGrid}>
        {quickActions.map((a) => (
          <Pressable key={a.label} style={styles.qaItem} onPress={() => navigation.navigate(a.route)}>
            <Text style={styles.qaIcon}>{a.icon}</Text>
            <Text style={styles.qaLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Upcoming Trip</Text>
        <Pressable onPress={() => navigation.navigate('TripLobby')}>
          <Text style={styles.link}>View lobby</Text>
        </Pressable>
      </View>
      <TripCard onPress={() => navigation.navigate('TripLobby')} />

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{RIDER_STATS.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{RIDER_STATS.kmLogged.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>KM Logged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{RIDER_STATS.safetyScore}%</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      <Pressable style={styles.rideBtn} onPress={() => navigation.navigate('ConvoyDashboard')}>
        <Text style={styles.rideBtnText}>▶ Start Live Convoy — {TRIP.name}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { margin: 20, marginBottom: 8, padding: 24, borderRadius: 26, backgroundColor: '#0E1830', borderWidth: 1, borderColor: colors.borderStrong },
  eyebrow: { color: colors.cyan, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500' },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 30, marginTop: 8 },
  heroText: { color: colors.textDim, fontSize: 13, marginTop: 6 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingRight: 20 },
  link: { color: colors.cyan, fontSize: 12, fontWeight: '600' },
  qaGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  qaItem: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 8 },
  qaIcon: { fontSize: 18 },
  qaLabel: { color: colors.textDim, fontSize: 10.5, fontWeight: '500', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  rideBtn: { margin: 20, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  rideBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
