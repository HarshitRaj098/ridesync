import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { MemberStatus } from '../data/mockData';

const MAP: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  online: { label: 'Riding', color: colors.success, bg: 'rgba(34,197,94,0.12)' },
  stopped: { label: 'Stopped', color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  offline: { label: 'Offline', color: colors.textDim, bg: 'rgba(139,147,167,0.12)' },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const s = MAP[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
