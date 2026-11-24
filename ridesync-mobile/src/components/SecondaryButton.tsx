import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
}

export function SecondaryButton({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: 'transparent', borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  text: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
});
