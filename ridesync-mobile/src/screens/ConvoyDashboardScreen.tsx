import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { TRIP } from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { useRideTimer } from '../hooks/useRideTimer';
import { sendChat, setSos, setVoice } from '../store/slices/membersSlice';
import { formatDuration } from '../utils/format';
import { ConvoyMap } from '../components/ConvoyMap';
import { SpeedGauge } from '../components/SpeedGauge';
import { MapControls } from '../components/MapControls';
import { SOSButton } from '../components/SOSButton';
import { VoiceButton } from '../components/VoiceButton';
import { GlassCard } from '../components/GlassCard';
import { MemberCard } from '../components/MemberCard';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';

type Tab = 'members' | 'chat' | 'alerts';

/**
 * Screen 7 — Convoy Dashboard (the core screen).
 * Live map with leader/member markers + route, speed + ETA, bottom sheet
 * with Members / Chat / Alerts, SOS and Push-to-Talk.
 * Live data is simulated (useRideTimer + socketService mock); see README.
 */
export function ConvoyDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { members, chat, alerts, speedKmh, rideSeconds, sosActive, voiceActive } = useAppSelector((s) => s.members);
  const [tab, setTab] = useState<Tab>('members');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [sosModal, setSosModal] = useState(false);
  const [draft, setDraft] = useState('');

  useRideTimer(true);

  const remainingKm = Math.max(0, TRIP.distanceKm - Math.floor(rideSeconds / 60) * 1);
  const etaMin = speedKmh > 0 ? Math.round((remainingKm / speedKmh) * 60) : 0;

  function confirmSos() {
    setSosModal(false);
    dispatch(setSos(true));
    Alert.alert('🚨 SOS broadcast', 'Your live location was broadcast to the convoy leader, emergency contacts and nearby riders (mock).');
  }

  function sendMessage() {
    if (!draft.trim()) return;
    dispatch(sendChat({ text: draft.trim() }));
    setDraft('');
  }

  return (
    <View style={styles.root}>
      <View style={styles.mapArea}>
        <ConvoyMap members={members} satellite={satellite} />

        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Text style={styles.circleText}>‹</Text>
          </Pressable>
          <GlassCard>
            <Text style={styles.timer}>● {formatDuration(rideSeconds)}</Text>
          </GlassCard>
          <Pressable onPress={() => navigation.navigate('LeaderDashboard')} style={styles.circleBtn}>
            <Text style={styles.circleText}>⭐</Text>
          </Pressable>
        </View>

        <View style={styles.sideControls}>
          <MapControls
            satellite={satellite}
            onRecenter={() => Alert.alert('Recentered', 'Map centered on your position (mock).')}
            onToggleSatellite={() => setSatellite((s) => !s)}
            onShare={() => Alert.alert('Live location shared', 'Your live location link was shared with the convoy (mock).')}
          />
        </View>

        <View style={styles.gaugeWrap}>
          <SpeedGauge speedKmh={speedKmh} />
          <Text style={styles.eta}>ETA {Math.floor(etaMin / 60)}h {etaMin % 60}m · {remainingKm} km left</Text>
        </View>

        <View style={styles.fabRow}>
          <VoiceButton active={voiceActive} onPress={() => dispatch(setVoice(!voiceActive))} />
          <SOSButton active={sosActive} onPress={() => setSosModal(true)} />
        </View>
        {voiceActive && <Text style={styles.voiceNote}>Push-to-talk live — hold to speak (mock)</Text>}
      </View>

      <View style={[styles.sheet, sheetExpanded && styles.sheetExpanded]}>
        <Pressable onPress={() => setSheetExpanded((e) => !e)} style={styles.handle} />
        <View style={styles.tabs}>
          {(['members', 'chat', 'alerts'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => { setTab(t); setSheetExpanded(true); }} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'members' ? `Members · ${TRIP.riderCount}` : t === 'chat' ? 'Chat' : `Alerts · ${alerts.length}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.sheetBody}>
          {tab === 'members' && members.map((m) => <MemberCard key={m.id} member={m} />)}
          {tab === 'chat' &&
            chat.map((msg) => (
              <View key={msg.id} style={styles.chatMsg}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatInitials}>{msg.initials}</Text>
                </View>
                <View>
                  <Text style={styles.chatAuthor}>
                    {msg.author}
                    {msg.isLeader ? ' (Leader)' : ''}
                  </Text>
                  <Text style={styles.chatText}>{msg.text}</Text>
                </View>
              </View>
            ))}
          {tab === 'alerts' &&
            alerts.map((a) => (
              <View key={a.id} style={styles.alertRow}>
                <Text style={styles.alertIcon}>⚠</Text>
                <View>
                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <Text style={styles.alertDetail}>{a.detail}</Text>
                </View>
              </View>
            ))}
        </ScrollView>

        {tab === 'chat' && (
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Message the convoy…"
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={sendMessage}
            />
            <Pressable onPress={sendMessage} style={styles.sendBtn}>
              <Text style={{ color: colors.white }}>➤</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal visible={sosModal} transparent animationType="slide" onRequestClose={() => setSosModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⚠</Text>
            <Text style={styles.modalTitle}>Send Emergency SOS?</Text>
            <Text style={styles.modalText}>
              Your live location and vehicle details will be broadcast to your convoy leader, emergency contacts and nearby riders immediately.
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSosModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmSos} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Send SOS</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  mapArea: { flex: 1, position: 'relative' },
  topRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  circleBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(18,24,38,0.75)', borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  circleText: { color: colors.text, fontSize: 18 },
  timer: { color: colors.text, fontSize: 13, fontWeight: '600' },
  sideControls: { position: 'absolute', right: 16, top: 74 },
  gaugeWrap: { position: 'absolute', left: 16, bottom: 230, gap: 6 },
  eta: { color: colors.textDim, fontSize: 11, backgroundColor: 'rgba(18,24,38,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  fabRow: { position: 'absolute', left: 16, right: 16, bottom: 220, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voiceNote: { position: 'absolute', left: 16, bottom: 200, color: colors.cyan, fontSize: 11, fontWeight: '600' },
  sheet: { height: 210, backgroundColor: 'rgba(13,17,28,0.95)', borderTopWidth: 1, borderTopColor: colors.borderStrong, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 8 },
  sheetExpanded: { height: '72%' },
  handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: colors.borderStrong, alignSelf: 'center', marginVertical: 10 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.card2 },
  tabText: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  sheetBody: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  chatMsg: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  chatAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  chatInitials: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
  chatAuthor: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  chatText: { color: colors.textDim, fontSize: 13, backgroundColor: colors.card, padding: 9, borderRadius: 12, marginTop: 3 },
  alertRow: { flexDirection: 'row', gap: 10, padding: 11, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.07)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', marginBottom: 10 },
  alertIcon: { fontSize: 16 },
  alertTitle: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  alertDetail: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  chatInputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  chatInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 11, color: colors.text, fontSize: 13 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,5,10,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card2, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  modalIcon: { fontSize: 28, marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  modalText: { color: colors.textDim, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center' },
  cancelText: { color: colors.textDim, fontWeight: '700' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center' },
  confirmText: { color: colors.white, fontWeight: '700' },
});
