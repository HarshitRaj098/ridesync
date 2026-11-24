import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/** Circular speed gauge, mirroring the HTML prototype's SVG gauge. */
export function SpeedGauge({ speedKmh }: { speedKmh: number }) {
  const pct = Math.min(speedKmh / 120, 1);
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { borderColor: colors.cyan, opacity: 0.25 + pct * 0.75 }]} />
      <View style={styles.center}>
        <Text style={styles.speed}>{speedKmh}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 104, height: 104, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 8, borderColor: colors.cyan },
  center: { alignItems: 'center' },
  speed: { color: colors.text, fontSize: 24, fontWeight: '700' },
  unit: { color: colors.textDim, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
});
