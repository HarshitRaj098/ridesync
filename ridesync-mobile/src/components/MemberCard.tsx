import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Member } from '../data/mockData';
import { StatusBadge } from './StatusBadge';

const DOT: Record<Member['status'], string> = {
  online: colors.success,
  stopped: colors.warning,
  offline: colors.textFaint,
};

export function MemberCard({ member }: { member: Member }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{member.initials}</Text>
        <View style={[styles.statusDot, { backgroundColor: DOT[member.status] }]} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {member.name}
          {member.role === 'leader' && <Text style={styles.leaderTag}>  LEADER</Text>}
        </Text>
        <Text style={styles.detail}>
          {member.speedKmh !== null ? `${member.speedKmh} km/h · ` : ''}
          {member.position}
        </Text>
      </View>
      <StatusBadge status={member.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  initials: { color: colors.cyan, fontWeight: '700', fontSize: 13 },
  statusDot: { position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.backgroundAlt },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  leaderTag: { color: colors.cyan, fontSize: 9, fontWeight: '700' },
  detail: { color: colors.textDim, fontSize: 11, marginTop: 2 },
});
