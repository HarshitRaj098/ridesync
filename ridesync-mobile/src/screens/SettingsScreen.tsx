import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { setUnits, toggle } from '../store/slices/settingsSlice';
import { AppHeader } from '../components/AppHeader';

/** Screen 11 — Settings. */
export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);

  const rows: { key: 'darkMode' | 'notificationsEnabled' | 'locationSharing' | 'voiceEnabled'; label: string; hint: string }[] = [
    { key: 'darkMode', label: 'Dark theme', hint: 'RideSync is dark by default' },
    { key: 'notificationsEnabled', label: 'Notifications', hint: 'Trip, alert and chat notifications' },
    { key: 'locationSharing', label: 'Share live location', hint: 'Broadcast GPS to your convoy while riding' },
    { key: 'voiceEnabled', label: 'Push-to-talk voice', hint: 'Group voice channel in the convoy' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Settings" showBack />
      <View style={styles.list}>
        {rows.map((r) => (
          <View key={r.key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.hint}>{r.hint}</Text>
            </View>
            <Switch
              value={settings[r.key]}
              onValueChange={() => {
                dispatch(toggle(r.key));
              }}
              trackColor={{ false: colors.card2, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        ))}

        <Text style={styles.sectionLabel}>Units</Text>
        <View style={styles.segGroup}>
          {(['metric', 'imperial'] as const).map((u) => (
            <Pressable key={u} onPress={() => dispatch(setUnits(u))} style={[styles.seg, settings.units === u && styles.segSelected]}>
              <Text style={[styles.segText, settings.units === u && styles.segTextSelected]}>{u === 'metric' ? 'Metric (km/h)' : 'Imperial (mph)'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>RideSync · 1.0.0 (mock build)</Text>
          <Text style={styles.aboutText}>
            Smart Convoy Management Platform. All data on this build is mock/simulated — no real backend, no real
            accounts. See README.md for the maps / API-key note and how to point the app at the real Node.js backend.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  hint: { color: colors.textDim, fontSize: 11.5, marginTop: 2 },
  sectionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  segGroup: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  segSelected: { borderColor: colors.cyan, backgroundColor: 'rgba(0,194,255,0.10)' },
  segText: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  segTextSelected: { color: colors.text },
  about: { marginTop: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  aboutTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  aboutText: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
});
