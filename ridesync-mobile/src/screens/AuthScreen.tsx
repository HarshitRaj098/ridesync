import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { setMode, signIn } from '../store/slices/authSlice';
import { authService } from '../services/mockServices';
import { colors } from '../theme/colors';
import { InputField } from '../components/InputField';
import { PasswordField } from '../components/PasswordField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';

/** Screen 2 — Login / Register (mock auth; TODO: real JWT via api/authService). */
export function AuthScreen() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.auth.mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password.trim() || (mode === 'register' && !name.trim())) {
      Alert.alert('Missing details', 'Please fill in all fields.');
      return;
    }
    setBusy(true);
    try {
      const user =
        mode === 'login'
          ? await authService.signIn(email, password)
          : await authService.register(name, email, password);
      dispatch(signIn({ name: user.name, email: user.email }));
    } catch {
      Alert.alert('Sign-in failed', 'Mock auth failed — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.logo}>
        <Text style={styles.logoText}>🏍</Text>
      </View>
      <Text style={styles.title}>RideSync</Text>
      <Text style={styles.tag}>Stay Connected. Never Get Lost.</Text>

      <View style={styles.tabs}>
        <Pressable onPress={() => dispatch(setMode('login'))} style={[styles.tab, mode === 'login' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
        </Pressable>
        <Pressable onPress={() => dispatch(setMode('register'))} style={[styles.tab, mode === 'register' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Register</Text>
        </Pressable>
      </View>

      {mode === 'register' && <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Sameer Khan" autoCapitalize="words" />}
      <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
      <PasswordField label="Password" value={password} onChangeText={setPassword} />

      <PrimaryButton title={busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'} onPress={submit} disabled={busy} />
      <View style={{ height: 10 }} />
      <SecondaryButton title="Continue as Guest (mock)" onPress={() => dispatch(signIn({ name: 'Sameer Khan', email: 'guest@ridesync.app' }))} />
      <Text style={styles.note}>Mock auth only — no real account is created. Real login will use the Node.js backend.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 64 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 30 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  tag: { color: colors.textDim, fontSize: 13, marginBottom: 24 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { borderColor: colors.cyan, backgroundColor: 'rgba(0,194,255,0.10)' },
  tabText: { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.text },
  note: { color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 16 },
});
