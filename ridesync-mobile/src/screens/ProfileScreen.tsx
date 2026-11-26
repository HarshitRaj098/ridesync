import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { signOut } from '../store/slices/authSlice';
import { SecondaryButton } from '../components/SecondaryButton';
import { AppHeader } from '../components/AppHeader';

/** Screen 10 — Profile. The signed-in user is whoever signed in on this device; stats are real local totals (0 until a ride is completed). */
export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const lifetime = useAppSelector((s) => s.trip.lifetime);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Profile" />
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.initials ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Rider'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lifetime.rides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lifetime.km.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>KM Logged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <SecondaryButton title="Edit Profile" onPress={() => Alert.alert('Edit profile', 'Profile editing arrives with the real backend.')} />
        <View style={{ height: 10 }} />
        <SecondaryButton
          title="Ride History"
          onPress={() =>
            Alert.alert(
              'Ride history',
              lifetime.rides === 0
                ? 'No rides completed yet on this device. Complete a trip and it will be recorded here.'
                : `${lifetime.rides} ride(s) completed on this device · ${lifetime.km.toLocaleString('en-IN')} km logged. Full history arrives with the real backend.`,
            )
          }
        />
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
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  actions: { paddingHorizontal: 20, marginTop: 24 },
});
