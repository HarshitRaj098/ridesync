import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { buildInviteLink, generateTripCode } from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { createTrip } from '../store/slices/tripSlice';
import { resetRide } from '../store/slices/membersSlice';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/**
 * Screen 4 — Create Trip. Blank form: no seeded name, place or date.
 * The invite code is generated once when the form opens and the invite
 * link is real — both belong to the trip the user is about to create.
 * There is no QR code in the mobile app yet (no scanner, no QR library),
 * so none is shown or claimed.
 */
export function CreateTripScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'Public' | 'Private'>('Public');
  const [riders, setRiders] = useState(2);
  const [code] = useState(() => generateTripCode());
  const inviteLink = buildInviteLink(code);

  function submit() {
    if (!name.trim() || !origin.trim() || !destination.trim() || !date.trim() || !time.trim()) {
      Alert.alert('Missing details', 'Fill in the trip name, from, destination, date and start time.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || !/^\d{2}:\d{2}$/.test(time.trim())) {
      Alert.alert('Check the date and time', 'Use YYYY-MM-DD for the date and HH:MM (24h) for the start time.');
      return;
    }
    dispatch(
      createTrip({
        name,
        origin,
        destination,
        date,
        startTime: time,
        type,
        riderLimit: riders,
        code,
        leaderName: user?.name ?? 'You',
      }),
    );
    dispatch(resetRide());
    Alert.alert('Trip created', `${name.trim()} — invite code ${code}. Share the link below so riders can join.`, [
      { text: 'Open Lobby', onPress: () => navigation.navigate('TripLobby') },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Create Trip" showBack />
      <View style={styles.form}>
        <InputField label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Weekend Mountain Ride" autoCapitalize="words" />
        <InputField label="From" value={origin} onChangeText={setOrigin} placeholder="Starting city" autoCapitalize="words" />
        <InputField label="Destination" value={destination} onChangeText={setDestination} placeholder="Where are you riding to?" autoCapitalize="words" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <InputField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Start Time" value={time} onChangeText={setTime} placeholder="HH:MM" />
          </View>
        </View>

        <Text style={styles.label}>Trip Type</Text>
        <View style={styles.segGroup}>
          {(['Public', 'Private'] as const).map((t) => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.seg, type === t && styles.segSelected]}>
              <Text style={[styles.segText, type === t && styles.segTextSelected]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Maximum Riders</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setRiders((r) => Math.max(2, r - 1))} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{riders}</Text>
          <Pressable onPress={() => setRiders((r) => Math.min(50, r + 1))} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.inviteBox}>
          <Text style={styles.inviteTitle}>Invite code: {code}</Text>
          <Text style={styles.inviteText}>{inviteLink}</Text>
          <Text style={styles.inviteText}>Share this code or link — riders join with it. The trip lives on this device for this session.</Text>
        </View>

        <PrimaryButton title="Create Trip" onPress={submit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 20 },
  row2: { flexDirection: 'row', gap: 12 },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  segGroup: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  seg: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  segSelected: { borderColor: colors.cyan, backgroundColor: 'rgba(0,194,255,0.10)' },
  segText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  segTextSelected: { color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 16 },
  stepBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  stepValue: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 16, fontWeight: '700' },
  inviteBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 18, padding: 20, marginBottom: 18 },
  inviteTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  inviteText: { color: colors.textDim, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
});
