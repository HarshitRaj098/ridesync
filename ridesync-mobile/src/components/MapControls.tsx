import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onRecenter: () => void;
  onToggleSatellite: () => void;
  satellite: boolean;
  onShare: () => void;
}

/** Map side controls: compass/recenter, satellite toggle, share (Phase 1 doc: MapControls). */
export function MapControls({ onRecenter, onToggleSatellite, satellite, onShare }: Props) {
  return (
    <View style={styles.col}>
      <Pressable onPress={onRecenter} style={styles.btn}>
        <Text style={styles.icon}>◎</Text>
      </Pressable>
      <Pressable onPress={onToggleSatellite} style={[styles.btn, satellite && styles.activeBtn]}>
        <Text style={styles.icon}>🛰</Text>
      </Pressable>
      <Pressable onPress={onShare} style={styles.btn}>
        <Text style={styles.icon}>↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { flexDirection: 'column', gap: 10 },
  btn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(18,24,38,0.75)', borderColor: colors.borderStrong, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activeBtn: { borderColor: colors.cyan },
  icon: { color: colors.text, fontSize: 16 },
});
