import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Member } from '../data/mockData';

/**
 * Web-safe map fallback — `ConvoyMap.web.tsx`.
 *
 * react-native-maps does not run on web, so this renders a styled dark
 * placeholder with the route line and member dots positioned from the same
 * mock coordinates as the native map. Run `npx expo start` and open the
 * app on a device/emulator (Expo Go) for the real live map.
 */

const MARKER_COLORS: Record<Member['status'], string> = {
  online: colors.cyan,
  stopped: colors.warning,
  offline: colors.textFaint,
};

interface Props {
  members: Member[];
  satellite: boolean;
}

export function ConvoyMap({ members }: Props) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.title}>🗺 Map preview (web fallback)</Text>
      <Text style={styles.text}>
        Live maps need a device or emulator — open this app in Expo Go. Member positions below use the same mock
        coordinates as the native map.
      </Text>
      <View style={styles.routeLine} />
      {members.map((m) => (
        <View key={m.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: m.role === 'leader' ? colors.primary : MARKER_COLORS[m.status] }]} />
          <Text style={styles.name}>
            {m.name}
            {m.role === 'leader' ? ' (Leader)' : ''} — {m.position}
          </Text>
        </View>
      ))}
      <Text style={styles.hint}>Bhopal · 23.2599° N, 77.4126° E</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0F1A', padding: 20, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  text: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  routeLine: { height: 2, backgroundColor: colors.cyan, opacity: 0.5, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text, fontSize: 13 },
  hint: { color: colors.textFaint, fontSize: 11, marginTop: 16 },
});
