import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onPress: () => void;
  active: boolean;
}

/** Push-to-talk voice button (Phase 1 doc: VoiceButton). */
export function VoiceButton({ onPress, active }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{active ? '● LIVE' : '🎙 PTT'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card, borderColor: colors.borderStrong, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  active: { borderColor: colors.cyan, backgroundColor: 'rgba(0,194,255,0.15)' },
  text: { color: colors.cyan, fontWeight: '700', fontSize: 11 },
  activeText: { color: colors.cyan },
});
