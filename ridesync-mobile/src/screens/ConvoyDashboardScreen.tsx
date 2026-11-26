import React, { useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { buildInviteText, Member } from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { useRideTimer } from '../hooks/useRideTimer';
import { useUserLocation } from '../hooks/useUserLocation';
import { sendChat, setSos, setVoice } from '../store/slices/membersSlice';
import { formatDuration } from '../utils/format';
import { ConvoyMap, ConvoyMapHandle } from '../components/ConvoyMap';
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
 * The map follows the rider's REAL GPS position (expo-location) — recenter
 * and speed are live. There is no seeded trip, no seeded members and no
 * fake ETA: with no trip this screen says so, and with a trip the map
 * shows only your own position until other riders join on this device.
 * Chat and alerts start empty; SOS is shown on this device only.
 */
export function ConvoyDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { members, chat, alerts, rideSeconds, sosActive, voiceActive } = useAppSelector((s) => s.members);
  const { locationSharing } = useAppSelector((s) => s.settings);
  const currentTrip = useAppSelector((s) => s.trip.currentTrip);
  const user = useAppSelector((s) => s.auth.user);
  const [tab, setTab] = useState<Tab>('members');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [sosModal, setSosModal] = useState(false);
  const [draft, setDraft] = useState('');
  const [following, setFollowing] = useState(true);
  const mapRef = useRef<ConvoyMapHandle | null>(null);

  // The ride clock only runs while a real trip is live.
  useRideTimer(currentTrip !== null);
  const {
    coords: userCoords,
    status: gpsStatus,
    canAskAgain,
    speedKmh: gpsSpeedKmh,
    requestAgain,
  } = useUserLocation(locationSharing);

  // Speed on the gauge: real GPS speed when the device reports one, else 0.
  // No simulated speed any more — a ride that never happened has no speed.
  const displaySpeed = gpsSpeedKmh ?? 0;
  const speedIsGps = gpsSpeedKmh != null;

  const isLeader = !!currentTrip && !!user && currentTrip.leaderName === user.name;

  /** "You" as the one real member of this convoy, from live GPS only. */
  const youMember: Member = {
    id: 'you',
    name: user?.name ?? 'You',
    initials: user?.initials ?? 'Y',
    role: isLeader ? 'leader' : 'rider',
    status: 'online',
    speedKmh: gpsSpeedKmh,
    position: userCoords ? 'You · live GPS' : 'You · no GPS fix yet',
    lat: userCoords?.latitude ?? 0,
    lng: userCoords?.longitude ?? 0,
  };

  /** Recenter on the rider's live position, north-up, and resume following. */
  function handleRecenter() {
    setFollowing(true);
    mapRef.current?.recenterToUser();
  }

  /** Share the real trip's invite with the system sheet. Only rendered when a trip exists. */
  async function handleShare() {
    if (!currentTrip) return;
    try {
      await Share.share({ message: buildInviteText(currentTrip) });
    } catch {
      Alert.alert('Share failed', 'The invite could not be shared. Try again.');
    }
  }

  /** Denied banner action: ask again, or open device Settings when permanently denied. */
  function handleOpenLocationSettings() {
    if (canAskAgain) {
      requestAgain();
    } else {
      void Linking.openSettings();
    }
  }

  const gpsChipText =
    gpsStatus === 'granted'
      ? following
        ? 'GPS on — following you'
        : 'Map paused — tap ◎ to follow'
      : gpsStatus === 'requesting'
        ? 'Getting your location…'
        : gpsStatus === 'off'
          ? 'GPS off — turn on location'
          : gpsStatus === 'denied'
            ? 'Location permission denied'
            : 'Location permission needed';

  function confirmSos() {
    setSosModal(false);
    dispatch(setSos(true));
    Alert.alert(
      'SOS shown on this device',
      'Nobody was messaged. Real SOS delivery to your leader and emergency contacts arrives with the backend.',
    );
  }

  function sendMessage() {
    if (!draft.trim() || !user) return;
    dispatch(sendChat({ text: draft.trim(), author: user.name, initials: user.initials, isLeader }));
    setDraft('');
  }

  if (!currentTrip) {
    return (
      <View style={styles.root}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No trip selected</Text>
          <Text style={styles.emptyText}>
            There is no trip on this device yet. Create a trip or join one with an invite code, then come back here to
            ride with live GPS.
          </Text>
          <View style={{ height: 14 }} />
          <PrimaryButton title="Create a Trip" onPress={() => navigation.navigate('CreateTrip')} />
          <View style={{ height: 10 }} />
          <PrimaryButton title="Join a Trip" onPress={() => navigation.navigate('JoinTrip')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.mapArea}>
        <ConvoyMap
          ref={mapRef}
          members={members}
          satellite={satellite}
          userLocation={userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude } : null}
          followUser={following}
          onUserMoved={() => setFollowing(false)}
        />

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

        {gpsStatus === 'denied' ? (
          <View style={styles.gpsBanner}>
            <Text style={styles.gpsBannerText}>
              Location permission denied — enable it in Settings to see yourself on the map.
            </Text>
            <Pressable onPress={handleOpenLocationSettings} style={styles.gpsBannerBtn}>
              <Text style={styles.gpsBannerBtnText}>{canAskAgain ? 'Allow location' : 'Open Settings'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.gpsChip}>
            <View style={[styles.gpsDot, gpsStatus === 'granted' && styles.gpsDotOn]} />
            <Text style={styles.gpsChipText}>{gpsChipText}</Text>
          </View>
        )}

        {!userCoords && gpsStatus !== 'denied' ? (
          <View style={styles.noFixChip}>
            <Text style={styles.noFixText}>No GPS fix yet</Text>
          </View>
        ) : null}

        <View style={styles.sideControls}>
          <MapControls
            satellite={satellite}
            onRecenter={handleRecenter}
            onToggleSatellite={() => setSatellite((s) => !s)}
            onShare={handleShare}
          />
        </View>

        <View style={styles.gaugeWrap}>
          <SpeedGauge speedKmh={displaySpeed} />
          <Text style={[styles.speedSource, speedIsGps && styles.speedSourceGps]}>
            {speedIsGps ? 'GPS speed' : 'No GPS fix yet'}
          </Text>
        </View>

        <View style={styles.fabRow}>
          <VoiceButton active={voiceActive} onPress={() => dispatch(setVoice(!voiceActive))} />
          <SOSButton active={sosActive} onPress={() => setSosModal(true)} />
        </View>
        {voiceActive && <Text style={styles.voiceNote}>Voice is not connected yet — group voice arrives with the backend</Text>}
      </View>

      <View style={[styles.sheet, sheetExpanded && styles.sheetExpanded]}>
        <Pressable onPress={() => setSheetExpanded((e) => !e)} style={styles.handle} />
        <View style={styles.tabs}>
          {(['members', 'chat', 'alerts'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => { setTab(t); setSheetExpanded(true); }} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'members' ? `Members · ${members.length + 1}` : t === 'chat' ? 'Chat' : `Alerts · ${alerts.length}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.sheetBody}>
          {tab === 'members' && (
            <>
              <MemberCard member={youMember} />
              {members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
              {members.length === 0 && (
                <Text style={styles.emptyNote}>
                  No other riders in this convoy yet — share the invite link so riders can join on this device.
                </Text>
              )}
            </>
          )}
          {tab === 'chat' &&
            (chat.length === 0 ? (
              <Text style={styles.emptyNote}>No messages yet — say hello to the convoy.</Text>
            ) : (
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
              ))
            ))}
          {tab === 'alerts' &&
            (alerts.length === 0 ? (
              <Text style={styles.emptyNote}>No alerts yet.</Text>
            ) : (
              alerts.map((a) => (
                <View key={a.id} style={styles.alertRow}>
                  <Text style={styles.alertIcon}>⚠</Text>
                  <View>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    <Text style={styles.alertDetail}>{a.detail}</Text>
                  </View>
                </View>
              ))
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
              SOS is shown on this device only for now. Nobody is messaged yet — real SOS delivery to your convoy
              leader and emergency contacts arrives with the backend.
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSosModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmSos} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Show SOS</Text>
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
  gpsChip: { position: 'absolute', top: 66, left: 16, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(18,24,38,0.75)', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textFaint },
  gpsDotOn: { backgroundColor: colors.cyan },
  gpsChipText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  gpsBanner: { position: 'absolute', top: 66, left: 16, right: 16, backgroundColor: 'rgba(18,24,38,0.94)', borderWidth: 1, borderColor: colors.warning, borderRadius: 14, padding: 14 },
  gpsBannerText: { color: colors.text, fontSize: 12, lineHeight: 17 },
  gpsBannerBtn: { marginTop: 10, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  gpsBannerBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  noFixChip: { position: 'absolute', top: 104, left: 16, backgroundColor: 'rgba(18,24,38,0.75)', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  noFixText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  speedSource: { color: colors.textDim, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  speedSourceGps: { color: colors.cyan },
  gaugeWrap: { position: 'absolute', left: 16, bottom: 230, gap: 6 },
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
  emptyNote: { color: colors.textFaint, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
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
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 8 },
});
