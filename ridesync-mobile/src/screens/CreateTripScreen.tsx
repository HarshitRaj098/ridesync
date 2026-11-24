import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { TRIP } from '../data/mockData';
import { useAppDispatch } from '../hooks/useAppStore';
import { createTrip } from '../store/slices/tripSlice';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/** Screen 4 — Create Trip. */
export function CreateTripScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const [name, setName] = useState<string>(TRIP.name);
  const [destination, setDestination] = useState<string>('Manali, Himachal Pradesh');
  const [date, setDate] = useState<string>(TRIP.date);
  const [time, setTime] = useState<string>(TRIP.startTime);
  const [type, setType] = useState<'Public' | 'Private'>('Public');
  const [riders, setRiders] = useState(12);

  function submit() {
    if (!name.trim() || !destination.trim()) {
      Alert.alert('Missing details', 'Give the trip a name and a destination.');
      return;
    }
    dispatch(createTrip({ name }));
    Alert.alert('Trip created', `${name} — invite code ${TRIP.code}. Riders can scan the QR or use the code to join.`, [
      { text: 'Open Lobby', onPress: () => navigation.navigate('TripLobby') },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Create Trip" showBack />
      <View style={styles.form}>
        <InputField label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Manali Mountain Convoy" autoCapitalize="words" />
        <InputField label="Destination" value={destination} onChangeText={setDestination} placeholder="Search destination…" autoCapitalize="words" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <InputField label="Date" value={date} onChangeText={setDate} placeholder="2026-07-25" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Start Time" value={time} onChangeText={setTime} placeholder="06:00" />
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

        <View style={styles.qrBox}>
          <View style={styles.qrGraphic}>
            <Text style={{ fontSize: 28 }}>▦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.qrTitle}>Invite QR generated</Text>
            <Text style={styles.qrText}>Riders can scan to join instantly. Code: {TRIP.code}</Text>
          </View>
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
  qrBox: { flexDirection: 'row', gap: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 18, padding: 20, marginBottom: 18, alignItems: 'center' },
  qrGraphic: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  qrTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 3 },
  qrText: { color: colors.textDim, fontSize: 11.5, lineHeight: 16 },
});
