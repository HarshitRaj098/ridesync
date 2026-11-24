import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onPress: () => void;
  active?: boolean;
}

/** Big red SOS floating button (Phase 1 doc: SOSButton). */
export function SOSButton({ onPress, active }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, active && styles.active]}>
      <Text style={styles.text}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: colors.danger, shadowOpacity: 0.55, shadowRadius: 16, elevation: 6 },
  active: { backgroundColor: '#B91C1C' },
  text: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
});
