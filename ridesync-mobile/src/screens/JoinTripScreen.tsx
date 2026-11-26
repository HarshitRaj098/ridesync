import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { parseInviteCode } from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { clearJoinError, joinTrip } from '../store/slices/tripSlice';
import { resetRide } from '../store/slices/membersSlice';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/**
 * Screen 5 — Join Trip (code / invite link). No seeded nearby trips:
 * trips live only on the device where they were created, so joining
 * only works for this device's trip. Blank / wrong codes are rejected
 * inline, never with a silent join.
 */
export function JoinTripScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const joinError = useAppSelector((s) => s.trip.joinError);
  const joined = useAppSelector((s) => s.trip.joined);
  const currentTrip = useAppSelector((s) => s.trip.currentTrip);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const error = localError ?? joinError;

  function submit() {
    const raw = code.trim() || link.trim();
    const parsed = parseInviteCode(raw);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError(null);
    dispatch(clearJoinError());
    dispatch(joinTrip({ code: parsed.code }));
    // joinTrip sets joinError in the store when the code does not match
    // this device's trip; success is read from the store below.
    if (currentTrip && currentTrip.code === parsed.code) {
      dispatch(resetRide());
      Alert.alert('Joined!', `You joined ${currentTrip.name}.`, [{ text: 'Open Lobby', onPress: () => navigation.navigate('TripLobby') }]);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Join Trip" showBack />
      <View style={styles.form}>
        <InputField label="Enter Trip Code" value={code} onChangeText={(v) => { setCode(v.toUpperCase()); setLocalError(null); dispatch(clearJoinError()); }} placeholder="6-character code" autoCapitalize="characters" />
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or paste link</Text>
          <View style={styles.line} />
        </View>
        <InputField label="Invite Link" value={link} onChangeText={(v) => { setLink(v); setLocalError(null); dispatch(clearJoinError()); }} placeholder="https://ridesync.app/join/…" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {joined && currentTrip ? <Text style={styles.success}>Joined {currentTrip.name}.</Text> : null}
        <PrimaryButton title="Join Trip" onPress={submit} />

        <Text style={styles.sectionLabel}>Nearby Trips</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trips nearby yet</Text>
          <Text style={styles.emptyText}>
            Trips live only on the device where they were created. Create a trip here, or join one with an invite code from your leader.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 12.5, lineHeight: 18, marginBottom: 12 },
  success: { color: colors.success, fontSize: 12.5, marginBottom: 12 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 12 },
  empty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 },
  emptyTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
  emptyText: { color: colors.textDim, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
});
