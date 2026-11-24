import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const CHECKS = ['Checking GPS signal…', 'Checking internet…', 'Verifying session…'];

/** Screen 1 — Splash. Auto-advances after the checks complete (~2.6s, like the HTML prototype). */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setDoneCount(1), 500),
      setTimeout(() => setDoneCount(2), 1200),
      setTimeout(() => setDoneCount(3), 1900),
      setTimeout(onDone, 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <View style={styles.root}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>🏍</Text>
      </View>
      <Text style={styles.title}>RideSync</Text>
      <Text style={styles.tag}>Stay Connected.{'\n'}Never Get Lost.</Text>
      <View style={styles.checks}>
        {CHECKS.map((c, i) => (
          <View key={c} style={styles.checkRow}>
            <View style={[styles.dot, i < doneCount && styles.dotDone]} />
            <Text style={[styles.checkText, i < doneCount && styles.checkTextDone]}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  logo: { width: 84, height: 84, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 40 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  tag: { color: colors.textDim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  checks: { marginTop: 12, gap: 8, alignItems: 'flex-start' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textFaint },
  dotDone: { backgroundColor: colors.success },
  checkText: { color: colors.textFaint, fontSize: 12 },
  checkTextDone: { color: colors.textDim },
});
