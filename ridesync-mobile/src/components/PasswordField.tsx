import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}

export function PasswordField({ label, value, onChangeText }: Props) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={colors.textFaint}
          secureTextEntry={hidden}
        />
        <Pressable onPress={() => setHidden((h) => !h)}>
          <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingRight: 14 },
  input: { flex: 1, padding: 14, color: colors.text, fontSize: 14 },
  toggle: { color: colors.cyan, fontWeight: '600', fontSize: 13 },
});
