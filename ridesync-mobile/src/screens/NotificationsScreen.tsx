import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { markAllRead, markRead } from '../store/slices/notificationsSlice';
import { NotificationCard } from '../components/NotificationCard';
import { AppHeader } from '../components/AppHeader';
import { SecondaryButton } from '../components/SecondaryButton';

/** Screen 9 — Notifications. */
export function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.notifications.items);
  const unread = items.filter((n) => n.unread).length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <AppHeader title="Notifications" />
      <View style={styles.sub}>
        <Text style={styles.count}>{unread} unread</Text>
        <SecondaryButton title="Mark all read" onPress={() => dispatch(markAllRead())} />
      </View>
      <View style={styles.list}>
        {items.map((n) => (
          <NotificationCard key={n.id} title={n.title} body={n.body} time={n.time} unread={n.unread} kind={n.kind} onPress={() => dispatch(markRead(n.id))} />
        ))}
        {items.length === 0 && <Text style={styles.empty}>No notifications.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  count: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20 },
  empty: { color: colors.textFaint, textAlign: 'center', marginTop: 40 },
});
