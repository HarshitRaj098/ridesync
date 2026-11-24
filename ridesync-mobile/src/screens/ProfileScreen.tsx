import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fetchProfile } from '../services/mockServices';
import { useAppDispatch } from '../hooks/useAppStore';
import { signOut } from '../store/slices/authSlice';
import { SecondaryButton } from '../components/SecondaryButton';
import { AppHeader } from '../components/AppHeader';

/** Screen 10 — Profile (data via React Query, mock fetchProfile). */
export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Profile" />
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{data?.initials ?? 'SK'}</Text>
        </View>
        <Text style={styles.name}>{isLoading ? 'Loading…' : data?.name}</Text>
        <Text style={styles.email}>{data?.email ?? ''}</Text>
        <Text style={styles.bike}>{data?.bike ?? ''}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.totalRides ?? '—'}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data ? data.kmLogged.toLocaleString('en-IN') : '—'}</Text>
          <Text style={styles.statLabel}>KM Logged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data ? `${data.safetyScore}%` : '—'}</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <SecondaryButton title="Edit Profile" onPress={() => Alert.alert('Edit profile', 'Profile editing arrives with the real backend.')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="Ride History" onPress={() => Alert.alert('Ride history', '47 rides · 3,140 km logged (mock). Full history arrives with the real backend.')} />
        <View style={{ height: 10 }} />
        <SecondaryButton title="Sign Out" onPress={() => dispatch(signOut())} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cyan, fontSize: 26, fontWeight: '700' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 12 },
  email: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  bike: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  actions: { paddingHorizontal: 20, marginTop: 24 },
});
