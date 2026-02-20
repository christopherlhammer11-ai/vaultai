import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBubble } from '@mobile/components/chat/MessageBubble';
import { Composer } from '@mobile/components/chat/Composer';
import { sampleMessages } from '@mobile/data/sampleMessages';
import { useVaultSession } from '@mobile/providers/VaultSessionProvider';
import { palette } from '@mobile/theme/colors';
import { ChatMessage } from '@mobile/types/chat';
import { encrypt } from '@mobile/lib/crypto';

export default function ChatScreen() {
  const { sessionKey, lastUnlockedAt } = useVaultSession();
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [refreshing, setRefreshing] = useState(false);
  const [cipherPreview, setCipherPreview] = useState<string>('');

  const addMessage = useCallback(
    async (value: string) => {
      const outgoing: ChatMessage = {
        id: `${Date.now()}`,
        author: 'user',
        body: value,
        createdAt: new Date().toISOString(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, outgoing]);

      if (sessionKey) {
        try {
          const cipher = await encrypt(value, sessionKey);
          setCipherPreview(cipher.slice(0, 64) + '…');
        } catch (err) {
          console.error('encryption preview failed', err);
        }
      }
    },
    [sessionKey]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const headerSubtitle = useMemo(() => {
    if (!lastUnlockedAt) return 'Syncing private workspace';
    return `Unlocked ${new Date(lastUnlockedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [lastUnlockedAt]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.vaultTitle}>HammerLock AI</Text>
          <Text style={styles.vaultSubtitle}>{headerSubtitle}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusDot}>●</Text>
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MessageBubble message={item} />}
        refreshControl={<RefreshControl tintColor={palette.textMuted} refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {cipherPreview.length > 0 && (
        <View style={styles.cipherBanner}>
          <Text style={styles.cipherLabel}>Last payload encrypted preview:</Text>
          <Text style={styles.cipherValue}>{cipherPreview}</Text>
        </View>
      )}

      <Composer onSend={addMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaultTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  vaultSubtitle: {
    color: palette.textMuted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statusDot: {
    color: palette.accent,
    fontSize: 10,
  },
  statusText: {
    color: palette.textPrimary,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cipherBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  cipherLabel: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  cipherValue: {
    color: palette.textSecondary,
    fontFamily: 'Menlo',
    fontSize: 12,
  },
});
