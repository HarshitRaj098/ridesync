import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

/** Translucent "glass" chip used over the live map (timer, controls). */
export function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(18,24,38,0.72)',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
