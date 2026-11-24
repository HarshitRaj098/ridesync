import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: 'warning' | 'weather' | 'info';
  onPress?: () => void;
}

const KIND_COLOR: Record<Props['kind'], string> = {
  warning: colors.warning,
  weather: colors.cyan,
  info: colors.primary,
};

export function NotificationCard({ title, body, time, unread, kind, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, unread && styles.unread]}>
      <View style={[styles.icon, { backgroundColor: `${KIND_COLOR[kind]}22` }]}>
        <Text style={{ color: KIND_COLOR[kind], fontSize: 16 }}>!</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{body}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {unread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  unread: { borderColor: colors.borderStrong },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
  text: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  time: { color: colors.textFaint, fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 },
});
