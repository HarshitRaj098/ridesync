import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Member } from '../data/mockData';
import type { ConvoyMapHandle, UserLocation } from './ConvoyMap.native';

/**
 * Web-safe map fallback — `ConvoyMap.web.tsx`.
 *
 * react-native-maps does not run on web, so this renders a styled dark
 * placeholder. Run `npx expo start` and open the app on a device/emulator
 * (Expo Go) for the real live map.
 *
 * GPS follow, recenter and live speed are device-only: on web this is a
 * preview, never your real location. Member positions are shown only for
 * real members of the trip on this device — the list starts empty.
 */

const MARKER_COLORS: Record<Member['status'], string> = {
  online: colors.cyan,
  stopped: colors.warning,
  offline: colors.textFaint,
};

interface Props {
  members: Member[];
  satellite: boolean;
  userLocation: UserLocation | null;
  followUser: boolean;
  onUserMoved: () => void;
}

export const ConvoyMap = forwardRef<ConvoyMapHandle, Props>(function ConvoyMap({ members }: Props, _ref) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.title}>🗺 Map preview (web fallback)</Text>
      <Text style={styles.text}>
        Live maps need a device or emulator — open this app in Expo Go. GPS follow, recenter and live speed are
        device-only and do not work on web — this is a preview, not your real location.
      </Text>
      {members.length === 0 ? (
        <Text style={styles.text}>No trip selected, or no other riders in this convoy yet.</Text>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0F1A', padding: 20, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  text: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  routeLine: { height: 2, backgroundColor: colors.cyan, opacity: 0.5, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text, fontSize: 13 },
});
