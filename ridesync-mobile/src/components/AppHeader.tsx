import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

/** Top bar used across screens (Phase 1 doc: AppHeader). */
export function AppHeader({ title, showBack, right }: Props) {
  const navigation = useNavigation();
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {showBack && (
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22, lineHeight: 24 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
