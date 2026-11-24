import { StyleSheet } from 'react-native';
import { colors } from './colors';

export { colors } from './colors';
export * from './typography';

export const commonStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
