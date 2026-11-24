import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { NEARBY_TRIPS, TRIP } from '../data/mockData';
import { useAppDispatch } from '../hooks/useAppStore';
import { joinTrip } from '../store/slices/tripSlice';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { AppHeader } from '../components/AppHeader';
import type { RootStackParamList } from '../navigation/types';

/** Screen 5 — Join Trip (code / QR / link / nearby trips). */
export function JoinTripScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');

  function submit() {
    const clean = (code || link.split('/').pop() || '').trim().toUpperCase();
    if (!clean) {
      Alert.alert('Enter a code', 'Type the 6-character trip code, or paste an invite link.');
      return;
    }
    dispatch(joinTrip({ code: clean }));
    Alert.alert('Joined!', `You joined ${TRIP.name}.`, [{ text: 'Open Lobby', onPress: () => navigation.navigate('TripLobby') }]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Join Trip" showBack />
      <View style={styles.form}>
        <InputField label="Enter Trip Code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="A1B2C9" autoCapitalize="characters" />
        <SecondaryButton title="📷  Scan QR Code" onPress={() => Alert.alert('Scanner', 'QR scanning needs camera permission on a device — coming with the native build.')} />
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or paste link</Text>
          <View style={styles.line} />
        </View>
        <InputField label="Invite Link" value={link} onChangeText={setLink} placeholder="https://ridesync.app/join/…" />
        <PrimaryButton title="Join Trip" onPress={submit} />

        <Text style={styles.sectionLabel}>Nearby Trips</Text>
        {NEARBY_TRIPS.map((t) => (
          <View key={t.id} style={styles.nearby}>
            <View style={styles.nearbyIcon}>
              <Text>🏍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nearbyName}>{t.name}</Text>
              <Text style={styles.nearbyMeta}>
                {t.distance} · {t.riders} riders
              </Text>
            </View>
            <Pressable onPress={() => Alert.alert('Request sent', `Your join request was sent to the leader of ${t.name}.`)} style={styles.requestBtn}>
              <Text style={styles.requestText}>Request</Text>
            </Pressable>
          </View>
        ))}
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
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 12 },
  nearby: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  nearbyIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,194,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  nearbyName: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  nearbyMeta: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  requestBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, backgroundColor: 'rgba(0,123,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,123,255,0.35)' },
  requestText: { color: colors.cyan, fontSize: 11.5, fontWeight: '700' },
});
