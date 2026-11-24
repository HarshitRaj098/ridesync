export const colors = {
  primary: '#007BFF',
  cyan: '#00C2FF',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#080B12',
  backgroundAlt: '#0D111C',
  card: '#121826',
  card2: '#161D2D',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F7FA',
  textDim: '#8B93A7',
  textFaint: '#5A6178',
  white: '#FFFFFF',
} as const;

export type Colors = typeof colors;
