import React, { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '@mobile/components/core/Button';
import { SurfaceCard } from '@mobile/components/core/SurfaceCard';
import { useVaultSession } from '@mobile/providers/VaultSessionProvider';
import { palette } from '@mobile/theme/colors';

export default function UnlockScreen() {
  const { status, unlockError, unlockWithBiometrics, unlockWithPassphrase } = useVaultSession();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = status === 'unlocking';
  const error = unlockError ?? localError;

  const handleBiometric = useCallback(async () => {
    setLocalError(null);
    try {
      await unlockWithBiometrics();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [unlockWithBiometrics]);

  const handlePassphrase = useCallback(async () => {
    setLocalError(null);
    try {
      await unlockWithPassphrase(passphrase);
      setPassphrase('');
      Keyboard.dismiss();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLocalError('Passphrase mismatch. Hint: check the project README.');
    }
  }, [passphrase, unlockWithPassphrase]);

  const subtitle = useMemo(() => {
    if (busy) return 'Authenticating…';
    if (error) return error;
    return 'Secure • Face ID ready';
  }, [busy, error]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient style={styles.background} colors={[palette.background, '#030406']}>        
        <View style={styles.content}>
          <SurfaceCard variant="elevated" style={styles.card}>
            <Text style={styles.vaultLabel}>HammerLock AI</Text>
            <Text style={styles.title}>Unlock your vault</Text>
            <Text style={[styles.subtitle, error && { color: palette.danger }]}>{subtitle}</Text>

            <Button
              label={busy ? 'Unlocking…' : 'Unlock with Face ID'}
              loading={busy}
              onPress={handleBiometric}
              style={{ marginTop: 24 }}
            />

            {!showPassphrase && (
              <TouchableOpacity onPress={() => setShowPassphrase(true)} style={{ marginTop: 18 }}>
                <Text style={styles.link}>Use vault passphrase</Text>
              </TouchableOpacity>
            )}

            {showPassphrase && (
              <View style={{ marginTop: 24, width: '100%' }}>
                <TextInput
                  placeholder="Enter passphrase"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={passphrase}
                  onChangeText={setPassphrase}
                  style={styles.input}
                  editable={!busy}
                />
                <Button
                  label="Unlock with passphrase"
                  variant="secondary"
                  onPress={handlePassphrase}
                  disabled={!passphrase || busy}
                  style={{ marginTop: 12 }}
                />
                <Text style={styles.hint}>Demo secret: “vault-demo-passphrase”.</Text>
              </View>
            )}
          </SurfaceCard>

          <Text style={styles.footer}>HammerLock AI · Local-first encryption · v0.1.0</Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  vaultLabel: {
    color: palette.textMuted,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    color: palette.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: palette.textSecondary,
  },
  link: {
    color: palette.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  input: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.textPrimary,
    backgroundColor: palette.surface,
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: palette.textMuted,
  },
  footer: {
    marginTop: 32,
    color: palette.textMuted,
    fontSize: 13,
  },
});
